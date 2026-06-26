// Layout compartido para /login y /register
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Gabinete de Estudios
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Asesoría metodológica FCM-UNA / FENOB-UNA
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
