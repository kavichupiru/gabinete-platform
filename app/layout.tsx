import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'Gabinete de Estudios',
  description: 'Auditoría y producción científica para investigadores.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-zinc-50 text-zinc-900">
        <div className="flex-1">{children}</div>
        <footer className="border-t border-zinc-200 bg-white py-4 text-center text-xs text-zinc-400">
          © 2026 TAS Group py
        </footer>
      </body>
    </html>
  )
}
