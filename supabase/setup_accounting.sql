-- Configuración de la base de datos para el Módulo Contable (Fase 1)

-- 1. Tabla de Gastos
CREATE TABLE IF NOT EXISTS public.gastos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha timestamp with time zone NOT NULL,
  nro_comprobante text,
  estado_pago text CHECK (estado_pago IN ('Pagado', 'Pendiente')),
  observaciones text,
  monto numeric(12, 2) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Modificaciones a la tabla de Ventas
-- Agregamos las columnas que estaban en el Excel y que no existían en la tabla actual
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS nro_factura text;
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS estado_pago text CHECK (estado_pago IN ('Pagado', 'Pendiente')) DEFAULT 'Pagado';
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS observaciones text;

-- 3. Políticas de Seguridad (RLS) - Si tienes RLS activado
-- Habilitar RLS en gastos (opcional, dependiendo de tu configuración actual)
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;

-- Políticas temporales para permitir lectura/escritura anónima o autenticada (ajustar según tu configuración)
CREATE POLICY "Permitir todo a anonimos en gastos" ON public.gastos FOR ALL USING (true);
