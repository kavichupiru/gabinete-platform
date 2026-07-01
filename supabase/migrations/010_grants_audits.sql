-- ============================================================
-- Migración 010: GRANT faltante en tabla audits (migración 001
-- nunca lo declaró explícitamente, a diferencia de auditorias)
-- ============================================================

GRANT SELECT, INSERT ON gabinete.audits TO authenticated;
GRANT ALL ON gabinete.audits TO service_role;
