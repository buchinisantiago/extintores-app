-- 1. Añadir campos necesarios
ALTER TABLE skus ADD COLUMN IF NOT EXISTS es_servicio BOOLEAN DEFAULT FALSE;
ALTER TABLE venta_items ADD COLUMN IF NOT EXISTS nro_serie TEXT;

-- 2. Modificar la función crear_venta para soportar nro_serie y no descontar stock de servicios
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
BEGIN
    -- 1. Crear la venta principal
    INSERT INTO ventas (cliente_id, total)
    VALUES (p_cliente_id, p_total)
    RETURNING id INTO v_venta_id;

    -- 2. Procesar cada ítem
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_sku_id := (item->>'sku_id')::UUID;
        v_cantidad := (item->>'cantidad')::INT;
        v_precio_unitario := (item->>'precio_unitario')::NUMERIC;
        v_nro_serie := item->>'nro_serie';

        -- Insertar el ítem de venta
        INSERT INTO venta_items (venta_id, sku_id, cantidad, precio_unitario, nro_serie)
        VALUES (v_venta_id, v_sku_id, v_cantidad, v_precio_unitario, v_nro_serie);

        -- Verificar si es un servicio
        SELECT es_servicio INTO v_es_servicio FROM skus WHERE id = v_sku_id;

        -- 3. Descontar stock SOLO si NO es un servicio
        IF NOT v_es_servicio THEN
            UPDATE stock_terminado
            SET 
                cantidad = cantidad - v_cantidad,
                ultima_actualizacion = NOW()
            WHERE sku_id = v_sku_id;
        END IF;
    END LOOP;

    RETURN v_venta_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Insertar los SKUs base (Si no existen)
INSERT INTO skus (nombre, tipo_agente, capacidad_kg, precio_recarga, es_servicio)
SELECT 'Extintor Polvo ABC 1 kg', 'Polvo ABC', 1, 1500, false
WHERE NOT EXISTS (SELECT 1 FROM skus WHERE nombre = 'Extintor Polvo ABC 1 kg');

INSERT INTO skus (nombre, tipo_agente, capacidad_kg, precio_recarga, es_servicio)
SELECT 'Extintor Polvo ABC 2.5 kg', 'Polvo ABC', 2.5, 3000, false
WHERE NOT EXISTS (SELECT 1 FROM skus WHERE nombre = 'Extintor Polvo ABC 2.5 kg');

INSERT INTO skus (nombre, tipo_agente, capacidad_kg, precio_recarga, es_servicio)
SELECT 'Extintor Polvo ABC 5 kg', 'Polvo ABC', 5, 5000, false
WHERE NOT EXISTS (SELECT 1 FROM skus WHERE nombre = 'Extintor Polvo ABC 5 kg');

INSERT INTO skus (nombre, tipo_agente, capacidad_kg, precio_recarga, es_servicio)
SELECT 'Extintor Polvo ABC 10 kg', 'Polvo ABC', 10, 8000, false
WHERE NOT EXISTS (SELECT 1 FROM skus WHERE nombre = 'Extintor Polvo ABC 10 kg');

INSERT INTO skus (nombre, tipo_agente, capacidad_kg, precio_recarga, es_servicio)
SELECT 'Extintor Polvo ABC Rodante 50 kg', 'Polvo ABC', 50, 45000, false
WHERE NOT EXISTS (SELECT 1 FROM skus WHERE nombre = 'Extintor Polvo ABC Rodante 50 kg');

INSERT INTO skus (nombre, tipo_agente, capacidad_kg, precio_recarga, es_servicio)
SELECT 'Extintor CO₂ 2.5 kg', 'CO₂', 2.5, 6000, false
WHERE NOT EXISTS (SELECT 1 FROM skus WHERE nombre = 'Extintor CO₂ 2.5 kg');

INSERT INTO skus (nombre, tipo_agente, capacidad_kg, precio_recarga, es_servicio)
SELECT 'Extintor CO₂ 5 kg', 'CO₂', 5, 11000, false
WHERE NOT EXISTS (SELECT 1 FROM skus WHERE nombre = 'Extintor CO₂ 5 kg');

INSERT INTO skus (nombre, tipo_agente, capacidad_kg, precio_recarga, es_servicio)
SELECT 'Extintor Agua 10 L', 'Agua presurizada', 10, 4000, false
WHERE NOT EXISTS (SELECT 1 FROM skus WHERE nombre = 'Extintor Agua 10 L');

INSERT INTO skus (nombre, tipo_agente, capacidad_kg, precio_recarga, es_servicio)
SELECT 'Extintor AFFF Espuma 9 L', 'AFFF', 9, 7000, false
WHERE NOT EXISTS (SELECT 1 FROM skus WHERE nombre = 'Extintor AFFF Espuma 9 L');

INSERT INTO skus (nombre, tipo_agente, capacidad_kg, precio_recarga, es_servicio)
SELECT 'Extintor Gas Limpio Haloclean/FE-36 4 kg', 'Haloclean/FE-36', 4, 15000, false
WHERE NOT EXISTS (SELECT 1 FROM skus WHERE nombre = 'Extintor Gas Limpio Haloclean/FE-36 4 kg');

-- 4. Insertar Servicios
INSERT INTO skus (nombre, tipo_agente, capacidad_kg, precio_recarga, es_servicio)
SELECT 'Prueba Hidráulica del cilindro', 'Servicio', 0, 5000, true
WHERE NOT EXISTS (SELECT 1 FROM skus WHERE nombre = 'Prueba Hidráulica del cilindro');

INSERT INTO skus (nombre, tipo_agente, capacidad_kg, precio_recarga, es_servicio)
SELECT 'Recarga sin venta', 'Servicio', 0, 4000, true
WHERE NOT EXISTS (SELECT 1 FROM skus WHERE nombre = 'Recarga sin venta');

INSERT INTO skus (nombre, tipo_agente, capacidad_kg, precio_recarga, es_servicio)
SELECT 'Venta de Señalética', 'Accesorio', 0, 800, true
WHERE NOT EXISTS (SELECT 1 FROM skus WHERE nombre = 'Venta de Señalética');

INSERT INTO skus (nombre, tipo_agente, capacidad_kg, precio_recarga, es_servicio)
SELECT 'Soporte/gabinete para pared', 'Accesorio', 0, 1500, true
WHERE NOT EXISTS (SELECT 1 FROM skus WHERE nombre = 'Soporte/gabinete para pared');

INSERT INTO skus (nombre, tipo_agente, capacidad_kg, precio_recarga, es_servicio)
SELECT 'Soporte para auto', 'Accesorio', 0, 1200, true
WHERE NOT EXISTS (SELECT 1 FROM skus WHERE nombre = 'Soporte para auto');
