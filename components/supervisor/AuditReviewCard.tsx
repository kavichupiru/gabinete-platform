'use client'

import { useState, useTransition } from 'react'
import { approveWork, rejectWork } from '@/app/dashboard/supervisor/actions'

interface Auditoria {
  id: string
  resumen_ejecutivo: string | null
  tabla_confianza: Record<string, number> | null
  fallas_criticas: { errores?: string[] } | null
  fallas_menores: unknown
  fortalezas: unknown
  recomendaciones: unknown
  ciclo_n: number
  created_at: string
}

interface Work {
  id: string
  title: string
  work_type: string
  academic_level: string
  career: string | null
  status: string
  created_at: string
  students: { full_name: string; email: string } | null
  auditorias: Auditoria[]
}

export default function AuditReviewCard({ work }: { work: Work }) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const auditoria = work.auditorias?.[0]

  function handleApprove() {
    startTransition(async () => {
      const res = await approveWork(work.id)
      setMessage(res.status === 'error' ? res.message : 'Trabajo aprobado y entregado.')
    })
  }

  function handleReject() {
    startTransition(async () => {
      const res = await rejectWork(work.id)
      setMessage(res.status === 'error' ? res.message : 'Trabajo devuelto al estudiante.')
    })
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-zinc-900">{work.title}</h3>
          <p className="mt-0.5 text-sm text-zinc-500">
            {work.students?.full_name} · {work.students?.email}
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">
            {work.work_type} · {work.academic_level} · {work.career ?? 'sin carrera'}
          </p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
          En auditoría
        </span>
      </div>

      {auditoria ? (
        <div className="mb-4 rounded-xl bg-zinc-50 px-4 py-4">
          <p className="mb-3 text-sm leading-relaxed text-zinc-700">
            {auditoria.resumen_ejecutivo}
          </p>

          {auditoria.tabla_confianza && (
            <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Object.entries(auditoria.tabla_confianza).map(([key, value]) => (
                <div key={key} className="rounded-lg bg-white px-3 py-2 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm font-semibold text-zinc-900">{value}</p>
                </div>
              ))}
            </div>
          )}

          {auditoria.fallas_criticas?.errores && auditoria.fallas_criticas.errores.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-red-500">
                Fallas críticas
              </p>
              <ul className="space-y-1">
                {auditoria.fallas_criticas.errores.map((e, i) => (
                  <li key={i} className="text-xs text-zinc-600">{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p className="mb-4 text-sm text-zinc-400">Aún no hay diagnóstico de auditoría.</p>
      )}

      {message && (
        <p className="mb-3 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-600">{message}</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleApprove}
          disabled={isPending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition"
        >
          Aprobar y entregar
        </button>
        <button
          onClick={handleReject}
          disabled={isPending}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition"
        >
          Devolver al estudiante
        </button>
      </div>
    </div>
  )
}
