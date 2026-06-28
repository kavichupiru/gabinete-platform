'use client'

import { useActionState } from 'react'
import { updateProfile, type ProfileState } from '@/app/dashboard/student/actions'
import FormField from '@/components/ui/FormField'
import SubmitButton from '@/components/ui/SubmitButton'

const NIVELES = [
  { value: 'grado',           label: 'Licenciatura / Grado' },
  { value: 'especialización', label: 'Especialización' },
  { value: 'maestría',        label: 'Maestría' },
  { value: 'doctorado',       label: 'Doctorado' },
]

interface Props {
  initialName?: string
  initialInstitution?: string
  initialLevel?: string
}

export default function ProfileForm({ initialName = '', initialInstitution = '', initialLevel = '' }: Props) {
  const [state, action] = useActionState<ProfileState | undefined, FormData>(updateProfile, undefined)

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormField
        label="Nombre completo"
        name="full_name"
        type="text"
        required
        defaultValue={initialName}
        placeholder="Ej: Juan Pérez"
      />
      <FormField
        label="Institución"
        name="institution"
        type="text"
        defaultValue={initialInstitution}
        placeholder="Ej: Universidad Nacional de Asunción"
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
