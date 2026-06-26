import type { AcademicWork } from '@/types'

const STATUS_LABEL: Record<string, string> = {
  pendiente_pago: 'Pendiente de pago',
  'en_auditoría': 'En auditoría',
  entregado:      'Entregado',
  archivado:      'Archivado',
}

const STATUS_COLOR: Record<string, string> = {
  pendiente_pago: 'bg-amber-50 text-amber-700 ring-amber-200',
  'en_auditoría': 'bg-blue-50 text-blue-700 ring-blue-200',
  entregado:      'bg-green-50 text-green-700 ring-green-200',
  archivado:      'bg-zinc-100 text-zinc-500 ring-zinc-200',
}

interface Props {
  works: AcademicWork[]
}

export default function WorksTable({ works }: Props) {
  if (works.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
        <p className="text-sm text-zinc-500">
          Todavía no tenés trabajos registrados.
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          Cuando subas tu primer documento aparecerá aquí.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              Título
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 sm:table-cell">
              Tipo
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 md:table-cell">
              Nivel
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              Estado
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              Fecha
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {works.map((work) => (
            <tr key={work.id} className="hover:bg-zinc-50 transition">
              <td className="px-4 py-3 font-medium text-zinc-900">{work.title}</td>
              <td className="hidden px-4 py-3 capitalize text-zinc-600 sm:table-cell">
                {work.work_type}
              </td>
              <td className="hidden px-4 py-3 capitalize text-zinc-600 md:table-cell">
                {work.academic_level}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_COLOR[work.status] ?? 'bg-zinc-100 text-zinc-600 ring-zinc-200'}`}
                >
                  {STATUS_LABEL[work.status] ?? work.status}
                </span>
              </td>
              <td className="px-4 py-3 text-zinc-500">
                {new Date(work.created_at).toLocaleDateString('es-PY', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
