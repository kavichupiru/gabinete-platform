'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { parseDataset, summarizeDataset, type DatasetSummary } from '@/lib/statistics'
import { interpretDataset } from '@/lib/stat-interpreter'

export interface StatAnalysis {
  id: string
  file_name: string
  summary_json: DatasetSummary
  interpretation: string | null
  created_at: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export async function getStatAnalyses(workId: string): Promise<StatAnalysis[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('statistical_analyses')
    .select('id, file_name, summary_json, interpretation, created_at')
    .eq('work_id', workId)
    .order('created_at', { ascending: false })

  return (data ?? []) as StatAnalysis[]
}

export async function analyzeDataset(workId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return { status: 'error' as const, message: 'Seleccioná un archivo CSV o Excel.' }
  if (file.size > MAX_FILE_SIZE) return { status: 'error' as const, message: 'El archivo supera el límite de 10 MB.' }
  if (!/\.(csv|xlsx|xls)$/i.test(file.name)) {
    return { status: 'error' as const, message: 'Solo se aceptan archivos .csv, .xlsx o .xls.' }
  }

  const { data: work, error: workError } = await supabase
    .from('academic_works')
    .select('id, title, work_type, academic_level, career, student_id')
    .eq('id', workId)
    .single()

  if (workError || !work) return { status: 'error' as const, message: 'Trabajo no encontrado.' }
  if (work.student_id !== user.id) return { status: 'error' as const, message: 'No autorizado.' }

  const buffer = Buffer.from(await file.arrayBuffer())

  let summary: DatasetSummary
  try {
    const rows = await parseDataset(buffer, file.name)
    if (rows.length === 0) return { status: 'error' as const, message: 'No se encontraron filas de datos en el archivo.' }
    summary = summarizeDataset(rows)
  } catch (err: any) {
    return { status: 'error' as const, message: `Error al leer el archivo: ${err.message}` }
  }

  const path = `${user.id}/dataset-${workId}-${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage.from('documents').upload(path, buffer, {
    contentType: file.type || 'text/csv',
  })
  if (uploadError) return { status: 'error' as const, message: uploadError.message }

  let interpretation: string
  try {
    interpretation = await interpretDataset(work, summary)
  } catch (err: any) {
    interpretation = `No se pudo generar la interpretación automática: ${err.message}`
  }

  const { error: insertError } = await supabase.from('statistical_analyses').insert({
    work_id: workId,
    file_name: file.name,
    file_path: path,
    summary_json: summary,
    interpretation,
  })
  if (insertError) return { status: 'error' as const, message: insertError.message }

  revalidatePath('/dashboard/student')
  return { status: 'success' as const, summary, interpretation }
}
