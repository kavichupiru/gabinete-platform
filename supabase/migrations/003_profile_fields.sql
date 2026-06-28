-- ============================================================
-- MIGRACIÓN 003 — Campos de filiación en gabinete.students
-- Ejecutar en: SQL Editor de Supabase
-- ============================================================

-- Ampliar el enum academic_level con nuevos valores
ALTER TYPE gabinete.academic_level ADD VALUE IF NOT EXISTS 'posgrado';
ALTER TYPE gabinete.academic_level ADD VALUE IF NOT EXISTS 'diplomado';
ALTER TYPE gabinete.academic_level ADD VALUE IF NOT EXISTS 'masterado';

-- Agregar columnas de filiación y contacto a students
ALTER TABLE gabinete.students
  ADD COLUMN IF NOT EXISTS country    TEXT,
  ADD COLUMN IF NOT EXISTS career     TEXT,
  ADD COLUMN IF NOT EXISTS id_number  TEXT,
  ADD COLUMN IF NOT EXISTS phone      TEXT;
