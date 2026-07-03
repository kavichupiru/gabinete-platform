'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getTutorReply } from '@/lib/tutor'

export interface ChatMessage {
  id: string
  sender: 'student' | 'tutor'
  content: string
  created_at: string
}

export async function getChatHistory(workId: string): Promise<ChatMessage[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('chat_messages')
    .select('id, sender, content, created_at')
    .eq('work_id', workId)
    .order('created_at', { ascending: true })

  return (data ?? []) as ChatMessage[]
}

export async function sendTutorMessage(workId: string, message: string) {
  const trimmed = message.trim()
  if (!trimmed) return { status: 'error' as const, message: 'Escribí una consulta.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: work, error: workError } = await supabase
    .from('academic_works')
    .select('id, title, work_type, academic_level, career, student_id')
    .eq('id', workId)
    .single()

  if (workError || !work) return { status: 'error' as const, message: 'Trabajo no encontrado.' }
  if (work.student_id !== user.id) return { status: 'error' as const, message: 'No autorizado.' }

  const { data: auditoria } = await supabase
    .from('auditorias')
    .select('resumen_ejecutivo, fallas_criticas, recomendaciones')
    .eq('proyecto_id', workId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: history } = await supabase
    .from('chat_messages')
    .select('sender, content')
    .eq('work_id', workId)
    .order('created_at', { ascending: true })
    .limit(20)

  await supabase.from('chat_messages').insert({ work_id: workId, sender: 'student', content: trimmed })

  let reply: string
  try {
    reply = await getTutorReply(work, auditoria ?? null, (history ?? []) as any, trimmed)
  } catch (err: any) {
    return { status: 'error' as const, message: `Error al consultar al tutor: ${err.message}` }
  }

  await supabase.from('chat_messages').insert({ work_id: workId, sender: 'tutor', content: reply })

  revalidatePath('/dashboard/student')
  return { status: 'success' as const, reply }
}
