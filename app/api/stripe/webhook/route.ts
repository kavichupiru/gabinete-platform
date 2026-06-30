import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import type Stripe from 'stripe'

// Stripe requiere el body crudo (sin parsear) para verificar la firma
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body      = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Firma ausente' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    return NextResponse.json({ error: `Firma inválida: ${err.message}` }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session  = event.data.object as Stripe.Checkout.Session
  const meta     = session.metadata!

  const milestone_id    = meta.milestone_id
  const quote_id        = meta.quote_id
  const student_id      = meta.student_id
  const career          = meta.career
  const work_type       = meta.work_type
  const academic_level  = meta.academic_level

  const supabase = createAdminClient()

  // 1. Marcar el hito como pagado
  await supabase
    .from('payment_milestones')
    .update({ status: 'pagado', paid_at: new Date().toISOString() })
    .eq('id', milestone_id)

  // 2. Verificar si es el primer hito (anticipo) de la cotización
  const { data: milestones } = await supabase
    .from('payment_milestones')
    .select('id, status, percentage')
    .eq('quote_id', quote_id)
    .order('created_at', { ascending: true })

  const firstMilestone = milestones?.[0]
  const isFirstPayment = firstMilestone?.id === milestone_id

  // 3. Si es el primer pago → crear el trabajo académico y activar la auditoría
  if (isFirstPayment) {
    // Obtener citation_style de la cotización
    const { data: quote } = await supabase
      .from('quotes')
      .select('service_catalog ( slug )')
      .eq('id', quote_id)
      .single()

    const serviceSlug = (quote?.service_catalog as any)?.slug ?? ''
    const isAuditoria = serviceSlug === 'auditoria-diagnostica'

    const { data: work } = await supabase
      .from('academic_works')
      .insert({
        student_id,
        title:          `Trabajo — ${career} (${academic_level})`,
        work_type:      work_type || 'tesis',
        academic_level: academic_level || 'grado',
        citation_style: 'apa7',
        career,
        status:         isAuditoria ? 'en_auditoría' : 'pendiente_pago',
      })
      .select('id')
      .single()

    if (work) {
      // Vincular el hito al trabajo creado
      await supabase
        .from('payment_milestones')
        .update({ work_id: work.id })
        .eq('id', milestone_id)

      // Crear primera etapa metodológica
      await supabase
        .from('work_stages')
        .insert({
          work_id:    work.id,
          stage_name: 'propuesta',
          status:     'en_curso',
          changed_by: student_id,
        })
    }

    // 4. Actualizar status de la cotización a aprobada
    await supabase
      .from('quotes')
      .update({ status: 'aprobada' })
      .eq('id', quote_id)
  }

  return NextResponse.json({ received: true })
}
