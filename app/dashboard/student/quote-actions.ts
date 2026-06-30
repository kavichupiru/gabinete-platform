'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { AcademicLevel, WorkType, CitationStyle } from '@/types'

export type QuoteState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'success'; quoteId: string; finalAmount: number; milestones: Milestone[] }

export interface Milestone {
  description: string
  amount: number
  percentage: number
}

type LevelGroup = 'grado' | 'posgrado' | 'doctorado'

function getLevelGroup(level: AcademicLevel): LevelGroup {
  if (level === 'doctorado') return 'doctorado'
  if (level === 'grado' || level === 'diplomado') return 'grado'
  return 'posgrado' // posgrado, especialización, masterado
}

function buildMilestones(serviceType: string, finalAmount: number): Milestone[] {
  if (serviceType === 'puntual') {
    return [{ description: 'Pago único al contratar', amount: finalAmount, percentage: 100 }]
  }
  const anticipo = Math.round(finalAmount * 0.5 * 100) / 100
  const hito     = Math.round(finalAmount * 0.25 * 100) / 100
  const saldo    = Math.round((finalAmount - anticipo - hito) * 100) / 100
  return [
    { description: 'Anticipo al contratar (50%)',       amount: anticipo, percentage: 50 },
    { description: 'Hito intermedio (25%)',              amount: hito,     percentage: 25 },
    { description: 'Saldo final al entregar (25%)',      amount: saldo,    percentage: 25 },
  ]
}

export async function requestQuote(
  _prevState: QuoteState,
  formData: FormData
): Promise<QuoteState> {
  const service_id     = formData.get('service_id') as string
  const academic_level = formData.get('academic_level') as AcademicLevel
  const work_type      = formData.get('work_type') as WorkType
  const career         = (formData.get('career') as string).trim()
  const is_urgent      = formData.get('is_urgent') === 'on'
  const notes          = (formData.get('notes') as string | null)?.trim() || null

  if (!service_id || !academic_level || !work_type || !career) {
    return { status: 'error', message: 'Todos los campos son obligatorios.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Obtener servicio del catálogo
  const { data: service, error: serviceError } = await supabase
    .from('service_catalog')
    .select('*')
    .eq('id', service_id)
    .eq('is_active', true)
    .single()

  if (serviceError || !service) {
    return { status: 'error', message: 'Servicio no encontrado.' }
  }

  // Calcular precio base según nivel académico
  const levelGroup = getLevelGroup(academic_level)
  const priceField = `price_${levelGroup}` as keyof typeof service
  const baseAmount = service[priceField] as number

  // Aplicar multiplicador de urgencia
  const finalAmount = is_urgent
    ? Math.round(baseAmount * service.urgency_multiplier * 100) / 100
    : baseAmount

  // Generar hitos de pago
  const milestones = buildMilestones(service.service_type, finalAmount)

  // Insertar cotización
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .insert({
      student_id:     user.id,
      service_id,
      work_type,
      academic_level,
      career,
      is_urgent,
      base_amount:    baseAmount,
      final_amount:   finalAmount,
      notes,
      status:         'pendiente',
    })
    .select('id')
    .single()

  if (quoteError || !quote) {
    return { status: 'error', message: quoteError?.message ?? 'Error al generar la cotización.' }
  }

  // Insertar hitos de pago
  const { error: milestonesError } = await supabase
    .from('payment_milestones')
    .insert(
      milestones.map(m => ({
        quote_id:    quote.id,
        description: m.description,
        amount:      m.amount,
        percentage:  m.percentage,
        status:      'pendiente',
      }))
    )

  if (milestonesError) {
    return { status: 'error', message: milestonesError.message }
  }

  revalidatePath('/dashboard/student')
  return { status: 'success', quoteId: quote.id, finalAmount, milestones }
}

export async function getServiceCatalog() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('service_catalog')
    .select('*')
    .eq('is_active', true)
    .order('service_type')
  return data ?? []
}

export async function getStudentQuotes() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('quotes')
    .select(`
      *,
      service_catalog ( name, slug, service_type ),
      payment_milestones ( * )
    `)
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })

  return data ?? []
}
