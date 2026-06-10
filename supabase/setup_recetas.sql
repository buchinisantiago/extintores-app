-- 1. Crear tabla sku_recetas
CREATE TABLE IF NOT EXISTS sku_recetas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku_id UUID NOT NULL REFERENCES skus(id) ON DELETE CASCADE,
    mp_id UUID NOT NULL REFERENCES stock_mp(id) ON DELETE CASCADE,
    cantidad_necesaria NUMERIC NOT NULL CHECK (cantidad_necesaria > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Actualizar función crear_venta
CREATE OR REPLACE FUNCTION crear_venta(
    p_cliente_id UUID,
    p_total NUMERIC,
    p_items JSONB,
    p_metodo_pago TEXT DEFAULT NULL,
    p_observaciones TEXT DEFAULT NULL,
    p_nro_factura TEXT DEFAULT NULL,
    p_estado_pago TEXT DEFAULT 'Pendiente',
    p_vendedor_id UUID DEFAULT NULL
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
    INSERT INTO ventas (cliente_id, total, metodo_pago, observaciones, nro_factura, estado_pago, vendedor_id)
    VALUES (p_cliente_id, p_total, p_metodo_pago, p_observaciones, p_nro_factura, p_estado_pago, p_vendedor_id) 
    RETURNING id INTO v_venta_id;

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
            -- Descontar de stock_terminado
            UPDATE stock_terminado 
            SET cantidad = cantidad - v_cantidad, ultima_actualizacion = NOW() 
            WHERE sku_id = v_sku_id;
        END IF;

        -- Nuevo: Descontar de stock_mp basándose en la receta (si existe)
        FOR receta IN SELECT mp_id, cantidad_necesaria FROM sku_recetas WHERE sku_id = v_sku_id
        LOOP
            UPDATE stock_mp 
            SET cantidad = cantidad - (receta.cantidad_necesaria * v_cantidad), 
                ultima_actualizacion = NOW() 
            WHERE id = receta.mp_id;
        END LOOP;

    END LOOP;

    RETURN v_venta_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Actualizar función convertir_presupuesto_a_venta
CREATE OR REPLACE FUNCTION convertir_presupuesto_a_venta(p_presupuesto_id UUID)
RETURNS UUID AS $$
DECLARE
    v_presupuesto RECORD;
    v_venta_id UUID;
    item RECORD;
    v_es_servicio BOOLEAN;
    receta RECORD;
BEGIN
    -- 1. Obtener datos del presupuesto
    SELECT * INTO v_presupuesto FROM presupuestos WHERE id = p_presupuesto_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Presupuesto no encontrado';
    END IF;

    IF v_presupuesto.estado = 'Aprobado' THEN
        RAISE EXCEPTION 'El presupuesto ya fue convertido a venta anteriormente.';
    END IF;

    -- 2. Crear la venta
    INSERT INTO ventas (cliente_id, total, vendedor_id, estado_pago, fecha)
    VALUES (v_presupuesto.cliente_id, v_presupuesto.total, v_presupuesto.vendedor_id, 'Pendiente', NOW())
    RETURNING id INTO v_venta_id;

    -- 3. Copiar items y descontar stock (terminado y MP)
    FOR item IN SELECT * FROM presupuesto_items WHERE presupuesto_id = p_presupuesto_id
    LOOP
        INSERT INTO venta_items (venta_id, sku_id, cantidad, precio_unitario)
        VALUES (v_venta_id, item.sku_id, item.cantidad, item.precio_unitario);

        SELECT es_servicio INTO v_es_servicio FROM skus WHERE id = item.sku_id;

        IF NOT v_es_servicio THEN
            -- Descontar de stock_terminado
            UPDATE stock_terminado 
            SET cantidad = cantidad - item.cantidad, ultima_actualizacion = NOW() 
            WHERE sku_id = item.sku_id;
        END IF;

        -- Descontar de stock_mp basándose en la receta
        FOR receta IN SELECT mp_id, cantidad_necesaria FROM sku_recetas WHERE sku_id = item.sku_id
        LOOP
            UPDATE stock_mp 
            SET cantidad = cantidad - (receta.cantidad_necesaria * item.cantidad), 
                ultima_actualizacion = NOW() 
            WHERE id = receta.mp_id;
        END LOOP;
    END LOOP;

    -- 4. Marcar presupuesto como aprobado
    UPDATE presupuestos SET estado = 'Aprobado' WHERE id = p_presupuesto_id;

    RETURN v_venta_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
