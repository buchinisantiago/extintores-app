CREATE TABLE IF NOT EXISTS presupuestos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID REFERENCES clientes(id) NOT NULL,
    vendedor_id UUID REFERENCES vendedores(id),
    total NUMERIC NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'Pendiente', -- Pendiente, Aprobado, Rechazado
    validez_dias INT DEFAULT 15,
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS presupuesto_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    presupuesto_id UUID REFERENCES presupuestos(id) ON DELETE CASCADE,
    sku_id UUID REFERENCES skus(id) NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC NOT NULL,
    nro_serie TEXT
);

-- RPC for converting budget to sale
CREATE OR REPLACE FUNCTION convertir_presupuesto_a_venta(
    p_presupuesto_id UUID,
    p_estado_pago TEXT,
    p_metodo_pago TEXT,
    p_comprobante TEXT
)
RETURNS UUID AS $$
DECLARE
    v_cliente_id UUID;
    v_vendedor_id UUID;
    v_total NUMERIC;
    v_observaciones TEXT;
    v_venta_id UUID;
    item RECORD;
    v_es_servicio BOOLEAN;
BEGIN
    -- Check if it's already approved
    IF (SELECT estado FROM presupuestos WHERE id = p_presupuesto_id) = 'Aprobado' THEN
        RAISE EXCEPTION 'El presupuesto ya fue aprobado anteriormente.';
    END IF;

    -- Fetch budget data
    SELECT cliente_id, vendedor_id, total, observaciones 
    INTO v_cliente_id, v_vendedor_id, v_total, v_observaciones
    FROM presupuestos WHERE id = p_presupuesto_id;

    -- Insert into ventas
    INSERT INTO ventas (cliente_id, vendedor_id, total, estado_pago, metodo_pago, comprobante, observaciones)
    VALUES (v_cliente_id, v_vendedor_id, v_total, p_estado_pago, p_metodo_pago, p_comprobante, v_observaciones)
    RETURNING id INTO v_venta_id;

    -- Loop items
    FOR item IN SELECT * FROM presupuesto_items WHERE presupuesto_id = p_presupuesto_id
    LOOP
        INSERT INTO venta_items (venta_id, sku_id, cantidad, precio_unitario, nro_serie)
        VALUES (v_venta_id, item.sku_id, item.cantidad, item.precio_unitario, item.nro_serie);

        SELECT es_servicio INTO v_es_servicio FROM skus WHERE id = item.sku_id;

        IF NOT v_es_servicio THEN
            UPDATE stock_terminado SET cantidad = cantidad - item.cantidad, ultima_actualizacion = NOW() WHERE sku_id = item.sku_id;
        END IF;
    END LOOP;

    -- Mark budget as Aprobado
    UPDATE presupuestos SET estado = 'Aprobado', updated_at = NOW() WHERE id = p_presupuesto_id;

    RETURN v_venta_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
