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

## Checklist específico por tipo (Flujo B — Analista/Supervisor Documental)

Además del criterio general de Categoría B (propósito, estructura, coherencia, claridad), estos cuatro tipos tienen un checklist adicional que n8n aplica dentro del mismo Flujo B (no requiere ramas separadas):

**Manual**
- ¿Cada paso/procedimiento está numerado y en orden ejecutable?
- ¿Se identifica claramente quién debe ejecutar cada paso y con qué recursos?
- ¿Hay advertencias o excepciones documentadas donde el procedimiento puede fallar?
- ¿Existe una sección de alcance/objetivo del manual al inicio?

**Ensayo**
- ¿Hay una tesis o postura central identificable en la introducción?
- ¿Cada párrafo argumental aporta evidencia o razonamiento a esa tesis (no solo descripción)?
- ¿Hay una conclusión que retome la tesis, no solo un resumen?
- ¿Se citan fuentes que respalden los argumentos, no solo opinión del autor?

**Trabajo práctico**
- ¿Se identifica la consigna o el caso que dio origen al trabajo?
- ¿El desarrollo aplica correctamente los conceptos/herramientas pedidos en la consigna?
- ¿Hay evidencia concreta del trabajo realizado (cálculos, capturas, resultados, análisis)?
- ¿Las conclusiones responden directamente a lo que la consigna pedía?

**Libro**
- ¿Los capítulos tienen una progresión lógica entre sí (no son bloques inconexos)?
- ¿Hay introducción que declare el propósito de la obra y a quién está dirigida?
- ¿El nivel de originalidad es coherente con el propósito declarado (divulgación/cátedra/aporte original)?
- ¿Las fuentes están citadas de forma consistente en todos los capítulos?

`informe`, `monografía` y `poster` no tienen checklist adicional — se evalúan solo con el criterio general de Categoría B.

## Arquitectura del pipeline de auditoría (n8n)

```
Webhook (Supabase) → Filtro (status = en_auditoría) → Switch — Categoría (work_type)
  ├─ Empírico (tesis, artículo) → Switch por disciplina (Flujo A: Derecho, Seguridad,
  │    Salud, Arquitectura, Ingeniería, Economía) → Gemini Analista → Claude Supervisor
  │    → Code Parser → HTTP Request → gabinete.auditorias
  └─ Documental (informe, monografía, ensayo, trabajo_practico, manual, libro, poster)
       → Analista Documental → Supervisor Documental → Parser Documental
       → HTTP Request (mismo nodo compartido) → gabinete.auditorias
```

Cambiar esta categorización requiere actualizar el `Switch - Categoria` en n8n y esta tabla en simultáneo.
