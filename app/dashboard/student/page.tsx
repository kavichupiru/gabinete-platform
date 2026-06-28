import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileForm from '@/components/student/ProfileForm'

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) redirect('/login')

  const { data: student } = await supabase
    .from('students')
    .select('full_name, email, institution, academic_level, role')
    .eq('id', user.id)
    .single()

  const fullName    = student?.full_name?.trim() || ''
  const email       = student?.email || user.email || ''
  const institution = student?.institution?.trim() || ''
  const level       = student?.academic_level || ''
  const profileComplete = fullName.length > 0

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

      {/* Perfil */}
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Mi perfil</h2>

        {profileComplete ? (
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Nombre</dt>
              <dd className="mt-0.5 text-sm text-zinc-900">{fullName}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Correo</dt>
              <dd className="mt-0.5 text-sm text-zinc-900">{email}</dd>
            </div>
            {institution && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Institución</dt>
                <dd className="mt-0.5 text-sm text-zinc-900">{institution}</dd>
              </div>
            )}
            {level && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Nivel académico</dt>
                <dd className="mt-0.5 text-sm text-zinc-900 capitalize">{level}</dd>
              </div>
            )}
          </dl>
        ) : (
          <>
            <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Completá tu perfil para continuar.
            </p>
            <ProfileForm
              initialName={fullName}
              initialInstitution={institution}
              initialLevel={level}
            />
          </>
        )}
      </div>

      {/* Módulos M1-M8 */}
      {profileComplete && (
        <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-5 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-zinc-900">Mis trabajos</h2>
          <p className="text-sm text-zinc-500">
            Aquí verás el estado de tus trabajos académicos y podrás subir nuevos documentos.
          </p>
          <div className="mt-4 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center">
            <p className="text-sm text-zinc-400">Módulo de trabajos — próximamente</p>
          </div>
        </div>
      )}

    </div>
  )
}
