-- Fase 2: Control de Pagos Detallado

-- Añadir campos para clasificar pagos en la tabla de ventas
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS metodo_pago TEXT;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS comprobante TEXT;
