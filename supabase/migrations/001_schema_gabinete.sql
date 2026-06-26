-- ============================================================
-- GABINETE DE ESTUDIOS — Schema completo
-- Proyecto: tas-group-platform (Supabase)
-- Schema: gabinete (aislado de public/TPS)
-- Ejecutar en: SQL Editor de Supabase
-- Autor: Kavichu / Claude Code
-- Versión: 1.0
-- ============================================================

-- ------------------------------------------------------------
-- 0. CREAR EL SCHEMA
-- ------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS gabinete;

-- Habilitar extensión UUID (ya debería existir en Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- 1. ENUMS
-- ------------------------------------------------------------

CREATE TYPE gabinete.user_role AS ENUM (
  'student',
  'supervisor',
  'admin'
);

CREATE TYPE gabinete.academic_level AS ENUM (
  'grado',
  'especialización',
  'maestría',
  'doctorado'
);

CREATE TYPE gabinete.work_type AS ENUM (
  'tesis',
  'monografía',
  'artículo',
  'informe',
  'poster'
);

CREATE TYPE gabinete.citation_style AS ENUM (
  'vancouver',
  'apa7',
  'iica',
  'chicago',
  'mla',
  'iso690'
);

CREATE TYPE gabinete.work_status AS ENUM (
  'pendiente_pago',
  'en_auditoría',
  'entregado',
  'archivado'
);

CREATE TYPE gabinete.payment_status AS ENUM (
  'pendiente',
  'completado',
  'fallido',
  'reembolsado'
);

CREATE TYPE gabinete.work_stage AS ENUM (
  'propuesta',
  'anteproyecto',
  'campo',
  'análisis',
  'redacción',
  'revisión',
  'defensa',
  'cerrado'
);

CREATE TYPE gabinete.stage_status AS ENUM (
  'pendiente',
  'en_curso',
  'completado',
  'bloqueado'
);

CREATE TYPE gabinete.postgrad_status AS ENUM (
  'apertura',
  'activo',
  'cerrado'
);

CREATE TYPE gabinete.transaction_type AS ENUM (
  'ingreso',
  'egreso'
);

CREATE TYPE gabinete.transaction_category AS ENUM (
  'asesoría',
  'posgrado',
  'material',
  'servicio',
  'impuesto',
  'otro'
);

CREATE TYPE gabinete.sifen_status AS ENUM (
  'pendiente',
  'aprobado',
  'rechazado',
  'anulado'
);

CREATE TYPE gabinete.iva_regime AS ENUM (
  'general',
  'pequeño_contribuyente',
  'iragro'
);

-- ------------------------------------------------------------
-- 2. TABLAS CORE
-- ------------------------------------------------------------

-- M1: Estudiantes (espejo de auth.users, con datos académicos)
CREATE TABLE gabinete.students (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text UNIQUE NOT NULL,
  full_name   text NOT NULL,
  institution text NOT NULL,
  academic_level gabinete.academic_level NOT NULL DEFAULT 'grado',
  role        gabinete.user_role NOT NULL DEFAULT 'student',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- M5: Pagos (se declara antes de academic_works por FK)
CREATE TABLE gabinete.payments (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id        uuid NOT NULL REFERENCES gabinete.students(id) ON DELETE CASCADE,
  stripe_session_id text NOT NULL,
  amount_usd        numeric(10, 2) NOT NULL,
  status            gabinete.payment_status NOT NULL DEFAULT 'pendiente',
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- M2 + M3: Trabajos académicos
CREATE TABLE gabinete.academic_works (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id     uuid NOT NULL REFERENCES gabinete.students(id) ON DELETE CASCADE,
  title          text NOT NULL,
  work_type      gabinete.work_type NOT NULL,
  academic_level gabinete.academic_level NOT NULL,
  citation_style gabinete.citation_style NOT NULL DEFAULT 'vancouver',
  status         gabinete.work_status NOT NULL DEFAULT 'pendiente_pago',
  -- El documento se sube ANTES del pago; payment_id se llena tras webhook de Stripe
  payment_id     uuid REFERENCES gabinete.payments(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Trigger para mantener updated_at automático
CREATE OR REPLACE FUNCTION gabinete.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_academic_works_updated_at
  BEFORE UPDATE ON gabinete.academic_works
  FOR EACH ROW EXECUTE FUNCTION gabinete.set_updated_at();

-- M2: Auditorías
CREATE TABLE gabinete.audits (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_id              uuid NOT NULL REFERENCES gabinete.academic_works(id) ON DELETE CASCADE,
  input_document_url   text NOT NULL,
  output_docx_url      text,
  diagnosis_json       jsonb,
  confidence_scores    jsonb,
  tokens_used          integer,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 3. MÓDULO M6: POSGRADOS
-- ------------------------------------------------------------

CREATE TABLE gabinete.postgrad_programs (
  id     uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name   text NOT NULL,   -- 'medicina_forense' | 'enfermeria_nefrológica'
  status gabinete.postgrad_status NOT NULL DEFAULT 'apertura'
);

CREATE TABLE gabinete.postgrad_students (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id        uuid NOT NULL REFERENCES gabinete.postgrad_programs(id) ON DELETE CASCADE,
  student_id        uuid NOT NULL REFERENCES gabinete.students(id) ON DELETE CASCADE,
  enrollment_status text NOT NULL DEFAULT 'inscripto',
  payment_status    text NOT NULL DEFAULT 'pendiente',
  UNIQUE (program_id, student_id)
);

-- ------------------------------------------------------------
-- 4. MÓDULO M7: SEGUIMIENTO DE AVANCE (CARRIL METODOLÓGICO)
-- ------------------------------------------------------------

CREATE TABLE gabinete.work_stages (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_id     uuid NOT NULL REFERENCES gabinete.academic_works(id) ON DELETE CASCADE,
  stage_name  gabinete.work_stage NOT NULL,
  status      gabinete.stage_status NOT NULL DEFAULT 'pendiente',
  notes       text,
  notified_at timestamptz,
  changed_by  uuid NOT NULL REFERENCES gabinete.students(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_work_stages_updated_at
  BEFORE UPDATE ON gabinete.work_stages
  FOR EACH ROW EXECUTE FUNCTION gabinete.set_updated_at();

-- ------------------------------------------------------------
-- 5. MÓDULO M8: CONTABILIDAD Y FACTURACIÓN
-- ------------------------------------------------------------

-- M8b: Facturas (se declara antes de transactions por FK circular)
CREATE TABLE gabinete.invoices (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id       uuid REFERENCES gabinete.students(id) ON DELETE SET NULL,
  -- transaction_id se agrega después con ALTER TABLE para evitar FK circular
  invoice_number   text NOT NULL,
  cdc              text,           -- Código de Control SIFEN
  xml_content      text,           -- XML firmado enviado a DNIT
  kude_url         text,           -- PDF KUDE en Supabase Storage
  sifen_status     gabinete.sifen_status NOT NULL DEFAULT 'pendiente',
  sifen_response   jsonb,
  client_name      text NOT NULL,
  client_ruc       text NOT NULL,
  client_email     text,
  subtotal_gs      numeric(18, 0) NOT NULL,
  iva_10_gs        numeric(18, 0) NOT NULL DEFAULT 0,
  iva_5_gs         numeric(18, 0) NOT NULL DEFAULT 0,
  total_gs         numeric(18, 0) NOT NULL,
  regime           gabinete.iva_regime NOT NULL DEFAULT 'general',
  issued_at        timestamptz NOT NULL DEFAULT now(),
  sent_to_sifen_at timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- M8a: Ingresos y egresos
CREATE TABLE gabinete.transactions (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type             gabinete.transaction_type NOT NULL,
  category         gabinete.transaction_category NOT NULL,
  description      text NOT NULL,
  amount_gs        numeric(18, 0) NOT NULL,
  amount_usd       numeric(10, 2),
  counterpart      text NOT NULL,
  counterpart_ruc  text,
  invoice_id       uuid REFERENCES gabinete.invoices(id) ON DELETE SET NULL,
  date             date NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- FK circular: invoices → transactions (se agrega después de crear ambas tablas)
ALTER TABLE gabinete.invoices
  ADD COLUMN transaction_id uuid REFERENCES gabinete.transactions(id) ON DELETE SET NULL;

-- M8c: Vista libro IVA mensual
CREATE OR REPLACE VIEW gabinete.libro_iva AS
SELECT
  DATE_TRUNC('month', issued_at)::date AS mes,
  COUNT(*) AS cantidad_facturas,
  SUM(subtotal_gs) AS subtotal_gs,
  SUM(iva_10_gs)   AS iva_10_gs,
  SUM(iva_5_gs)    AS iva_5_gs,
  SUM(iva_10_gs + iva_5_gs) AS total_iva_gs,
  SUM(total_gs)    AS total_facturado_gs
FROM gabinete.invoices
WHERE sifen_status = 'aprobado'
GROUP BY DATE_TRUNC('month', issued_at)
ORDER BY mes DESC;

-- ------------------------------------------------------------
-- 6. ÍNDICES
-- ------------------------------------------------------------

CREATE INDEX idx_academic_works_student_id ON gabinete.academic_works(student_id);
CREATE INDEX idx_academic_works_status     ON gabinete.academic_works(status);
CREATE INDEX idx_audits_work_id            ON gabinete.audits(work_id);
CREATE INDEX idx_payments_student_id       ON gabinete.payments(student_id);
CREATE INDEX idx_payments_stripe_session   ON gabinete.payments(stripe_session_id);
CREATE INDEX idx_work_stages_work_id       ON gabinete.work_stages(work_id);
CREATE INDEX idx_transactions_date         ON gabinete.transactions(date);
CREATE INDEX idx_invoices_sifen_status     ON gabinete.invoices(sifen_status);
CREATE INDEX idx_invoices_issued_at        ON gabinete.invoices(issued_at);

-- ------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------

-- Habilitar RLS en todas las tablas
ALTER TABLE gabinete.students          ENABLE ROW LEVEL SECURITY;
ALTER TABLE gabinete.academic_works    ENABLE ROW LEVEL SECURITY;
ALTER TABLE gabinete.audits            ENABLE ROW LEVEL SECURITY;
ALTER TABLE gabinete.payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE gabinete.postgrad_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gabinete.postgrad_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE gabinete.work_stages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE gabinete.transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE gabinete.invoices          ENABLE ROW LEVEL SECURITY;

-- ── students ────────────────────────────────────────────────

-- Estudiante: solo su propio registro
CREATE POLICY "student_select_own"
  ON gabinete.students FOR SELECT
  USING (id = auth.uid());

-- Supervisor/admin: leen todos
CREATE POLICY "supervisor_select_all"
  ON gabinete.students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gabinete.students s
      WHERE s.id = auth.uid()
        AND s.role IN ('supervisor', 'admin')
    )
  );

-- Solo el propio usuario actualiza su perfil
CREATE POLICY "student_update_own"
  ON gabinete.students FOR UPDATE
  USING (id = auth.uid());

-- Admin puede actualizar cualquier registro (cambio de rol, etc.)
CREATE POLICY "admin_update_all"
  ON gabinete.students FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM gabinete.students s
      WHERE s.id = auth.uid() AND s.role = 'admin'
    )
  );

-- ── academic_works ───────────────────────────────────────────

CREATE POLICY "student_select_own_works"
  ON gabinete.academic_works FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "supervisor_select_all_works"
  ON gabinete.academic_works FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gabinete.students s
      WHERE s.id = auth.uid()
        AND s.role IN ('supervisor', 'admin')
    )
  );

CREATE POLICY "student_insert_own_works"
  ON gabinete.academic_works FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "student_update_own_works"
  ON gabinete.academic_works FOR UPDATE
  USING (student_id = auth.uid());

-- Supervisor puede actualizar status de cualquier trabajo
CREATE POLICY "supervisor_update_all_works"
  ON gabinete.academic_works FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM gabinete.students s
      WHERE s.id = auth.uid()
        AND s.role IN ('supervisor', 'admin')
    )
  );

-- ── audits ───────────────────────────────────────────────────

-- Estudiante: solo auditorías de sus propios trabajos
CREATE POLICY "student_select_own_audits"
  ON gabinete.audits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gabinete.academic_works w
      WHERE w.id = audits.work_id
        AND w.student_id = auth.uid()
    )
  );

CREATE POLICY "supervisor_select_all_audits"
  ON gabinete.audits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gabinete.students s
      WHERE s.id = auth.uid()
        AND s.role IN ('supervisor', 'admin')
    )
  );

-- ── payments ─────────────────────────────────────────────────

CREATE POLICY "student_select_own_payments"
  ON gabinete.payments FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "supervisor_select_all_payments"
  ON gabinete.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gabinete.students s
      WHERE s.id = auth.uid()
        AND s.role IN ('supervisor', 'admin')
    )
  );

-- ── postgrad_programs ────────────────────────────────────────

-- Cualquier usuario autenticado puede ver los programas
CREATE POLICY "authenticated_select_programs"
  ON gabinete.postgrad_programs FOR SELECT
  TO authenticated
  USING (true);

-- Solo admin puede crear/modificar programas
CREATE POLICY "admin_all_programs"
  ON gabinete.postgrad_programs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM gabinete.students s
      WHERE s.id = auth.uid() AND s.role = 'admin'
    )
  );

-- ── postgrad_students ────────────────────────────────────────

CREATE POLICY "student_select_own_postgrad"
  ON gabinete.postgrad_students FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "supervisor_select_all_postgrad"
  ON gabinete.postgrad_students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gabinete.students s
      WHERE s.id = auth.uid()
        AND s.role IN ('supervisor', 'admin')
    )
  );

CREATE POLICY "supervisor_update_postgrad"
  ON gabinete.postgrad_students FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM gabinete.students s
      WHERE s.id = auth.uid()
        AND s.role IN ('supervisor', 'admin')
    )
  );

-- ── work_stages ──────────────────────────────────────────────

CREATE POLICY "student_select_own_stages"
  ON gabinete.work_stages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gabinete.academic_works w
      WHERE w.id = work_stages.work_id
        AND w.student_id = auth.uid()
    )
  );

CREATE POLICY "supervisor_select_all_stages"
  ON gabinete.work_stages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gabinete.students s
      WHERE s.id = auth.uid()
        AND s.role IN ('supervisor', 'admin')
    )
  );

-- Solo supervisor/admin inserta o actualiza etapas
CREATE POLICY "supervisor_insert_stages"
  ON gabinete.work_stages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM gabinete.students s
      WHERE s.id = auth.uid()
        AND s.role IN ('supervisor', 'admin')
    )
  );

CREATE POLICY "supervisor_update_stages"
  ON gabinete.work_stages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM gabinete.students s
      WHERE s.id = auth.uid()
        AND s.role IN ('supervisor', 'admin')
    )
  );

-- ── transactions ─────────────────────────────────────────────

-- Solo admin/supervisor accede a contabilidad
CREATE POLICY "admin_all_transactions"
  ON gabinete.transactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM gabinete.students s
      WHERE s.id = auth.uid()
        AND s.role IN ('supervisor', 'admin')
    )
  );

-- ── invoices ─────────────────────────────────────────────────

CREATE POLICY "admin_all_invoices"
  ON gabinete.invoices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM gabinete.students s
      WHERE s.id = auth.uid()
        AND s.role IN ('supervisor', 'admin')
    )
  );

-- ------------------------------------------------------------
-- 8. FUNCIÓN AUTOMÁTICA: crear perfil al registrarse
-- ------------------------------------------------------------
-- Se dispara cuando auth.users recibe un nuevo registro.
-- Crea automáticamente una fila en gabinete.students con rol 'student'.

CREATE OR REPLACE FUNCTION gabinete.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO gabinete.students (id, email, full_name, institution, academic_level, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'institution', ''),
    COALESCE(
      (NEW.raw_user_meta_data->>'academic_level')::gabinete.academic_level,
      'grado'
    ),
    'student'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger en auth.users (schema auth)
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION gabinete.handle_new_user();

-- ------------------------------------------------------------
-- 9. DATOS INICIALES
-- ------------------------------------------------------------

-- Programas de posgrado activos
INSERT INTO gabinete.postgrad_programs (name, status) VALUES
  ('medicina_forense', 'activo'),
  ('enfermeria_nefrológica', 'activo');

-- ------------------------------------------------------------
-- FIN DEL SCRIPT
-- Verificar con:
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'gabinete';
-- ------------------------------------------------------------
