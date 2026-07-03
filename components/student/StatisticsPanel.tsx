'use client'

import { useEffect, useState, useTransition } from 'react'
import { analyzeDataset, getStatAnalyses, type StatAnalysis } from '@/app/dashboard/student/stats-actions'

interface Props {
  workId: string
  onClose: () => void
}

export default function StatisticsPanel({ workId, onClose }: Props) {
  const [analyses, setAnalyses] = useState<StatAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    getStatAnalyses(workId).then(a => {
      setAnalyses(a)
      setLoading(false)
    })
  }, [workId])

  function handleSubmit() {
    if (!file) return
    setError(null)
    const formData = new FormData()
    formData.append('file', file)

    startTransition(async () => {
      const res = await analyzeDataset(workId, formData)
      if (res.status === 'error') {
        setError(res.message)
        return
      }
      setFile(null)
      const updated = await getStatAnalyses(workId)
      setAnalyses(updated)
    })
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-zinc-900">Análisis estadístico</h3>
        <button onClick={onClose} className="text-xs text-zinc-400 hover:text-zinc-700">
          Cerrar
        </button>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            disabled={isPending}
            className="flex-1 text-xs text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-xs file:font-medium file:text-zinc-700"
          />
          <button
            onClick={handleSubmit}
            disabled={isPending || !file}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition"
          >
            {isPending ? 'Analizando...' : 'Analizar'}
          </button>
        </div>
        <p className="text-xs text-zinc-400">Aceptamos archivos .csv, .xlsx o .xls de hasta 10 MB.</p>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

        {loading ? (
          <p className="text-sm text-zinc-400">Cargando análisis previos...</p>
        ) : analyses.length === 0 ? (
          <p className="text-sm text-zinc-400">Todavía no subiste ningún dataset para este trabajo.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {analyses.map(a => (
              <div key={a.id} className="rounded-xl bg-zinc-50 px-4 py-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-900">{a.file_name}</p>
                  <p className="text-xs text-zinc-400">
                    {new Date(a.created_at).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                <p className="mb-3 text-xs text-zinc-500">
                  {a.summary_json.rowCount} filas · {a.summary_json.columns.length} columnas
                </p>

                <div className="mb-3 grid gap-2 sm:grid-cols-2">
                  {a.summary_json.columns.map(c => (
                    <div key={c.name} className="rounded-lg bg-white px-3 py-2">
                      <p className="text-xs font-semibold text-zinc-900">{c.name}</p>
                      {c.type === 'numeric' ? (
                        <p className="text-[11px] text-zinc-500">
                          media {c.mean} · mediana {c.median} · desvío {c.stdDev} · rango [{c.min}, {c.max}]
                        </p>
                      ) : (
                        <p className="text-[11px] text-zinc-500">
                          {Object.entries(c.frequencies ?? {}).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {a.interpretation && (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-700">{a.interpretation}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
