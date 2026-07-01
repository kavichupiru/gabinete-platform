'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { draftRedaction, buildDocxBuffer } from '@/lib/redactor'

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

  const admin = createAdminClient()

  const { data: work, error: workError } = await admin
    .from('academic_works')
    .select('id, student_id, title, work_type, academic_level, career, citation_style')
    .eq('id', workId)
    .single()

  if (workError || !work) return { status: 'error' as const, message: workError?.message ?? 'Trabajo no encontrado.' }

  const { data: auditoria } = await admin
    .from('auditorias')
    .select('resumen_ejecutivo, tabla_confianza, fallas_criticas, recomendaciones')
    .eq('proyecto_id', workId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  try {
    const bodyText = await draftRedaction(work, auditoria ?? {
      resumen_ejecutivo: null,
      tabla_confianza: null,
      fallas_criticas: null,
      recomendaciones: null,
    })
    const docxBuffer = await buildDocxBuffer(work, bodyText)

    const path = `${work.student_id}/redactado-${workId}.docx`
    const { error: uploadError } = await admin.storage
      .from('documents')
      .upload(path, docxBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: true,
      })

    if (uploadError) return { status: 'error' as const, message: uploadError.message }

    const { data: existingAudit } = await admin
      .from('audits')
      .select('id')
      .eq('work_id', workId)
      .maybeSingle()

    if (existingAudit) {
      await admin
        .from('audits')
        .update({ output_docx_url: path, diagnosis_json: auditoria ?? null })
        .eq('id', existingAudit.id)
    } else {
      await admin
        .from('audits')
        .insert({ work_id: workId, input_document_url: '', output_docx_url: path, diagnosis_json: auditoria ?? null })
    }
  } catch (err: any) {
    return { status: 'error' as const, message: `Error al generar el documento: ${err.message}` }
  }

  const { error } = await admin
    .from('academic_works')
    .update({ status: 'entregado' })
    .eq('id', workId)

  if (error) return { status: 'error' as const, message: error.message }

  revalidatePath('/dashboard/supervisor')
  revalidatePath('/dashboard/student')
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
