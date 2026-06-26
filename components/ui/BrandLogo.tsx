interface Props {
  variant?: 'full' | 'compact'
}

// Isotipo placeholder — reemplazar por PNG final cuando esté disponible
function Isotipo({ size }: { size: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 font-bold text-white shadow-sm select-none"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      GE
    </div>
  )
}

export default function BrandLogo({ variant = 'full' }: Props) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2.5">
        <Isotipo size={32} />
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            TAS Group.py
          </span>
          <span className="text-sm font-bold text-zinc-900">
            Gabinete de Estudios
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Isotipo size={64} />
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          TAS Group.py
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Gabinete de Estudios
        </h1>
        <p className="text-sm font-normal text-zinc-500">
          Auditoría y producción científica para investigadores.
        </p>
      </div>
    </div>
  )
}
