import type { Student } from '@/types'

const NIVEL_LABEL: Record<string, string> = {
  grado:           'Licenciatura / Grado',
  'especialización': 'Especialización',
  'maestría':      'Maestría',
  doctorado:       'Doctorado',
}

interface Props {
  student: Pick<Student, 'full_name' | 'email' | 'institution' | 'academic_level'>
}

export default function ProfileCard({ student }: Props) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-zinc-900">Mi perfil</h2>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Nombre</dt>
          <dd className="mt-0.5 text-sm text-zinc-900">{student.full_name}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Correo</dt>
          <dd className="mt-0.5 text-sm text-zinc-900">{student.email}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Institución</dt>
          <dd className="mt-0.5 text-sm text-zinc-900">{student.institution}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Nivel académico</dt>
          <dd className="mt-0.5 text-sm text-zinc-900">
            {NIVEL_LABEL[student.academic_level] ?? student.academic_level}
          </dd>
        </div>
      </dl>
    </div>
  )
}
