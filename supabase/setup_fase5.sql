-- Fase 5: Costos, Proveedores y Ganancia Real

ALTER TABLE skus ADD COLUMN IF NOT EXISTS proveedor TEXT;
ALTER TABLE skus ADD COLUMN IF NOT EXISTS costo NUMERIC DEFAULT 0;

ALTER TABLE venta_items ADD COLUMN IF NOT EXISTS costo_unitario NUMERIC DEFAULT 0;

-- Actualizar el RPC crear_venta para que guarde el costo histórico y maneje bien el stock
CREATE OR REPLACE FUNCTION crear_venta(
  p_cliente_id UUID,
  p_total NUMERIC,
  p_items JSONB
)
RETURNS UUID AS $$
DECLARE
  v_venta_id UUID;
  v_item JSONB;
  v_costo NUMERIC;
BEGIN
  INSERT INTO ventas (cliente_id, total, estado_pago)
  VALUES (p_cliente_id, p_total, 'Pagado')
  RETURNING id INTO v_venta_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Obtener el costo actual del SKU
    SELECT costo INTO v_costo FROM skus WHERE id = (v_item->>'sku_id')::UUID;
    
    INSERT INTO venta_items (venta_id, sku_id, cantidad, precio_unitario, nro_serie, costo_unitario)
    VALUES (
      v_venta_id,
      (v_item->>'sku_id')::UUID,
      (v_item->>'cantidad')::INTEGER,
      (v_item->>'precio_unitario')::NUMERIC,
      NULLIF(v_item->>'nro_serie', ''),
      COALESCE(v_costo, 0)
    );

    UPDATE stock_terminado 
    SET cantidad = cantidad - (v_item->>'cantidad')::INTEGER
    WHERE sku_id = (v_item->>'sku_id')::UUID;
  END LOOP;

  RETURN v_venta_id;
END;
$$ LANGUAGE plpgsql;
