import { useState } from 'react'
import Avatar from './Avatar.jsx'
import {
  SKIN_TONES, HAIR_COLORS, SHIRT_COLORS, HAIR_STYLES, BEARDS, EXTRAS,
  DEFAULT_AVATAR, randomAvatar, CREW_ORDER, CREW_LABELS, avatarUrl
} from '../lib/avatars'
import { updatePlayer } from '../lib/api'

const FIELDS = [
  { key: 'skin',      label: 'Haut',   len: SKIN_TONES.length },
  { key: 'hair',      label: 'Frisur', len: HAIR_STYLES.length, names: HAIR_STYLES },
  { key: 'hairColor', label: 'Farbe',  len: HAIR_COLORS.length },
  { key: 'beard',     label: 'Bart',   len: BEARDS.length, names: BEARDS },
  { key: 'extra',     label: 'Extra',  len: EXTRAS.length, names: EXTRAS },
  { key: 'shirt',     label: 'Shirt',  len: SHIRT_COLORS.length }
]

export default function AvatarEditor({ player, onClose }) {
  const [a, setA] = useState({ ...DEFAULT_AVATAR, ...(player.avatar || {}) })
  const [saving, setSaving] = useState(false)

  const cycle = (key, len, dir) =>
    setA((prev) => ({ ...prev, [key]: ((prev[key] ?? 0) + dir + len) % len }))

  const save = async () => {
    setSaving(true)
    await updatePlayer(player.id, { avatar: a })
    setSaving(false)
    onClose && onClose()
  }

  return (
    <div className="card p-4 space-y-3 animate-pop">
      <div className="flex items-center justify-between">
        <h3 className="h-display text-xl">Dein Avatar</h3>
        <button className="chip bg-panel2 border border-line" onClick={() => setA(randomAvatar())}>🎲 Zufall</button>
      </div>

      <div className="flex justify-center">
        <Avatar avatar={a} crown={player.is_groom} size={120} />
      </div>

      {/* Figuren-Auswahl: jeder kann seine Spielfigur selbst antippen */}
      <div>
        <p className="text-xs text-white/50 mb-1.5">Wähle deine Spielfigur:</p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {CREW_ORDER.map((file) => {
            const url = avatarUrl(file)
            const active = a.imageUrl === url
            return (
              <button key={file} onClick={() => setA((prev) => ({ ...prev, imageUrl: url }))}
                className={`shrink-0 text-center rounded-xl p-1 border transition ${
                  active ? 'border-brand bg-brand/15' : 'border-line bg-panel2'
                }`}>
                <img src={url} alt={CREW_LABELS[file]} className="w-14 h-14 rounded-lg object-cover" />
                <div className={`text-[10px] mt-0.5 ${active ? 'text-brand font-bold' : 'text-white/50'}`}>
                  {CREW_LABELS[file]}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <details open={!a.imageUrl}>
        <summary className="text-white/50 text-xs cursor-pointer select-none">
          {a.imageUrl ? 'Lieber selbst einen Avatar bauen?' : 'Oder bau dich selbst 👇'}
        </summary>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {FIELDS.map((f) => (
            <div key={f.key} className="flex items-center justify-between bg-panel2 rounded-xl px-2 py-1.5">
              <button className="w-8 h-8 grid place-items-center text-white/60" onClick={() => cycle(f.key, f.len, -1)}>◀</button>
              <div className="text-center">
                <div className="text-[10px] uppercase text-white/40">{f.label}</div>
                <div className="text-sm font-semibold">
                  {f.names ? f.names[a[f.key] ?? 0]?.label : (a[f.key] ?? 0) + 1}
                </div>
              </div>
              <button className="w-8 h-8 grid place-items-center text-white/60" onClick={() => cycle(f.key, f.len, 1)}>▶</button>
            </div>
          ))}
        </div>
        <button className="btn-ghost w-full mt-2 text-sm"
          onClick={() => setA((prev) => ({ ...prev, imageUrl: undefined }))}>
          Selbstgebauten Avatar verwenden
        </button>
      </details>

      <button className="btn-primary w-full" disabled={saving} onClick={save}>
        {saving ? '…' : 'Avatar speichern ✓'}
      </button>
    </div>
  )
}
