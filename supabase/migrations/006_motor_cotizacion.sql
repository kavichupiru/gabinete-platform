-- ============================================================
-- MIGRACIÓN 006 — Motor de cotización
-- Tablas: service_catalog, quotes, payment_milestones
-- Ejecutar en: SQL Editor de Supabase
-- ============================================================

-- ── 1. Catálogo de servicios ─────────────────────────────────

CREATE TABLE IF NOT EXISTS gabinete.service_catalog (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  slug                  TEXT NOT NULL UNIQUE,
  description           TEXT,
  service_type          TEXT NOT NULL CHECK (service_type IN ('puntual', 'proceso')),
  price_grado           NUMERIC(10,2) NOT NULL,
  price_posgrado        NUMERIC(10,2) NOT NULL,
  price_doctorado       NUMERIC(10,2) NOT NULL,
  urgency_multiplier    NUMERIC(4,2)  NOT NULL DEFAULT 1.4,
  is_active             BOOLEAN       NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Datos iniciales del catálogo
INSERT INTO gabinete.service_catalog
  (name, slug, description, service_type, price_grado, price_posgrado, price_doctorado)
VALUES
  (
    'Auditoría diagnóstica',
    'auditoria-diagnostica',
    'Análisis estructural completo con IA: coherencia metodológica, fallas críticas, fortalezas y recomendaciones priorizadas. Entrega en menos de 24 hs.',
    'puntual', 50.00, 90.00, 135.00
  ),
  (
    'Reestructuración completa',
    'reestructuracion-completa',
    'Revisión profunda y reescritura estructural del trabajo. Incluye auditoría diagnóstica previa.',
    'proceso', 175.00, 300.00, 450.00
  ),
  (
    'Anteproyecto',
    'anteproyecto',
    'Elaboración del anteproyecto de investigación: problema, objetivos, marco teórico inicial, metodología y cronograma.',
    'proceso', 150.00, 250.00, 400.00
  ),
  (
    'Acompañamiento completo',
    'acompanamiento-completo',
    'Desde la elección del tema hasta la defensa. Incluye todas las etapas del proceso investigativo con supervisión permanente.',
    'proceso', 450.00, 750.00, 1000.00
  ),
  (
    'Elaboración de PPT y póster',
    'ppt-poster',
    'Diseño de presentación para defensa o congreso académico. Incluye estructura narrativa, diseño visual y notas del orador.',
    'puntual', 65.00, 85.00, 105.00
  ),
  (
    'Análisis de resultados',
    'analisis-resultados',
    'Procesamiento estadístico o técnico de datos, interpretación y redacción de la sección de resultados y discusión.',
    'puntual', 90.00, 160.00, 260.00
  );

-- ── 2. Cotizaciones ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gabinete.quotes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES gabinete.students(id) ON DELETE CASCADE,
  service_id      UUID NOT NULL REFERENCES gabinete.service_catalog(id),
  work_type       TEXT,
  academic_level  TEXT,
  career          TEXT,
  is_urgent       BOOLEAN       NOT NULL DEFAULT false,
  base_amount     NUMERIC(10,2) NOT NULL,
  final_amount    NUMERIC(10,2) NOT NULL,
  discount_pct    NUMERIC(5,2)  NOT NULL DEFAULT 0,
  notes           TEXT,
  status          TEXT          NOT NULL DEFAULT 'pendiente'
                  CHECK (status IN ('pendiente', 'aprobada', 'rechazada', 'expirada')),
  valid_until     TIMESTAMPTZ   NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  supervisor_id   UUID REFERENCES gabinete.students(id),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ── 3. Hitos de pago ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gabinete.payment_milestones (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id                 UUID NOT NULL REFERENCES gabinete.quotes(id) ON DELETE CASCADE,
  work_id                  UUID REFERENCES gabinete.academic_works(id),
  description              TEXT          NOT NULL,
  amount                   NUMERIC(10,2) NOT NULL,
  percentage               NUMERIC(5,2)  NOT NULL,
  due_at                   TIMESTAMPTZ,
  paid_at                  TIMESTAMPTZ,
  stripe_payment_intent_id TEXT,
  status                   TEXT          NOT NULL DEFAULT 'pendiente'
                           CHECK (status IN ('pendiente', 'pagado', 'vencido')),
  created_at               TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ── 4. Índices ───────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_quotes_student_id
  ON gabinete.quotes(student_id);

CREATE INDEX IF NOT EXISTS idx_payment_milestones_quote_id
  ON gabinete.payment_milestones(quote_id);

-- ── 5. RLS ───────────────────────────────────────────────────

ALTER TABLE gabinete.service_catalog     ENABLE ROW LEVEL SECURITY;
ALTER TABLE gabinete.quotes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE gabinete.payment_milestones  ENABLE ROW LEVEL SECURITY;

-- Catálogo: visible para todos los autenticados
CREATE POLICY "authenticated_select_catalog" ON gabinete.service_catalog
  FOR SELECT TO authenticated USING (is_active = true);

-- Cotizaciones: estudiante ve las suyas
CREATE POLICY "student_select_own_quotes" ON gabinete.quotes
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "student_insert_own_quotes" ON gabinete.quotes
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- Hitos: estudiante ve los de sus cotizaciones
CREATE POLICY "student_select_own_milestones" ON gabinete.payment_milestones
  FOR SELECT USING (
    quote_id IN (
      SELECT id FROM gabinete.quotes WHERE student_id = auth.uid()
    )
  );

-- ── 6. Permisos PostgREST ────────────────────────────────────

GRANT SELECT ON gabinete.service_catalog    TO authenticated;
GRANT SELECT, INSERT ON gabinete.quotes     TO authenticated;
GRANT SELECT ON gabinete.payment_milestones TO authenticated;
GRANT ALL ON gabinete.service_catalog       TO service_role;
GRANT ALL ON gabinete.quotes                TO service_role;
GRANT ALL ON gabinete.payment_milestones    TO service_role;
