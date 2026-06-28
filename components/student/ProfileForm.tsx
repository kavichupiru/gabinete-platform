'use client'

import { useActionState } from 'react'
import { updateProfile, type ProfileState } from '@/app/dashboard/student/actions'
import FormField from '@/components/ui/FormField'
import SubmitButton from '@/components/ui/SubmitButton'

const NIVELES = [
  { value: 'grado',           label: 'Grado' },
  { value: 'posgrado',        label: 'Posgrado' },
  { value: 'diplomado',       label: 'Diplomado' },
  { value: 'especialización', label: 'Especialización' },
  { value: 'masterado',       label: 'Masterado' },
  { value: 'doctorado',       label: 'Doctorado' },
]

interface Props {
  initialName?: string
  initialCountry?: string
  initialIdNumber?: string
  initialPhone?: string
  initialInstitution?: string
  initialCareer?: string
  initialLevel?: string
}

export default function ProfileForm({
  initialName = '',
  initialCountry = '',
  initialIdNumber = '',
  initialPhone = '',
  initialInstitution = '',
  initialCareer = '',
  initialLevel = '',
}: Props) {
  const [state, action] = useActionState<ProfileState | undefined, FormData>(updateProfile, undefined)

  return (
    <form action={action} className="flex flex-col gap-6">

      {/* ── Datos personales ───────────────────────────── */}
      <div className="flex flex-col gap-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Datos personales
        </p>
        <FormField
          label="Nombre completo"
          name="full_name"
          type="text"
          required
          defaultValue={initialName}
          placeholder="Ej: Juan Pérez"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="País"
            name="country"
            type="text"
            defaultValue={initialCountry}
            placeholder="Ej: Paraguay"
          />
          <FormField
            label="Nro. documento de identidad"
            name="id_number"
            type="text"
            defaultValue={initialIdNumber}
            placeholder="Ej: 4.567.890"
          />
        </div>
        <FormField
          label="Teléfono"
          name="phone"
          type="tel"
          defaultValue={initialPhone}
          placeholder="Ej: +595 981 123456"
        />
      </div>

      {/* ── Filiación académica ────────────────────────── */}
      <div className="flex flex-col gap-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Filiación académica
        </p>
        <FormField
          label="Universidad / Institución"
          name="institution"
          type="text"
          defaultValue={initialInstitution}
          placeholder="Ej: Universidad Nacional de Asunción"
        />
        <FormField
          label="Carrera"
          name="career"
          type="text"
          defaultValue={initialCareer}
          placeholder="Ej: Medicina, Derecho, Ingeniería..."
        />
        <div className="flex flex-col gap-1">
          <label htmlFor="academic_level" className="text-sm font-medium text-zinc-700">
            Nivel académico
          </label>
          <select
            id="academic_level"
            name="academic_level"
            defaultValue={initialLevel}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            <option value="">Sin especificar</option>
            {NIVELES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {state?.type === 'success' && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{state.message}</p>
      )}
      {state?.type === 'error' && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.message}</p>
      )}

      <SubmitButton label="Guardar cambios" loadingLabel="Guardando..." />
    </form>
  )
}
