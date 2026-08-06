import { useEffect, useRef, useState } from 'react'
import { memoryDigitsFor } from '../../lib/duelLogic'

// Zahlen-Memory: Zahlenfolge blitzt auf (gleiche Folge via Seed), nachtippen.
// Jedes Level +1 Ziffer. Fehler = Ende. Erreichtes Level zählt.
export default function MemoryDuel({ duelId, onFinish }) {
  const [level, setLevel] = useState(0) // 0 = intro
  const [phase, setPhase] = useState('intro') // intro | show | input | done
  const [input, setInput] = useState('')
  const [digits, setDigits] = useState('')
  const doneRef = useRef(false)

  const startLevel = (lvl) => {
    const d = memoryDigitsFor(duelId, lvl)
    setDigits(d)
    setInput('')
    setLevel(lvl)
    setPhase('show')
    setTimeout(() => setPhase('input'), 1000 + d.length * 320)
  }

  const finish = (reachedLevel) => {
    if (doneRef.current) return
    doneRef.current = true
    setPhase('done')
    onFinish({ value: String(reachedLevel) })
  }

  useEffect(() => {
    if (phase !== 'input') return
    if (input.length !== digits.length) return
    if (input === digits) {
      setTimeout(() => startLevel(level + 1), 500)
    } else {
      finish(level - 1) // letztes geschafftes Level
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, phase])

  const press = (n) => {
    if (phase !== 'input') return
    setInput((s) => s + n)
  }

  return (
    <div className="card p-4 text-center space-y-3">
      {phase === 'intro' && (
        <>
          <p className="text-white/70 text-sm">Merk dir die Zahlenfolge und tippe sie nach. Jedes Level wird länger. 🔢</p>
          <button className="btn-primary w-full text-lg" onClick={() => startLevel(1)}>Level 1 starten</button>
        </>
      )}

      {phase === 'show' && (
        <div className="h-40 grid place-items-center">
          <div>
            <div className="text-white/40 text-xs mb-2">LEVEL {level} – MERKEN!</div>
            <div className="font-display text-5xl tracking-[0.3em] text-gold animate-pop">{digits}</div>
          </div>
        </div>
      )}

      {phase === 'input' && (
        <>
          <div className="text-white/40 text-xs">LEVEL {level} – NACHTIPPEN</div>
          <div className="font-display text-4xl tracking-[0.3em] h-12">{input || '···'}</div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => (
              <button key={n} onClick={() => press(String(n))}
                className={`btn-ghost text-xl font-display ${n === 0 ? 'col-start-2' : ''}`}>{n}</button>
            ))}
          </div>
        </>
      )}

      {phase === 'done' && (
        <p className="text-mint font-semibold text-lg">
          Level {Math.max(0, level - 1)} erreicht – abgegeben ✓<br />
          <span className="text-white/50 text-sm font-normal">Warte auf deinen Gegner…</span>
        </p>
      )}
    </div>
  )
}
