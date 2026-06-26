import type { Metadata } from 'next'
import LoginForm from '@/components/student/LoginForm'

export const metadata: Metadata = { title: 'Iniciar sesión — Gabinete de Estudios' }

export default function LoginPage() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <h2 className="mb-6 text-xl font-semibold text-zinc-900">Iniciar sesión</h2>
      <LoginForm />
    </div>
  )
}
