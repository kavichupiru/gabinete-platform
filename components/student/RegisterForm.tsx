'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUp, type AuthState } from '@/app/(auth)/actions'
import FormField from '@/components/ui/FormField'
import SubmitButton from '@/components/ui/SubmitButton'

const NIVELES = [
  { value: 'grado',          label: 'Licenciatura / Grado' },
  { value: 'especialización', label: 'Especialización' },
  { value: 'maestría',       label: 'Maestría' },
  { value: 'doctorado',      label: 'Doctorado' },
]

export default function RegisterForm() {
  const [state, action] = useActionState(signUp, undefined)

  return (
    <form action={action} className="flex flex-col gap-5">
      <FormField
        label="Nombre completo"
        name="full_name"
        type="text"
        autoComplete="name"
        required
        placeholder="Ej: María González"
      />
      <FormField
        label="Correo electrónico"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="tu@correo.com"
      />
      <FormField
        label="Institución"
        name="institution"
        type="text"
        required
        placeholder="Ej: Universidad Nacional de Asunción"
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="academic_level" className="text-sm font-medium text-zinc-700">
          Nivel académico
        </label>
        <select
          id="academic_level"
          name="academic_level"
          required
          defaultValue=""
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        >
          <option value="" disabled>Seleccioná tu nivel</option>
          {NIVELES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <FormField
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        placeholder="Mínimo 6 caracteres"
        minLength={6}
      />

      {state?.type === 'confirm' && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {state.message}
        </p>
      )}
      {state?.type === 'error' && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.message}
        </p>
      )}

      <SubmitButton label="Crear cuenta" loadingLabel="Registrando..." />

      <p className="text-center text-sm text-zinc-500">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="font-medium text-zinc-900 hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </form>
  )
}
