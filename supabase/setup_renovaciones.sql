-- 1. Modificar función crear_venta
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
    
    v_renovacion_carga INT;
    v_renovacion_ph INT;
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
        
        -- Safe coalesce for renewal years
        IF item->>'renovacion_carga_anios' IS NULL THEN
            v_renovacion_carga := 0;
        ELSE
            v_renovacion_carga := (item->>'renovacion_carga_anios')::INT;
        END IF;

        IF item->>'renovacion_ph_anios' IS NULL THEN
            v_renovacion_ph := 0;
        ELSE
            v_renovacion_ph := (item->>'renovacion_ph_anios')::INT;
        END IF;

        INSERT INTO venta_items (venta_id, sku_id, cantidad, precio_unitario, nro_serie)
        VALUES (v_venta_id, v_sku_id, v_cantidad, v_precio_unitario, v_nro_serie);

        SELECT es_servicio INTO v_es_servicio FROM skus WHERE id = v_sku_id;

        IF NOT v_es_servicio THEN
            -- Descontar de stock_terminado
            UPDATE stock_terminado 
            SET cantidad = cantidad - v_cantidad, ultima_actualizacion = NOW() 
            WHERE sku_id = v_sku_id;
        END IF;

        -- Descontar de stock_mp basándose en la receta (si existe)
        FOR receta IN SELECT mp_id, cantidad_necesaria FROM sku_recetas WHERE sku_id = v_sku_id
        LOOP
            UPDATE stock_mp 
            SET cantidad = cantidad - (receta.cantidad_necesaria * v_cantidad), 
                ultima_actualizacion = NOW() 
            WHERE id = receta.mp_id;
        END LOOP;

        -- LÓGICA DE ACTUALIZACIÓN DE EXTINTORES AUTOMÁTICA
        IF v_nro_serie IS NOT NULL AND v_nro_serie != '' THEN
            IF EXISTS (SELECT 1 FROM extintores WHERE nro_cilindro = v_nro_serie AND cliente_id = p_cliente_id) THEN
                -- Actualizar extintor existente
                UPDATE extintores
                SET 
                    vencimiento_carga = CASE WHEN v_renovacion_carga > 0 THEN (NOW() + (v_renovacion_carga || ' years')::INTERVAL)::DATE ELSE vencimiento_carga END,
                    vencimiento_ph = CASE WHEN v_renovacion_ph > 0 THEN (NOW() + (v_renovacion_ph || ' years')::INTERVAL)::DATE ELSE vencimiento_ph END,
                    ultima_revision = CASE WHEN (v_renovacion_carga > 0 OR v_renovacion_ph > 0) THEN NOW() ELSE ultima_revision END
                WHERE nro_cilindro = v_nro_serie AND cliente_id = p_cliente_id;
            ELSE
                -- Crear nuevo extintor
                INSERT INTO extintores (
                    nro_cilindro, 
                    cliente_id, 
                    vencimiento_carga, 
                    vencimiento_ph, 
                    ultima_revision, 
                    marca, 
                    capacidad_kg, 
                    tipo_agente
                )
                VALUES (
                    v_nro_serie, 
                    p_cliente_id, 
                    (NOW() + (GREATEST(v_renovacion_carga, 1) || ' years')::INTERVAL)::DATE, 
                    (NOW() + (GREATEST(v_renovacion_ph, 5) || ' years')::INTERVAL)::DATE, 
                    NOW(),
                    'Vendido por Sistema', 
                    (SELECT capacidad_kg FROM skus WHERE id = v_sku_id LIMIT 1), 
                    (SELECT tipo_agente FROM skus WHERE id = v_sku_id LIMIT 1)
                );
            END IF;
        END IF;

    END LOOP;

    RETURN v_venta_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Modificar la función crear_presupuesto
CREATE OR REPLACE FUNCTION crear_presupuesto(
    p_cliente_id UUID,
    p_total NUMERIC,
    p_items JSONB,
    p_observaciones TEXT DEFAULT NULL,
    p_vendedor_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_presupuesto_id UUID;
    item JSONB;
BEGIN
    INSERT INTO presupuestos (cliente_id, total, observaciones, vendedor_id)
    VALUES (p_cliente_id, p_total, p_observaciones, p_vendedor_id) 
    RETURNING id INTO v_presupuesto_id;

    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO presupuesto_items (presupuesto_id, sku_id, cantidad, precio_unitario, nro_serie)
        VALUES (
            v_presupuesto_id, 
            (item->>'sku_id')::UUID, 
            (item->>'cantidad')::INT, 
            (item->>'precio_unitario')::NUMERIC,
            item->>'nro_serie'
        );
    END LOOP;

    -- Update presupuestos to store renovacion info in items using jsonb if needed, 
    -- but actually we need to alter presupuesto_items table to store renovacion fields or store it in jsonb.
    -- Since modifying table is harder, let's just use the nro_serie for now, wait...
    -- In presupuesto_items we don't have renovacion fields. 
    -- Let's ALTER TABLE presupuesto_items ADD COLUMN IF NOT EXISTS renovacion_carga_anios INT DEFAULT 1;
    -- ALTER TABLE presupuesto_items ADD COLUMN IF NOT EXISTS renovacion_ph_anios INT DEFAULT 0;

    RETURN v_presupuesto_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Add columns to presupuesto_items
ALTER TABLE presupuesto_items ADD COLUMN IF NOT EXISTS renovacion_carga_anios INT DEFAULT 1;
ALTER TABLE presupuesto_items ADD COLUMN IF NOT EXISTS renovacion_ph_anios INT DEFAULT 0;

-- 4. Re-create crear_presupuesto to use new columns
CREATE OR REPLACE FUNCTION crear_presupuesto(
    p_cliente_id UUID,
    p_total NUMERIC,
    p_items JSONB,
    p_observaciones TEXT DEFAULT NULL,
    p_vendedor_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_presupuesto_id UUID;
    item JSONB;
BEGIN
    INSERT INTO presupuestos (cliente_id, total, observaciones, vendedor_id)
    VALUES (p_cliente_id, p_total, p_observaciones, p_vendedor_id) 
    RETURNING id INTO v_presupuesto_id;

    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO presupuesto_items (presupuesto_id, sku_id, cantidad, precio_unitario, nro_serie, renovacion_carga_anios, renovacion_ph_anios)
        VALUES (
            v_presupuesto_id, 
            (item->>'sku_id')::UUID, 
            (item->>'cantidad')::INT, 
            (item->>'precio_unitario')::NUMERIC,
            item->>'nro_serie',
            COALESCE((item->>'renovacion_carga_anios')::INT, 1),
            COALESCE((item->>'renovacion_ph_anios')::INT, 0)
        );
    END LOOP;

    RETURN v_presupuesto_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Modificar convertir_presupuesto_a_venta
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

    -- 3. Copiar items y descontar stock
    FOR item IN SELECT * FROM presupuesto_items WHERE presupuesto_id = p_presupuesto_id
    LOOP
        INSERT INTO venta_items (venta_id, sku_id, cantidad, precio_unitario, nro_serie)
        VALUES (v_venta_id, item.sku_id, item.cantidad, item.precio_unitario, item.nro_serie);

        SELECT es_servicio INTO v_es_servicio FROM skus WHERE id = item.sku_id;

        IF NOT v_es_servicio THEN
            UPDATE stock_terminado 
            SET cantidad = cantidad - item.cantidad, ultima_actualizacion = NOW() 
            WHERE sku_id = item.sku_id;
        END IF;

        FOR receta IN SELECT mp_id, cantidad_necesaria FROM sku_recetas WHERE sku_id = item.sku_id
        LOOP
            UPDATE stock_mp 
            SET cantidad = cantidad - (receta.cantidad_necesaria * item.cantidad), 
                ultima_actualizacion = NOW() 
            WHERE id = receta.mp_id;
        END LOOP;

        -- LOGICA EXTINTORES DESDE PRESUPUESTO
        IF item.nro_serie IS NOT NULL AND item.nro_serie != '' THEN
            IF EXISTS (SELECT 1 FROM extintores WHERE nro_cilindro = item.nro_serie AND cliente_id = v_presupuesto.cliente_id) THEN
                UPDATE extintores
                SET 
                    vencimiento_carga = CASE WHEN item.renovacion_carga_anios > 0 THEN (NOW() + (item.renovacion_carga_anios || ' years')::INTERVAL)::DATE ELSE vencimiento_carga END,
                    vencimiento_ph = CASE WHEN item.renovacion_ph_anios > 0 THEN (NOW() + (item.renovacion_ph_anios || ' years')::INTERVAL)::DATE ELSE vencimiento_ph END,
                    ultima_revision = CASE WHEN (item.renovacion_carga_anios > 0 OR item.renovacion_ph_anios > 0) THEN NOW() ELSE ultima_revision END
                WHERE nro_cilindro = item.nro_serie AND cliente_id = v_presupuesto.cliente_id;
            ELSE
                INSERT INTO extintores (
                    nro_cilindro, cliente_id, vencimiento_carga, vencimiento_ph, ultima_revision, marca, capacidad_kg, tipo_agente
                )
                VALUES (
                    item.nro_serie, 
                    v_presupuesto.cliente_id, 
                    (NOW() + (GREATEST(item.renovacion_carga_anios, 1) || ' years')::INTERVAL)::DATE, 
                    (NOW() + (GREATEST(item.renovacion_ph_anios, 5) || ' years')::INTERVAL)::DATE, 
                    NOW(),
                    'Vendido por Sistema', 
                    (SELECT capacidad_kg FROM skus WHERE id = item.sku_id LIMIT 1), 
                    (SELECT tipo_agente FROM skus WHERE id = item.sku_id LIMIT 1)
                );
            END IF;
        END IF;

    END LOOP;

    -- 4. Marcar presupuesto como aprobado
    UPDATE presupuestos SET estado = 'Aprobado' WHERE id = p_presupuesto_id;

    RETURN v_venta_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
