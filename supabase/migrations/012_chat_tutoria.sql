-- ============================================================
-- Migración 012: Chat de tutoría IA por trabajo
-- ============================================================

CREATE TABLE IF NOT EXISTS gabinete.chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id    UUID NOT NULL REFERENCES gabinete.academic_works(id) ON DELETE CASCADE,
  sender     TEXT NOT NULL CHECK (sender IN ('student', 'tutor')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_work_id
  ON gabinete.chat_messages(work_id, created_at);

ALTER TABLE gabinete.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_select_own_chat" ON gabinete.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gabinete.academic_works w
      WHERE w.id = chat_messages.work_id AND w.student_id = auth.uid()
    )
  );

CREATE POLICY "student_insert_own_chat" ON gabinete.chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM gabinete.academic_works w
      WHERE w.id = chat_messages.work_id AND w.student_id = auth.uid()
    )
  );

CREATE POLICY "supervisor_select_all_chat" ON gabinete.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gabinete.students s
      WHERE s.id = auth.uid() AND s.role IN ('supervisor', 'admin')
    )
  );

GRANT SELECT, INSERT ON gabinete.chat_messages TO authenticated;
GRANT ALL ON gabinete.chat_messages TO service_role;
