import { avatarLayers, DEFAULT_AVATAR } from '../lib/avatars'

// Rendert einen Spieler-Avatar.
// Bevorzugt: avatar.imageUrl (Mario-Kart-Style Cartoon-Figur aus echtem Foto,
// generiert via Higgsfield – siehe avatars/README.md). Fallback: lokales SVG.
// wins/losses erzeugen sichtbare Konsequenzen (Tränen / Lorbeer bzw. Badges).
export default function Avatar({ avatar = DEFAULT_AVATAR, crown = false, wins = 0, losses = 0, size = 56, className = '' }) {
  const base = `rounded-full overflow-hidden bg-panel2 border border-line shrink-0 ${className}`

  // Foto-/Cartoon-Avatar
  if (avatar?.imageUrl) {
    return (
      <div className={`relative ${className}`} style={{ width: size, height: size }}>
        <div className={base} style={{ width: size, height: size }}>
          {/* kein loading="lazy": Avatare sind klein und immer sichtbar –
              Lazy-Loading verzögert sie nur unnötig */}
          <img src={avatar.imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
        {crown && (
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 leading-none"
                style={{ fontSize: size * 0.38 }}>👑</span>
        )}
        {wins >= 2 && (
          <span className="absolute -bottom-1 -left-1 leading-none" style={{ fontSize: size * 0.3 }}>🏆</span>
        )}
        {losses >= 1 && (
          <span className="absolute -bottom-1 -right-1 leading-none" style={{ fontSize: size * 0.3 }}>
            {'💧'.repeat(Math.min(losses, 2))}
          </span>
        )}
      </div>
    )
  }

  // SVG-Fallback
  let extras = ''
  const tears = Math.min(losses, 3)
  for (let i = 0; i < tears; i++) {
    const x = 36 + i * 3
    const y = 50 + i * 4
    extras += `<path d="M${x} ${y} q-2.5 4 0 6 q2.5 -2 0 -6" fill="#38bdf8"/>`
  }
  if (wins >= 2) {
    extras += `<path d="M24 52 Q18 38 28 24 M76 52 Q82 38 72 24" fill="none" stroke="#34d399" stroke-width="3" stroke-linecap="round"/>`
  }

  const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${avatarLayers(avatar, { crown })}${extras}</svg>`
  return (
    <div className={base} style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: svg }} />
  )
}
