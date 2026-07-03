import { anthropic } from '@/lib/anthropic'

interface WorkContext {
  title: string
  work_type: string
  academic_level: string
  career: string | null
}

interface AuditoriaContext {
  resumen_ejecutivo: string | null
  fallas_criticas: { errores?: string[] } | null
  recomendaciones: unknown
}

interface ChatTurn {
  sender: 'student' | 'tutor'
  content: string
}

export async function getTutorReply(
  work: WorkContext,
  auditoria: AuditoriaContext | null,
  history: ChatTurn[],
  userMessage: string
): Promise<string> {
  const systemPrompt = `Sos el tutor académico del Gabinete de Estudios. Ayudás a un estudiante a entender el diagnóstico de auditoría de su trabajo y a avanzar en la reformulación. Respondé en español, en texto plano sin Markdown (nada de **, #, --- ni viñetas con guion — si necesitás enumerar, usá "1)", "2)").

Contexto del trabajo:
- Título: ${work.title}
- Tipo: ${work.work_type}
- Nivel: ${work.academic_level}
- Carrera: ${work.career ?? 'no especificada'}

Diagnóstico de la auditoría:
${auditoria?.resumen_ejecutivo ?? 'Sin diagnóstico disponible todavía.'}

Fallas críticas identificadas:
${(auditoria?.fallas_criticas?.errores ?? []).map((e, i) => `${i + 1}) ${e}`).join('\n') || 'Ninguna registrada.'}

Recomendaciones previas:
${JSON.stringify(auditoria?.recomendaciones ?? 'Ninguna registrada.')}

Respondé únicamente sobre este trabajo y su diagnóstico. Si el estudiante pregunta algo fuera de este contexto (no relacionado a su trabajo académico), redirigilo amablemente al tema. No inventés información que no esté en el diagnóstico.`

  const messages = [
    ...history.map(h => ({
      role: (h.sender === 'student' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: h.content,
    })),
    { role: 'user' as const, content: userMessage },
  ]

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: systemPrompt,
    messages,
  })

  const block = msg.content[0]
  return block.type === 'text' ? block.text : 'No pude generar una respuesta. Intentá de nuevo.'
}
