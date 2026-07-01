import { getWorksInAuditoria } from './actions'
import AuditReviewCard from '@/components/supervisor/AuditReviewCard'

export default async function SupervisorDashboardPage() {
  const works = await getWorksInAuditoria()

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-5 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">Panel del supervisor</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Trabajos en auditoría pendientes de revisión: {works.length}
        </p>
      </div>

      {works.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-10 text-center shadow-sm">
          <p className="text-sm text-zinc-400">No hay trabajos en auditoría por el momento.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {works.map(work => (
            <AuditReviewCard key={work.id} work={work as any} />
          ))}
        </div>
      )}
    </div>
  )
}
