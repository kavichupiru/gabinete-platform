'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signIn, type AuthError } from '@/app/(auth)/actions'
import FormField from '@/components/ui/FormField'
import SubmitButton from '@/components/ui/SubmitButton'

export default function LoginForm() {
  const [error, action] = useActionState(signIn, undefined)

  return (
    <form action={action} className="flex flex-col gap-5">
      <FormField
        label="Correo electrónico"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="tu@correo.com"
      />
      <FormField
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        placeholder="••••••••"
      />

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error.message}
        </p>
      )}

      <SubmitButton label="Iniciar sesión" loadingLabel="Verificando..." />

      <p className="text-center text-sm text-zinc-500">
        ¿No tenés cuenta?{' '}
        <Link href="/register" className="font-medium text-zinc-900 hover:underline">
          Registrarse
        </Link>
      </p>
    </form>
  )
}
