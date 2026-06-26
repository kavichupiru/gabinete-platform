'use client'

import { useFormStatus } from 'react-dom'

interface Props {
  label: string
  loadingLabel?: string
}

export default function SubmitButton({ label, loadingLabel = 'Procesando...' }: Props) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? loadingLabel : label}
    </button>
  )
}
