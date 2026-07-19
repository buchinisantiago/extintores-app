-- Agregar campo auth_user_id a vendedores si no existe
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS auth_user_id UUID;

-- Agregar campo comision_porcentaje a vendedores
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS comision_porcentaje NUMERIC DEFAULT 0;

-- Asegurar que auth_user_id pueda relacionarse con auth.users (si tenes acceso al esquema auth desde public)
-- (Opcional, en Supabase a veces se deja sin FK directa por seguridad)
