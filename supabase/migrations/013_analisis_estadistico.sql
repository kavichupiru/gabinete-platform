-- ============================================================
-- Migración 013: Análisis estadístico con IA por trabajo
-- ============================================================

CREATE TABLE IF NOT EXISTS gabinete.statistical_analyses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id        UUID NOT NULL REFERENCES gabinete.academic_works(id) ON DELETE CASCADE,
  file_name      TEXT NOT NULL,
  file_path      TEXT NOT NULL,
  summary_json   JSONB NOT NULL,
  interpretation TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_statistical_analyses_work_id
  ON gabinete.statistical_analyses(work_id, created_at);

ALTER TABLE gabinete.statistical_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_select_own_analyses" ON gabinete.statistical_analyses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gabinete.academic_works w
      WHERE w.id = statistical_analyses.work_id AND w.student_id = auth.uid()
    )
  );

CREATE POLICY "student_insert_own_analyses" ON gabinete.statistical_analyses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM gabinete.academic_works w
      WHERE w.id = statistical_analyses.work_id AND w.student_id = auth.uid()
    )
  );

CREATE POLICY "supervisor_select_all_analyses" ON gabinete.statistical_analyses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gabinete.students s
      WHERE s.id = auth.uid() AND s.role IN ('supervisor', 'admin')
    )
  );

GRANT SELECT, INSERT ON gabinete.statistical_analyses TO authenticated;
GRANT ALL ON gabinete.statistical_analyses TO service_role;
