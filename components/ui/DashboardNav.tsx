'use client'

import Link from 'next/link'
import { signOut } from '@/app/(auth)/actions'
import BrandLogo from '@/components/ui/BrandLogo'
import type { UserRole } from '@/types'

interface Props {
  fullName: string
  role: UserRole
}

export default function DashboardNav({ fullName, role }: Props) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard/student">
            <BrandLogo variant="compact" />
          </Link>
          {(role === 'supervisor' || role === 'admin') && (
            <Link
              href="/dashboard/supervisor"
              className="text-sm text-zinc-500 hover:text-zinc-900"
            >
              Panel supervisor
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-zinc-500 sm:block">{fullName}</span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 transition"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
