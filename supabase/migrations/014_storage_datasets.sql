-- ============================================================
-- Migración 014: permitir CSV/Excel en el bucket 'documents'
-- para el módulo de análisis estadístico
-- ============================================================

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]
WHERE id = 'documents';
