-- ============================================================
-- Migración 009: RLS faltante — supervisor lee auditorias
-- ============================================================

CREATE POLICY "supervisor_select_all_auditorias" ON gabinete.auditorias
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gabinete.students s
      WHERE s.id = auth.uid()
        AND s.role IN ('supervisor', 'admin')
    )
  );
