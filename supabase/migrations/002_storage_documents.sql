-- ============================================================
-- GABINETE — Storage bucket para documentos académicos
-- Ejecutar en: SQL Editor de Supabase
-- ============================================================

-- Crear bucket (privado — solo acceso autenticado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800,  -- 50 MB máximo por archivo
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ── Políticas de storage ──────────────────────────────────────────────────────

-- Estudiante: puede subir archivos solo en su propia carpeta (documents/{user_id}/*)
CREATE POLICY "student_upload_own_documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Estudiante: puede leer sus propios archivos
CREATE POLICY "student_read_own_documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Supervisor/admin: puede leer todos los documentos
CREATE POLICY "supervisor_read_all_documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1 FROM gabinete.students s
    WHERE s.id = auth.uid()
      AND s.role IN ('supervisor', 'admin')
  )
);

-- Estudiante: puede eliminar sus propios archivos (solo mientras está en pendiente_pago)
CREATE POLICY "student_delete_own_documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
