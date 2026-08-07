import { useState } from 'react'
import { photosFor } from '../../lib/duelLogic'
import { PHOTO_YEAR_RANGE } from '../../lib/gameData'

// „Damals & Heute": drei alte Fotos vom Bräutigam, Jahr per Regler schätzen.
// Beide Handys sehen dieselben Fotos (Seed aus der duelId).
export default function PhotoYearDuel({ duelId, onFinish }) {
  const photos = photosFor(duelId)
  const mid = Math.round((PHOTO_YEAR_RANGE.from + PHOTO_YEAR_RANGE.to) / 2)
  const [idx, setIdx] = useState(0)
  const [year, setYear] = useState(mid)
  const [guesses, setGuesses] = useState([])

  const confirm = () => {
    const next = [...guesses, year]
    if (next.length >= photos.length) {
      onFinish({ value: JSON.stringify(next) })
    }
    setGuesses(next)
    setYear(mid)
    setIdx((i) => i + 1)
  }

  if (idx >= photos.length) {
    return (
      <div className="card p-4 text-center">
        <p className="text-mint font-semibold text-lg">Abgegeben ✓<br />
          <span className="text-white/50 text-sm font-normal">Warte auf deinen Gegner…</span></p>
      </div>
    )
  }

  const p = photos[idx]
  return (
    <div className="card p-4 space-y-3">
      <div className="flex justify-between text-sm text-white/60">
        <span>Foto {idx + 1}/{photos.length}</span>
        <span className="text-white/35">Welches Jahr?</span>
      </div>

      <img src={p.url} alt={`Foto ${idx + 1}`}
           className="w-full max-h-72 object-contain rounded-xl bg-panel2" />

      <div className="text-center">
        <div className="font-display text-5xl text-gold">{year}</div>
      </div>

      <input type="range" min={PHOTO_YEAR_RANGE.from} max={PHOTO_YEAR_RANGE.to} step={1}
             value={year} onChange={(e) => setYear(Number(e.target.value))}
             className="w-full accent-brand" />
      <div className="flex justify-between text-white/30 text-xs">
        <span>{PHOTO_YEAR_RANGE.from}</span><span>{PHOTO_YEAR_RANGE.to}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button className="btn-ghost" onClick={() => setYear((y) => Math.max(PHOTO_YEAR_RANGE.from, y - 1))}>− 1 Jahr</button>
        <button className="btn-ghost" onClick={() => setYear((y) => Math.min(PHOTO_YEAR_RANGE.to, y + 1))}>+ 1 Jahr</button>
      </div>

      <button className="btn-primary w-full text-lg" onClick={confirm}>
        {idx + 1 === photos.length ? 'Abgeben' : 'Weiter →'}
      </button>
    </div>
  )
}
