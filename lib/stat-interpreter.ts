import { anthropic } from '@/lib/anthropic'
import type { DatasetSummary } from '@/lib/statistics'

interface WorkContext {
  title: string
  work_type: string
  academic_level: string
  career: string | null
}

export async function interpretDataset(work: WorkContext, summary: DatasetSummary): Promise<string> {
  const prompt = `Sos un asesor de análisis estadístico del Gabinete de Estudios. Redactá una interpretación clara de estos resultados descriptivos, en español, en texto plano sin Markdown (nada de **, #, --- ni viñetas con guion — si necesitás enumerar, usá "1)", "2)").

Trabajo: "${work.title}" (${work.work_type}, ${work.academic_level}, carrera: ${work.career ?? 'no especificada'})

Dataset: ${summary.rowCount} filas, ${summary.columns.length} columnas.

Resumen por columna:
${summary.columns.map(c => {
  if (c.type === 'numeric') {
    return `- ${c.name} (numérica, ${c.count} valores, ${c.missing} faltantes): media=${c.mean}, mediana=${c.median}, desvío estándar=${c.stdDev}, mín=${c.min}, máx=${c.max}`
  }
  const top = Object.entries(c.frequencies ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 5)
  return `- ${c.name} (categórica, ${c.count} valores, ${c.missing} faltantes): frecuencias principales ${top.map(([k, v]) => `${k}=${v}`).join(', ')}`
}).join('\n')}

Redactá: 1) una lectura general de los datos (calidad, faltantes, tamaño de muestra), 2) hallazgos relevantes por variable, 3) sugerencias de análisis adicionales que el estudiante podría aplicar según su tipo de trabajo (correlaciones, pruebas de hipótesis, comparación de grupos, etc., solo si son pertinentes). No inventés relaciones causales que los datos no muestran.`

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = msg.content[0]
  return block.type === 'text' ? block.text : 'No se pudo generar la interpretación.'
}
