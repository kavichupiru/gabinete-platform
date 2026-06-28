-- ============================================================
-- MIGRACIÓN 004 — Tabla auditorias (output de n8n)
-- Ejecutar en: SQL Editor de Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS gabinete.auditorias (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id             UUID NOT NULL REFERENCES gabinete.academic_works(id) ON DELETE CASCADE,
  resumen_ejecutivo       TEXT,
  tabla_confianza         JSONB,
  fallas_criticas         JSONB,
  fallas_menores          JSONB,
  fortalezas              JSONB,
  recomendaciones         JSONB,
  ciclo_n                 INTEGER NOT NULL DEFAULT 1,
  modulo                  TEXT,
  norma_citacion_validada TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para consultar por trabajo
CREATE INDEX IF NOT EXISTS idx_auditorias_proyecto_id
  ON gabinete.auditorias(proyecto_id);

-- RLS: el estudiante solo ve las auditorías de sus propios trabajos
ALTER TABLE gabinete.auditorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_select_own_auditorias" ON gabinete.auditorias
  FOR SELECT USING (
    proyecto_id IN (
      SELECT id FROM gabinete.academic_works WHERE student_id = auth.uid()
    )
  );

-- El service role de n8n puede insertar sin restricciones (bypasa RLS)
-- No necesita política explícita — service role bypasa RLS por defecto

-- Permisos para PostgREST
GRANT SELECT ON gabinete.auditorias TO authenticated;
GRANT INSERT, UPDATE ON gabinete.auditorias TO service_role;
