-- ============================================================
-- Migración 011: GRANT global a service_role sobre todo el schema
-- La migración 001 nunca declaró GRANTs explícitos; RLS por sí solo
-- no alcanza — el rol también necesita permisos a nivel de tabla.
-- ============================================================

GRANT USAGE ON SCHEMA gabinete TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA gabinete TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA gabinete TO service_role;

-- Para que futuras tablas también hereden el permiso automáticamente
ALTER DEFAULT PRIVILEGES IN SCHEMA gabinete
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA gabinete
  GRANT ALL ON SEQUENCES TO service_role;
