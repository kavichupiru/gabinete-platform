import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { milestone_id } = await request.json()
  if (!milestone_id) return NextResponse.json({ error: 'milestone_id requerido' }, { status: 400 })

  // Obtener el hito con su cotización y servicio
  const { data: milestone, error } = await supabase
    .from('payment_milestones')
    .select(`
      id, amount, description, status,
      quotes (
        id, student_id, final_amount, academic_level, career, work_type, is_urgent,
        service_catalog ( name )
      )
    `)
    .eq('id', milestone_id)
    .single()

  if (error || !milestone) {
    return NextResponse.json({ error: 'Hito no encontrado' }, { status: 404 })
  }

  const quote = milestone.quotes as any
  if (quote.student_id !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  if (milestone.status === 'pagado') {
    return NextResponse.json({ error: 'Este hito ya fue pagado' }, { status: 400 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gabinete-platform.vercel.app'

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(milestone.amount * 100), // Stripe usa centavos
          product_data: {
            name: (quote.service_catalog as any)?.name ?? 'Servicio académico',
            description: milestone.description,
          },
        },
      },
    ],
    metadata: {
      milestone_id: milestone.id,
      quote_id:     quote.id,
      student_id:   user.id,
      career:       quote.career ?? '',
      work_type:    quote.work_type ?? '',
      academic_level: quote.academic_level ?? '',
    },
    success_url: `${siteUrl}/dashboard/student?payment=success`,
    cancel_url:  `${siteUrl}/dashboard/student?payment=cancelled`,
  })

  return NextResponse.json({ url: session.url })
}
