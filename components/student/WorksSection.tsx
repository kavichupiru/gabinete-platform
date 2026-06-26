'use client'

import { useState } from 'react'
import WorksTable from './WorksTable'
import UploadWorkForm from './UploadWorkForm'
import type { AcademicWork } from '@/types'

interface Props {
  works: AcademicWork[]
  userId: string
}

export default function WorksSection({ works, userId }: Props) {
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900">Mis trabajos</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition"
          >
            + Subir trabajo
          </button>
        )}
      </div>

      {showForm && (
        <UploadWorkForm
          userId={userId}
          onCancel={() => setShowForm(false)}
        />
      )}

      <WorksTable works={works} />
    </div>
  )
}
