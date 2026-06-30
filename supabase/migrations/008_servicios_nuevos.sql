-- ============================================================
-- Migration 008: Nuevos servicios para ensayo, trabajo práctico,
--                manual de procedimiento y libro
-- ============================================================

INSERT INTO gabinete.service_catalog
  (name, slug, description, service_type, price_grado, price_posgrado, price_doctorado, is_active)
VALUES
  (
    'Elaboración de ensayo',
    'elaboracion-ensayo',
    'Redacción académica de ensayo argumentativo o reflexivo: estructuración de tesis, desarrollo de argumentos, fuentes y conclusiones con norma de citación correspondiente.',
    'proceso',
    80.00, 130.00, 200.00,
    true
  ),
  (
    'Elaboración de trabajo práctico',
    'elaboracion-trabajo-practico',
    'Desarrollo completo de trabajo práctico o de campo: diseño metodológico, recolección de datos, análisis e informe final según reglamento institucional.',
    'proceso',
    90.00, 150.00, 220.00,
    true
  ),
  (
    'Manual de procedimiento',
    'manual-procedimiento',
    'Elaboración de manuales técnicos, administrativos o de calidad: estructura normativa, flujogramas, descripción de procesos y formato institucional.',
    'proceso',
    150.00, 250.00, 380.00,
    true
  ),
  (
    'Producción de libro',
    'produccion-libro',
    'Producción editorial académica o técnica: estructuración por capítulos, revisión metodológica, normas de citación, preparación para publicación (plataforma, KDP o Gumroad).',
    'proceso',
    350.00, 600.00, 900.00,
    true
  );
