import { useEffect, useRef, useState } from 'react'

// Zielbalken: Ein Marker saust hin und her – möglichst mittig stoppen.
// 3 Versuche, gewertet wird die Summe der Abweichungen (kleiner = besser).
//
// Wichtig: Die Position ist eine reine Funktion der verstrichenen Zeit.
// Gewertet wird beim Tap direkt aus der Uhr – nicht aus dem gerenderten State.
// Sonst bekäme jemand, dessen Handy gerade drosselt (Energiesparmodus,
// App im Hintergrund), automatisch die schlechteste Wertung.
const ROUNDS = 3
const SPEED = 0.9 // Durchläufe pro Sekunde

const posAt = (elapsedMs) => {
  const cycle = ((elapsedMs / 1000) * SPEED) % 2
  return (cycle <= 1 ? cycle : 2 - cycle) * 100
}

export default function AimDuel({ onFinish }) {
  const [phase, setPhase] = useState('intro') // intro | live | between | done
  const [pos, setPos] = useState(0)
  const [round, setRound] = useState(0)
  const [misses, setMisses] = useState([])
  const startRef = useRef(0)
  const stoppedRef = useRef(false)

  useEffect(() => {
    if (phase !== 'live') return
    stoppedRef.current = false
    startRef.current = performance.now()

    let raf = 0
    const paint = () => {
      setPos(posAt(performance.now() - startRef.current))
      raf = requestAnimationFrame(paint)
    }
    raf = requestAnimationFrame(paint)
    // Sicherheitsnetz: läuft auch dort, wo requestAnimationFrame gedrosselt wird
    const iv = setInterval(() => setPos(posAt(performance.now() - startRef.current)), 40)

    return () => { cancelAnimationFrame(raf); clearInterval(iv) }
  }, [phase, round])

  const stop = () => {
    if (phase !== 'live' || stoppedRef.current) return
    stoppedRef.current = true
    const exact = posAt(performance.now() - startRef.current)
    const miss = Math.round(Math.abs(exact - 50) * 10) / 10
    const next = [...misses, miss]
    setMisses(next)
    setPos(exact)
    if (next.length >= ROUNDS) {
      const total = Math.round(next.reduce((s, x) => s + x, 0) * 10) / 10
      setPhase('done')
      onFinish({ value: String(total) })
    } else {
      setRound(next.length)
      setPhase('between')
    }
  }

  const total = Math.round(misses.reduce((s, x) => s + x, 0) * 10) / 10

  return (
    <div className="card p-4 text-center space-y-3">
      <div className="flex justify-center gap-1">
        {Array.from({ length: ROUNDS }, (_, i) => (
          <span key={i} className={`chip ${
            misses[i] != null ? 'bg-mint/20 text-mint' : i === round ? 'bg-brand/20 text-brand' : 'bg-panel2 text-white/30'
          }`}>
            V{i + 1}{misses[i] != null ? ` · ${misses[i]}` : ''}
          </span>
        ))}
      </div>

      {phase === 'intro' && (
        <>
          <p className="text-white/70 text-sm">
            Der Marker saust hin und her – stoppe ihn <b>genau in der Mitte</b>.
            3 Versuche, die Abweichungen werden addiert. Wer näher dran ist, gewinnt. 🎚️
          </p>
          <button className="btn-primary w-full text-lg" onClick={() => setPhase('live')}>Versuch 1</button>
        </>
      )}

      {(phase === 'live' || phase === 'between') && (
        <>
          <div className="relative h-16 bg-panel2 rounded-xl overflow-hidden">
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-12 bg-mint/10" />
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-mint" />
            <div className="absolute inset-y-1 w-2 bg-brand rounded-full"
                 style={{ left: `calc(${pos}% - 4px)` }} />
          </div>
          {phase === 'live' ? (
            <button className="btn-primary w-full h-20 text-2xl font-display" onClick={stop}>STOPP</button>
          ) : (
            <button className="btn-primary w-full text-lg" onClick={() => setPhase('live')}>
              Versuch {round + 1}
            </button>
          )}
        </>
      )}

      {phase === 'done' && (
        <p className="text-mint font-semibold text-lg">
          Gesamt-Abweichung {total} – abgegeben ✓<br />
          <span className="text-white/50 text-sm font-normal">Warte auf deinen Gegner…</span>
        </p>
      )}
    </div>
  )
}
