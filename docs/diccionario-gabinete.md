# Diccionario del Gabinete de Estudios

Define el significado institucional de cada `work_type`, para que estudiantes, prompts de IA (n8n) y el redactor apliquen criterios consistentes. Fuente única de verdad — cualquier ajuste a esta clasificación debe reflejarse en n8n (Switch de categoría) y en `lib/redactor.ts`.

## Categoría A — Investigación empírica
Exige pregunta de investigación, diseño metodológico, y — según el caso — instrumento, muestra y aprobación ética. Rúbrica de máxima exigencia (Flujo A, sin cambios).

| work_type | Definición institucional |
|---|---|
| `tesis` | Trabajo de investigación original con aporte al conocimiento, hipótesis u objetivo de investigación verificable, diseño metodológico completo. Exigencia máxima según nivel académico. |
| `artículo` | Reporte científico de una investigación (propia o de revisión sistemática), estructurado bajo normas de publicación (IMRaD u homólogo). Exige rigor metodológico proporcional al tipo de artículo (original, revisión, caso clínico). |

## Categoría B — Documentos no empíricos / estructurales
No exigen diseño de investigación primaria. Se evalúan por estructura, claridad, completitud y utilidad para su destinatario. Rúbrica de estructura documental (Flujo B, nuevo).

| work_type | Definición institucional |
|---|---|
| `informe` | Documento que reporta información, hallazgos o el estado de una situación, **sin que esto implique necesariamente una investigación primaria con datos propios**. Por defecto se trata como no empírico; si el contenido evidencia un diseño de investigación primario (encuesta propia, intervención, recolección de datos), el Gabinete lo reclasifica y lo audita como si fuera un `artículo`, dejándolo asentado en el diagnóstico. |
| `monografía` | Desarrollo argumentativo y documental sobre un tema delimitado, con revisión de fuentes, sin exigir datos primarios propios. |
| `ensayo` | Texto argumentativo con tesis propia, desarrollo lógico y fuentes de respaldo. No requiere diseño metodológico. |
| `trabajo_practico` | Aplicación de conceptos a una consigna o caso concreto. Se evalúa coherencia entre consigna y desarrollo, no marco teórico extenso. |
| `manual` | Documento de referencia operativa o pedagógica (procedimientos, protocolos, guías de uso). Se evalúa completitud de los pasos, claridad para el destinatario y consistencia interna. **No es un trabajo de investigación** — nunca debe evaluarse con criterios de hipótesis, muestra, instrumento validado o comité de ética. |
| `libro` | Obra estructurada por capítulos con coherencia argumental global. El nivel de originalidad exigido depende del propósito declarado (divulgación, texto de cátedra, aporte original) — no se asume por defecto el estándar de tesis. |
| `poster` | Síntesis visual-conceptual de un trabajo de base. Se evalúa claridad de síntesis, no completitud de investigación. |

## Regla de oro
Ante ambigüedad de clasificación, el Gabinete prioriza **la interpretación menos exigente** (Categoría B) y dejar constancia en el diagnóstico de que el tipo declarado podría ameritar revisión, en vez de rechazar el trabajo por criterios que no le corresponden.
