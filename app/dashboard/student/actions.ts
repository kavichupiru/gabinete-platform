'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { WorkType, AcademicLevel, CitationStyle } from '@/types'

export type WorkFormError = { message: string }
export type ProfileState = { message: string; type: 'error' | 'success' }

export async function updateProfile(
  _prevState: ProfileState | undefined,
  formData: FormData
): Promise<ProfileState> {
  const full_name      = (formData.get('full_name') as string).trim()
  const country        = (formData.get('country') as string).trim()
  const id_number      = (formData.get('id_number') as string).trim()
  const phone          = (formData.get('phone') as string).trim()
  const institution    = (formData.get('institution') as string).trim()
  const career         = (formData.get('career') as string).trim()
  const academic_level = formData.get('academic_level') as AcademicLevel | ''

  if (!full_name) return { message: 'El nombre es obligatorio.', type: 'error' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('students')
    .update({
      full_name,
      country:        country || null,
      id_number:      id_number || null,
      phone:          phone || null,
      institution:    institution || null,
      career:         career || null,
      academic_level: academic_level || null,
    })
    .eq('id', user.id)

  if (error) return { message: error.message, type: 'error' }

  revalidatePath('/dashboard/student')
  return { message: 'Perfil actualizado correctamente.', type: 'success' }
}

// Crea el registro en academic_works después de que el archivo ya subió al Storage
export async function createWork(
  _prevState: WorkFormError | undefined,
  formData: FormData
): Promise<WorkFormError | undefined> {
  const title          = formData.get('title') as string
  const work_type      = formData.get('work_type') as WorkType
  const academic_level = formData.get('academic_level') as AcademicLevel
  const citation_style = formData.get('citation_style') as CitationStyle
  const document_url   = formData.get('document_url') as string

  if (!document_url) return { message: 'El documento es obligatorio.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Insertar trabajo con status inicial pendiente_pago
  const { data: work, error: workError } = await supabase
    .from('academic_works')
    .insert({
      student_id:     user.id,
      title,
      work_type,
      academic_level,
      citation_style,
      status:         'pendiente_pago',
    })
    .select('id')
    .single()

  if (workError) return { message: workError.message }

  // Registrar primera etapa del carril metodológico
  const { error: stageError } = await supabase
    .from('work_stages')
    .insert({
      work_id:    work.id,
      stage_name: 'propuesta',
      status:     'en_curso',
      changed_by: user.id,
    })

  if (stageError) return { message: stageError.message }

  // Registrar la URL del documento en la auditoría inicial (sin output aún)
  await supabase.from('audits').insert({
    work_id:            work.id,
    input_document_url: document_url,
  })

  redirect('/dashboard/student')
}
