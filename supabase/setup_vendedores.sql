-- Fase 3: Usuarios / Vendedores para Comisiones

-- Crear tabla de vendedores
CREATE TABLE IF NOT EXISTS vendedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar columna vendedor_id a ventas
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS vendedor_id UUID REFERENCES vendedores(id);

-- Deshabilitar RLS temporalmente para evitar problemas de permisos
ALTER TABLE vendedores DISABLE ROW LEVEL SECURITY;
