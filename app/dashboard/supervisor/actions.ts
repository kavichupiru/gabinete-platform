'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function getWorksInAuditoria() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('academic_works')
    .select(`
      id, title, work_type, academic_level, career, status, created_at,
      students ( full_name, email ),
      auditorias ( id, resumen_ejecutivo, tabla_confianza, fallas_criticas, fallas_menores, fortalezas, recomendaciones, ciclo_n, created_at )
    `)
    .eq('status', 'en_auditoría')
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function approveWork(workId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('academic_works')
    .update({ status: 'entregado' })
    .eq('id', workId)

  if (error) return { status: 'error' as const, message: error.message }

  revalidatePath('/dashboard/supervisor')
  return { status: 'success' as const }
}

export async function rejectWork(workId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('academic_works')
    .update({ status: 'pendiente_pago' })
    .eq('id', workId)

  if (error) return { status: 'error' as const, message: error.message }

  revalidatePath('/dashboard/supervisor')
  return { status: 'success' as const }
}
