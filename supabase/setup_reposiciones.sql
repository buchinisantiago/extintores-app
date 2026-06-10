-- 1. Crear tabla reposiciones
CREATE TABLE IF NOT EXISTS reposiciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    observaciones TEXT,
    usuario_id UUID -- Opcional, si queremos vincular al empleado
);

ALTER TABLE reposiciones DISABLE ROW LEVEL SECURITY;

-- 2. Crear tabla reposicion_items
CREATE TABLE IF NOT EXISTS reposicion_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reposicion_id UUID NOT NULL REFERENCES reposiciones(id) ON DELETE CASCADE,
    tipo_entidad TEXT NOT NULL CHECK (tipo_entidad IN ('MP', 'SKU')),
    entidad_id UUID NOT NULL,
    cantidad NUMERIC NOT NULL CHECK (cantidad > 0)
);

ALTER TABLE reposicion_items DISABLE ROW LEVEL SECURITY;

-- 3. Crear RPC para registrar la reposición de forma atómica
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
    -- Crear cabecera
    INSERT INTO reposiciones (observaciones, fecha) 
    VALUES (p_observaciones, NOW()) 
    RETURNING id INTO v_reposicion_id;

    -- Procesar cada item
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_tipo_entidad := item->>'tipo_entidad';
        v_entidad_id := (item->>'entidad_id')::UUID;
        v_cantidad := (item->>'cantidad')::NUMERIC;

        -- Guardar el detalle
        INSERT INTO reposicion_items (reposicion_id, tipo_entidad, entidad_id, cantidad)
        VALUES (v_reposicion_id, v_tipo_entidad, v_entidad_id, v_cantidad);

        -- Actualizar el stock correspondiente
        IF v_tipo_entidad = 'MP' THEN
            UPDATE stock_mp 
            SET cantidad = cantidad + v_cantidad
            WHERE id = v_entidad_id;
        ELSIF v_tipo_entidad = 'SKU' THEN
            UPDATE stock_terminado 
            SET cantidad = cantidad + v_cantidad, ultima_actualizacion = NOW() 
            WHERE sku_id = v_entidad_id;
        END IF;

    END LOOP;

    RETURN v_reposicion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
