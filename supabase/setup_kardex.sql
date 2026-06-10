-- 1. Crear tabla de Movimientos (Kardex)
CREATE TABLE IF NOT EXISTS movimientos_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tipo_entidad TEXT NOT NULL CHECK (tipo_entidad IN ('MP', 'SKU')),
    entidad_id UUID NOT NULL,
    tipo_movimiento TEXT NOT NULL, -- Ej: 'Venta', 'Reposición', 'Ajuste Manual'
    cantidad NUMERIC NOT NULL,     -- Puede ser positivo o negativo
    referencia_id UUID,            -- ID de la venta o de la reposición
    observaciones TEXT             -- Opcional, para el detalle
);

ALTER TABLE movimientos_stock DISABLE ROW LEVEL SECURITY;

-- 2. Modificar crear_venta para que registre los movimientos
CREATE OR REPLACE FUNCTION crear_venta(
    p_cliente_id UUID,
    p_total NUMERIC,
    p_items JSONB
)
RETURNS UUID AS $$
DECLARE
    v_venta_id UUID;
    item JSONB;
    v_sku_id UUID;
    v_cantidad INT;
    v_precio_unitario NUMERIC;
    v_nro_serie TEXT;
    v_es_servicio BOOLEAN;
    receta RECORD;
BEGIN
    INSERT INTO ventas (cliente_id, total) VALUES (p_cliente_id, p_total) RETURNING id INTO v_venta_id;

    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_sku_id := (item->>'sku_id')::UUID;
        v_cantidad := (item->>'cantidad')::INT;
        v_precio_unitario := (item->>'precio_unitario')::NUMERIC;
        v_nro_serie := item->>'nro_serie';

        INSERT INTO venta_items (venta_id, sku_id, cantidad, precio_unitario, nro_serie)
        VALUES (v_venta_id, v_sku_id, v_cantidad, v_precio_unitario, v_nro_serie);

        SELECT es_servicio INTO v_es_servicio FROM skus WHERE id = v_sku_id;

        IF NOT v_es_servicio THEN
            -- Actualizar stock
            UPDATE stock_terminado SET cantidad = cantidad - v_cantidad, ultima_actualizacion = NOW() WHERE sku_id = v_sku_id;
            
            -- Registrar Kardex (Salida por Venta)
            INSERT INTO movimientos_stock (tipo_entidad, entidad_id, tipo_movimiento, cantidad, referencia_id, observaciones)
            VALUES ('SKU', v_sku_id, 'Venta', -v_cantidad, v_venta_id, 'Descuento por venta directa');
        END IF;

        -- Descontar materia prima según recetas
        FOR receta IN SELECT mp_id, cantidad_necesaria FROM sku_recetas WHERE sku_id = v_sku_id
        LOOP
            UPDATE stock_mp SET cantidad = cantidad - (receta.cantidad_necesaria * v_cantidad) WHERE id = receta.mp_id;
            
            -- Registrar Kardex (Salida por Consumo de Receta)
            INSERT INTO movimientos_stock (tipo_entidad, entidad_id, tipo_movimiento, cantidad, referencia_id, observaciones)
            VALUES ('MP', receta.mp_id, 'Consumo (Venta)', -(receta.cantidad_necesaria * v_cantidad), v_venta_id, 'Consumido en receta de venta');
        END LOOP;
    END LOOP;

    RETURN v_venta_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Modificar convertir_presupuesto_a_venta
CREATE OR REPLACE FUNCTION convertir_presupuesto_a_venta(p_presupuesto_id UUID)
RETURNS UUID AS $$
DECLARE
    v_presupuesto RECORD;
    v_venta_id UUID;
    item RECORD;
    v_es_servicio BOOLEAN;
    receta RECORD;
BEGIN
    SELECT * INTO v_presupuesto FROM presupuestos WHERE id = p_presupuesto_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Presupuesto no encontrado'; END IF;
    IF v_presupuesto.estado = 'Aprobado' THEN RAISE EXCEPTION 'El presupuesto ya fue convertido a venta anteriormente.'; END IF;

    INSERT INTO ventas (cliente_id, total, vendedor_id, estado_pago, fecha)
    VALUES (v_presupuesto.cliente_id, v_presupuesto.total, v_presupuesto.vendedor_id, 'Pendiente', NOW())
    RETURNING id INTO v_venta_id;

    FOR item IN SELECT * FROM presupuesto_items WHERE presupuesto_id = p_presupuesto_id
    LOOP
        INSERT INTO venta_items (venta_id, sku_id, cantidad, precio_unitario)
        VALUES (v_venta_id, item.sku_id, item.cantidad, item.precio_unitario);

        SELECT es_servicio INTO v_es_servicio FROM skus WHERE id = item.sku_id;

        IF NOT v_es_servicio THEN
            UPDATE stock_terminado SET cantidad = cantidad - item.cantidad, ultima_actualizacion = NOW() WHERE sku_id = item.sku_id;
            
            INSERT INTO movimientos_stock (tipo_entidad, entidad_id, tipo_movimiento, cantidad, referencia_id, observaciones)
            VALUES ('SKU', item.sku_id, 'Venta (Presupuesto)', -item.cantidad, v_venta_id, 'Venta generada desde presupuesto');
        END IF;

        FOR receta IN SELECT mp_id, cantidad_necesaria FROM sku_recetas WHERE sku_id = item.sku_id
        LOOP
            UPDATE stock_mp SET cantidad = cantidad - (receta.cantidad_necesaria * item.cantidad) WHERE id = receta.mp_id;
            
            INSERT INTO movimientos_stock (tipo_entidad, entidad_id, tipo_movimiento, cantidad, referencia_id, observaciones)
            VALUES ('MP', receta.mp_id, 'Consumo (Venta)', -(receta.cantidad_necesaria * item.cantidad), v_venta_id, 'Consumido en receta por venta de ppto.');
        END LOOP;
    END LOOP;

    UPDATE presupuestos SET estado = 'Aprobado' WHERE id = p_presupuesto_id;
    RETURN v_venta_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Modificar registrar_reposicion
CREATE OR REPLACE FUNCTION registrar_reposicion(
    p_observaciones TEXT,
    p_items JSONB
)
RETURNS UUID AS $$
DECLARE
    v_reposicion_id UUID;
    item JSONB;
    v_tipo_entidad TEXT;
    v_entidad_id UUID;
    v_cantidad NUMERIC;
BEGIN
    INSERT INTO reposiciones (observaciones, fecha) VALUES (p_observaciones, NOW()) RETURNING id INTO v_reposicion_id;

    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_tipo_entidad := item->>'tipo_entidad';
        v_entidad_id := (item->>'entidad_id')::UUID;
        v_cantidad := (item->>'cantidad')::NUMERIC;

        INSERT INTO reposicion_items (reposicion_id, tipo_entidad, entidad_id, cantidad)
        VALUES (v_reposicion_id, v_tipo_entidad, v_entidad_id, v_cantidad);

        IF v_tipo_entidad = 'MP' THEN
            UPDATE stock_mp SET cantidad = cantidad + v_cantidad WHERE id = v_entidad_id;
            
            INSERT INTO movimientos_stock (tipo_entidad, entidad_id, tipo_movimiento, cantidad, referencia_id, observaciones)
            VALUES ('MP', v_entidad_id, 'Reposición', v_cantidad, v_reposicion_id, p_observaciones);
            
        ELSIF v_tipo_entidad = 'SKU' THEN
            UPDATE stock_terminado SET cantidad = cantidad + v_cantidad, ultima_actualizacion = NOW() WHERE sku_id = v_entidad_id;
            
            INSERT INTO movimientos_stock (tipo_entidad, entidad_id, tipo_movimiento, cantidad, referencia_id, observaciones)
            VALUES ('SKU', v_entidad_id, 'Reposición', v_cantidad, v_reposicion_id, p_observaciones);
        END IF;
    END LOOP;

    RETURN v_reposicion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
