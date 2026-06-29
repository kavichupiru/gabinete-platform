'use client'

import { useActionState, useState } from 'react'
import { requestQuote } from '@/app/dashboard/student/quote-actions'
import type { QuoteState } from '@/app/dashboard/student/quote-actions'
import type { AcademicLevel, WorkType } from '@/types'

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

interface Props {
  services: Service[]
  defaultCareer?: string
  defaultLevel?: AcademicLevel | ''
  onCancel: () => void
}

const LEVEL_OPTIONS: { value: AcademicLevel; label: string; group: string }[] = [
  { value: 'grado',          label: 'Grado',          group: 'grado' },
  { value: 'diplomado',      label: 'Diplomado',      group: 'grado' },
  { value: 'posgrado',       label: 'Posgrado',       group: 'posgrado' },
  { value: 'especialización',label: 'Especialización', group: 'posgrado' },
  { value: 'masterado',      label: 'Masterado',      group: 'posgrado' },
  { value: 'doctorado',      label: 'Doctorado',      group: 'doctorado' },
]

const WORK_TYPES: { value: WorkType; label: string }[] = [
  { value: 'tesis',      label: 'Tesis' },
  { value: 'monografía', label: 'Monografía' },
  { value: 'artículo',   label: 'Artículo científico' },
  { value: 'informe',    label: 'Informe' },
  { value: 'poster',     label: 'Póster académico' },
]

function getLevelGroup(level: AcademicLevel): 'grado' | 'posgrado' | 'doctorado' {
  if (level === 'doctorado') return 'doctorado'
  if (level === 'grado' || level === 'diplomado') return 'grado'
  return 'posgrado'
}

function calcPrice(service: Service, level: AcademicLevel, urgent: boolean): number {
  const group = getLevelGroup(level)
  const base = group === 'grado'
    ? service.price_grado
    : group === 'doctorado'
      ? service.price_doctorado
      : service.price_posgrado
  return urgent ? Math.round(base * service.urgency_multiplier * 100) / 100 : base
}

const initialState: QuoteState = { status: 'idle' }

export default function QuoteForm({ services, defaultCareer, defaultLevel, onCancel }: Props) {
  const [state, action, pending] = useActionState(requestQuote, initialState)

  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [selectedLevel, setSelectedLevel]         = useState<AcademicLevel | ''>(defaultLevel || '')
  const [isUrgent, setIsUrgent]                   = useState(false)

  const selectedService = services.find(s => s.id === selectedServiceId)
  const estimatedPrice  = selectedService && selectedLevel
    ? calcPrice(selectedService, selectedLevel as AcademicLevel, isUrgent)
    : null

  const isProcess = selectedService?.service_type === 'proceso'

  if (state.status === 'success') {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-6 shadow-sm">
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          Cotización generada correctamente.
        </div>

        <h3 className="mb-1 text-base font-semibold text-zinc-900">Resumen de tu cotización</h3>
        <p className="mb-4 text-sm text-zinc-500">
          Total: <span className="font-semibold text-zinc-900">${state.finalAmount.toFixed(2)} USD</span>
          {isProcess && ' — pagadero en hitos'}
        </p>

        <ul className="mb-6 space-y-2">
          {state.milestones.map((m, i) => (
            <li key={i} className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3 text-sm">
              <span className="text-zinc-700">{m.description}</span>
              <span className="font-semibold text-zinc-900">${m.amount.toFixed(2)}</span>
            </li>
          ))}
        </ul>

        <p className="text-xs text-zinc-400">
          Un supervisor revisará tu cotización. Te notificaremos cuando esté lista para proceder al pago.
        </p>

        <button
          onClick={onCancel}
          className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition"
        >
          Volver al dashboard
        </button>
      </div>
    )
  }

  return (
    <form action={action} className="rounded-2xl border border-zinc-200 bg-white px-6 py-6 shadow-sm">
      <h3 className="mb-5 text-base font-semibold text-zinc-900">Solicitar cotización</h3>

      {state.status === 'error' && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.message}</p>
      )}

      {/* Servicio */}
      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
          Servicio
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          {services.map(s => (
            <label
              key={s.id}
              className={`cursor-pointer rounded-xl border-2 px-4 py-3 transition ${
                selectedServiceId === s.id
                  ? 'border-zinc-900 bg-zinc-50'
                  : 'border-zinc-200 hover:border-zinc-400'
              }`}
            >
              <input
                type="radio"
                name="service_id"
                value={s.id}
                className="sr-only"
                onChange={() => setSelectedServiceId(s.id)}
              />
              <p className="text-sm font-semibold text-zinc-900">{s.name}</p>
              <p className="mt-0.5 text-xs text-zinc-500 leading-relaxed">{s.description}</p>
              <p className="mt-2 text-xs font-medium text-zinc-700">
                Desde ${s.price_grado} USD
              </p>
            </label>
          ))}
        </div>
      </div>

      {/* Nivel académico */}
      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
          Nivel académico
        </label>
        <select
          name="academic_level"
          value={selectedLevel}
          onChange={e => setSelectedLevel(e.target.value as AcademicLevel)}
          required
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
        >
          <option value="">Seleccioná tu nivel</option>
          {LEVEL_OPTIONS.map(l => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>

      {/* Tipo de trabajo */}
      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
          Tipo de trabajo
        </label>
        <select
          name="work_type"
          required
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
        >
          <option value="">Seleccioná el tipo</option>
          {WORK_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Carrera */}
      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
          Carrera / Disciplina
        </label>
        <input
          type="text"
          name="career"
          defaultValue={defaultCareer}
          placeholder="Ej: Derecho, Ingeniería Electromecánica, Enfermería..."
          required
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      {/* Urgencia */}
      <div className="mb-4 flex items-center gap-3">
        <input
          type="checkbox"
          id="is_urgent"
          name="is_urgent"
          checked={isUrgent}
          onChange={e => setIsUrgent(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 text-zinc-900"
        />
        <label htmlFor="is_urgent" className="text-sm text-zinc-700">
          Entrega urgente <span className="text-zinc-400">(×{services[0]?.urgency_multiplier ?? 1.4} sobre el precio base)</span>
        </label>
      </div>

      {/* Notas opcionales */}
      <div className="mb-5">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
          Notas adicionales <span className="normal-case text-zinc-400">(opcional)</span>
        </label>
        <textarea
          name="notes"
          rows={3}
          placeholder="Describe brevemente tu trabajo, contexto o requerimientos especiales..."
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
        />
      </div>

      {/* Precio estimado */}
      {estimatedPrice !== null && (
        <div className="mb-5 rounded-xl bg-zinc-50 px-4 py-3">
          <p className="text-xs text-zinc-500">Precio estimado</p>
          <p className="text-2xl font-bold text-zinc-900">${estimatedPrice.toFixed(2)} <span className="text-sm font-normal text-zinc-500">USD</span></p>
          {isProcess && (
            <p className="mt-1 text-xs text-zinc-500">
              Anticipo: <strong>${(estimatedPrice * 0.5).toFixed(2)}</strong> al contratar
            </p>
          )}
          {isUrgent && (
            <p className="mt-0.5 text-xs text-amber-600">Incluye recargo por urgencia</p>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending || !selectedServiceId || !selectedLevel}
          className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition"
        >
          {pending ? 'Generando cotización...' : 'Solicitar cotización'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
