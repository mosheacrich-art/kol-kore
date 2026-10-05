// Parashapp mark: the official logo (public/logo.png).
export function LogoMark({ size = 32, tile = false }) {
  const img = <img src="/logo.png" alt="Parashapp" width={size} height={size} style={{ width: size, height: size, objectFit: 'contain', display: 'block' }} />
  if (!tile) return img
  return <span style={{ background: '#fff', padding: size * 0.12, borderRadius: 4, display: 'inline-flex' }}>{img}</span>
}

export default function Logo({ size = 28, color = '#1b2f6b', word = true }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} tile={color === '#fff'} />
      {word && (
        <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600, fontSize: size * 0.7, letterSpacing: '-0.01em', color }}>
          Parashapp
        </span>
      )}
    </span>
  )
}
