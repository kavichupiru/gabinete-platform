import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) redirect('/login')

  const { data: student } = await supabase
    .from('students')
    .select('full_name, email, institution, academic_level, role')
    .eq('id', user.id)
    .single()

  const displayName = student?.full_name ?? user.email ?? 'Estudiante'
  const displayEmail = student?.email ?? user.email ?? ''

  return (
    <div className="flex flex-col gap-8">

      {/* Encabezado de bienvenida */}
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-5 shadow-sm">
        <p className="text-sm text-zinc-500">Bienvenido a</p>
        <h1 className="mt-0.5 text-2xl font-bold text-zinc-900">Gabinete de Estudios</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Auditoría y producción científica para investigadores.
        </p>
      </div>

      {/* Perfil del estudiante */}
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Mi perfil</h2>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Nombre</dt>
            <dd className="mt-0.5 text-sm text-zinc-900">{displayName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Correo</dt>
            <dd className="mt-0.5 text-sm text-zinc-900">{displayEmail}</dd>
          </div>
          {student?.institution && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Institución</dt>
              <dd className="mt-0.5 text-sm text-zinc-900">{student.institution}</dd>
            </div>
          )}
          {student?.academic_level && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Nivel académico</dt>
              <dd className="mt-0.5 text-sm text-zinc-900 capitalize">{student.academic_level}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Módulos — estructura lista para M1-M8 */}
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-5 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-zinc-900">Mis trabajos</h2>
        <p className="text-sm text-zinc-500">
          Aquí verás el estado de tus trabajos académicos y podrás subir nuevos documentos.
        </p>
        <div className="mt-4 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center">
          <p className="text-sm text-zinc-400">Módulo de trabajos — próximamente</p>
        </div>
      </div>

    </div>
  )
}
