-- Script para arreglar el problema de "crear_venta" duplicada y ambiguas

-- 1. Primero borramos TODAS las versiones de la función crear_venta
DROP FUNCTION IF EXISTS crear_venta(uuid, numeric, jsonb);
DROP FUNCTION IF EXISTS crear_venta(uuid, numeric, jsonb, text, text, text, text, uuid);

-- 2. Volvemos a crear la función definitiva (con 8 parámetros y lógica de servicios)
CREATE OR REPLACE FUNCTION crear_venta(
    p_cliente_id UUID,
    p_total NUMERIC,
    p_items JSONB,
    p_metodo_pago TEXT DEFAULT NULL,
    p_observaciones TEXT DEFAULT NULL,
    p_nro_factura TEXT DEFAULT NULL,
    p_estado_pago TEXT DEFAULT 'Pagado',
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

        INSERT INTO venta_items (venta_id, sku_id, cantidad, costo_unitario, nro_serie)
        VALUES (v_venta_id, v_sku_id, v_cantidad, v_precio_unitario, v_nro_serie);

        -- Descontar stock solo si no es un servicio
        SELECT es_servicio INTO v_es_servicio FROM skus WHERE id = v_sku_id;
        IF NOT v_es_servicio THEN
            UPDATE stock_terminado SET cantidad = cantidad - v_cantidad WHERE sku_id = v_sku_id;
        END IF;
    END LOOP;

    RETURN v_venta_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
