import type { Metadata } from 'next'
import RegisterForm from '@/components/student/RegisterForm'

export const metadata: Metadata = { title: 'Registrarse — Gabinete de Estudios' }

export default function RegisterPage() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <h2 className="mb-6 text-xl font-semibold text-zinc-900">Crear cuenta</h2>
      <RegisterForm />
    </div>
  )
}
