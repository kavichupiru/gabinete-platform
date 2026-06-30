-- ============================================================
-- Migration 007: Ampliar work_type enum + fix RLS work_stages
-- ============================================================

-- 1. Nuevos tipos de trabajo
ALTER TYPE gabinete.work_type ADD VALUE IF NOT EXISTS 'ensayo';
ALTER TYPE gabinete.work_type ADD VALUE IF NOT EXISTS 'trabajo_practico';
ALTER TYPE gabinete.work_type ADD VALUE IF NOT EXISTS 'manual';
ALTER TYPE gabinete.work_type ADD VALUE IF NOT EXISTS 'libro';

-- 2. Permitir que el webhook (service_role) inserte en work_stages
--    El admin client bypassea RLS vía service_role, pero agregamos
--    una política explícita para INSERT desde el propio estudiante
--    (cubre el flujo de webhook que actúa en nombre del estudiante).
CREATE POLICY "student_insert_own_stages"
  ON gabinete.work_stages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM gabinete.academic_works w
      WHERE w.id = work_stages.work_id
        AND w.student_id = auth.uid()
    )
  );
