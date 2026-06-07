-- Fase 4: Anular / Borrar Venta y Restaurar Stock

CREATE OR REPLACE FUNCTION anular_venta(p_venta_id UUID)
RETURNS VOID AS $$
DECLARE
  v_item RECORD;
BEGIN
  -- Restaurar el stock por cada item de la venta
  FOR v_item IN SELECT * FROM venta_items WHERE venta_id = p_venta_id LOOP
    UPDATE stock_terminado 
    SET cantidad = cantidad + v_item.cantidad
    WHERE sku_id = v_item.sku_id;
  END LOOP;

  -- Borrar los items de la venta
  DELETE FROM venta_items WHERE venta_id = p_venta_id;

  -- Borrar la venta (si hay cascade en otras tablas, se borrarán. En este caso no hay dependencias más que los items)
  DELETE FROM ventas WHERE id = p_venta_id;
END;
$$ LANGUAGE plpgsql;
