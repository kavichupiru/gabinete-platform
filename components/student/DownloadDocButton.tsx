'use client'

import { useState } from 'react'
import { getSignedDocUrl } from '@/app/dashboard/student/actions'

export default function DownloadDocButton({ workId }: { workId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    const url = await getSignedDocUrl(workId)
    setLoading(false)
    if (url) window.open(url, '_blank')
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-lg border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition"
    >
      {loading ? 'Preparando...' : 'Descargar informe'}
    </button>
  )
}
