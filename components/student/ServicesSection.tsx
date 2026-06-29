'use client'

import { useState } from 'react'
import QuoteForm from './QuoteForm'
import type { AcademicLevel } from '@/types'

interface Service {
  id: string
  name: string
  slug: string
  description: string
  service_type: string
  price_grado: number
  price_posgrado: number
  price_doctorado: number
  urgency_multiplier: number
}

interface Quote {
  id: string
  status: string
  final_amount: number
  is_urgent: boolean
  created_at: string
  service_catalog: { name: string; service_type: string } | null
  payment_milestones: { description: string; amount: number; status: string }[]
}

interface Props {
  services: Service[]
  quotes: Quote[]
  defaultCareer?: string
  defaultLevel?: AcademicLevel | ''
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pendiente:  { label: 'Pendiente de revisión', color: 'text-amber-600 bg-amber-50' },
  aprobada:   { label: 'Aprobada — lista para pagar', color: 'text-green-700 bg-green-50' },
  rechazada:  { label: 'Rechazada', color: 'text-red-600 bg-red-50' },
  expirada:   { label: 'Expirada', color: 'text-zinc-400 bg-zinc-50' },
}

export default function ServicesSection({ services, quotes, defaultCareer, defaultLevel }: Props) {
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900">Servicios</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition"
          >
            + Solicitar servicio
          </button>
        )}
      </div>

      {showForm && (
        <QuoteForm
          services={services}
          defaultCareer={defaultCareer}
          defaultLevel={defaultLevel}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Cotizaciones anteriores */}
      {quotes.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-zinc-500">Mis cotizaciones</h3>
          {quotes.map(q => {
            const st = STATUS_LABELS[q.status] ?? STATUS_LABELS.pendiente
            return (
              <div
                key={q.id}
                className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">
                      {q.service_catalog?.name ?? 'Servicio'}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {new Date(q.created_at).toLocaleDateString('es-PY', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                      {q.is_urgent && ' · Urgente'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-zinc-900">${q.final_amount.toFixed(2)}</p>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${st.color}`}>
                      {st.label}
                    </span>
                  </div>
                </div>

                {/* Hitos */}
                {q.payment_milestones.length > 0 && (
                  <ul className="mt-3 space-y-1.5 border-t border-zinc-100 pt-3">
                    {q.payment_milestones.map((m, i) => (
                      <li key={i} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-600">{m.description}</span>
                        <span className="font-medium text-zinc-900">${m.amount.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}

      {quotes.length === 0 && !showForm && (
        <div className="rounded-2xl border border-dashed border-zinc-200 px-6 py-8 text-center">
          <p className="text-sm text-zinc-400">
            Todavía no tenés cotizaciones. Solicitá un servicio para comenzar.
          </p>
        </div>
      )}
    </div>
  )
}
