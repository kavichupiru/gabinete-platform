// PNG: 2048×2048. Logo en x:456–1575, y:905–1155 (1119×250px).
// Tailwind aplica max-width:100% a img — se anula con maxWidth:'none'.
// Escala 0.30 → canvas 614px. Logo: 336×75px en x:137, y:272.

interface Props {
  variant?: 'full' | 'compact'
}

const imgBase: React.CSSProperties = {
  position: 'absolute',
  maxWidth: 'none', // anula el max-width:100% de Tailwind
}

export default function BrandLogo({ variant = 'full' }: Props) {
  if (variant === 'compact') {
    // Escala 0.16 → canvas 328px. Logo: 179×40px en x:73, y:145
    return (
      <div
        className="bg-white"
        style={{ position: 'relative', width: 195, height: 52, overflow: 'hidden' }}
      >
        <img
          src="/Logo_TAS_Group.png"
          alt="TAS Group.py — Gabinete de Estudios"
          style={{ ...imgBase, width: 328, height: 328, left: -65, top: -139 }}
        />
      </div>
    )
  }

  // Contenedor: 356×91px con 10px padding h, 8px padding v
  return (
    <div
      className="bg-white"
      style={{ position: 'relative', width: 356, height: 91, overflow: 'hidden' }}
    >
      <img
        src="/Logo_TAS_Group.png"
        alt="TAS Group.py — Gabinete de Estudios"
        style={{ ...imgBase, width: 614, height: 614, left: -127, top: -264 }}
      />
    </div>
  )
}
