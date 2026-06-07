-- Fase 7: Ajustes y Configuración

CREATE TABLE IF NOT EXISTS configuracion (
  id INT PRIMARY KEY DEFAULT 1,
  empresa_nombre TEXT DEFAULT 'FireControl',
  email_notificaciones TEXT DEFAULT 'gerencia@tuempresa.com'
);

INSERT INTO configuracion (id, empresa_nombre, email_notificaciones) 
VALUES (1, 'FireControl', 'gerencia@tuempresa.com') 
ON CONFLICT DO NOTHING;
