-- ============================================================
-- MIGRACIÓN 005 — Agregar campo career a academic_works
-- El campo career se copia del perfil del estudiante al crear
-- el trabajo, para que el webhook a n8n sea autocontenido.
-- Ejecutar en: SQL Editor de Supabase
-- ============================================================

ALTER TABLE gabinete.academic_works
  ADD COLUMN IF NOT EXISTS career TEXT;
