import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileForm from '@/components/student/ProfileForm'
import WorksSection from '@/components/student/WorksSection'
import type { AcademicWork } from '@/types'

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) redirect('/login')

  const { data: student } = await supabase
    .from('students')
    .select('full_name, email, country, id_number, phone, institution, career, academic_level, role')
    .eq('id', user.id)
    .single()

  const { data: works } = await supabase
    .from('academic_works')
    .select('id, title, work_type, academic_level, status, created_at')
    .order('created_at', { ascending: false })

  const fullName    = student?.full_name?.trim() || ''
  const email       = student?.email || user.email || ''
  const country     = student?.country?.trim() || ''
  const idNumber    = student?.id_number?.trim() || ''
  const phone       = student?.phone?.trim() || ''
  const institution = student?.institution?.trim() || ''
  const career      = student?.career?.trim() || ''
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
          <dl className="grid grid-cols-1 gap-y-4 gap-x-8 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Nombre</dt>
              <dd className="mt-0.5 text-sm text-zinc-900">{fullName}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Correo</dt>
              <dd className="mt-0.5 text-sm text-zinc-900">{email}</dd>
            </div>
            {country && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">País</dt>
                <dd className="mt-0.5 text-sm text-zinc-900">{country}</dd>
              </div>
            )}
            {idNumber && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Documento de identidad</dt>
                <dd className="mt-0.5 text-sm text-zinc-900">{idNumber}</dd>
              </div>
            )}
            {phone && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Teléfono</dt>
                <dd className="mt-0.5 text-sm text-zinc-900">{phone}</dd>
              </div>
            )}
            {institution && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Universidad / Institución</dt>
                <dd className="mt-0.5 text-sm text-zinc-900">{institution}</dd>
              </div>
            )}
            {career && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Carrera</dt>
                <dd className="mt-0.5 text-sm text-zinc-900">{career}</dd>
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
              initialCountry={country}
              initialIdNumber={idNumber}
              initialPhone={phone}
              initialInstitution={institution}
              initialCareer={career}
              initialLevel={level}
            />
          </>
        )}
      </div>

      {/* Mis trabajos */}
      {profileComplete && (
        <WorksSection
          works={(works ?? []) as AcademicWork[]}
          userId={user.id}
        />
      )}

    </div>
  )
}
