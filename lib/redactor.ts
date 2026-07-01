import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx'
import { anthropic } from '@/lib/anthropic'

interface WorkInfo {
  title: string
  work_type: string
  academic_level: string
  career: string | null
  citation_style: string
}

interface AuditoriaInfo {
  resumen_ejecutivo: string | null
  tabla_confianza: Record<string, number> | null
  fallas_criticas: { errores?: string[] } | null
  recomendaciones: unknown
}

export async function draftRedaction(work: WorkInfo, auditoria: AuditoriaInfo): Promise<string> {
  const prompt = `Sos un asesor académico. A partir del siguiente diagnóstico de auditoría, redactá un informe de retroalimentación claro y accionable para el estudiante, en español, organizado en secciones: "Resumen del diagnóstico", "Puntos a corregir" y "Recomendaciones para la reformulación". No inventés datos que no estén en el diagnóstico.

Trabajo: "${work.title}" (${work.work_type}, ${work.academic_level}, carrera: ${work.career ?? 'no especificada'}, norma: ${work.citation_style})

Resumen ejecutivo de la auditoría:
${auditoria.resumen_ejecutivo ?? 'Sin resumen disponible.'}

Fallas críticas identificadas:
${(auditoria.fallas_criticas?.errores ?? []).map((e, i) => `${i + 1}. ${e}`).join('\n') || 'Ninguna registrada.'}

Recomendaciones previas:
${JSON.stringify(auditoria.recomendaciones ?? 'Ninguna registrada.')}`

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = msg.content[0]
  return block.type === 'text' ? block.text : ''
}

export async function buildDocxBuffer(work: WorkInfo, bodyText: string): Promise<Buffer> {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      text: work.title,
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Informe de retroalimentación — Gabinete de Estudios', italics: true })],
    }),
    new Paragraph({ text: '' }),
  ]

  for (const line of bodyText.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) {
      paragraphs.push(new Paragraph({ text: '' }))
      continue
    }
    if (trimmed.startsWith('#') || trimmed === trimmed.toUpperCase() && trimmed.length < 60) {
      paragraphs.push(new Paragraph({ text: trimmed.replace(/^#+\s*/, ''), heading: HeadingLevel.HEADING_2 }))
    } else {
      paragraphs.push(new Paragraph({ text: trimmed }))
    }
  }

  const doc = new Document({
    sections: [{ children: paragraphs }],
  })

  return Packer.toBuffer(doc)
}
