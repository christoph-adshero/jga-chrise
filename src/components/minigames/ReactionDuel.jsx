import { useEffect, useRef, useState } from 'react'

// Reaktions-Duell: 3 Runden, Screen wird nach zufälliger Zeit grün.
// Reaktionszeit wird KOMPLETT LOKAL gemessen (kein Clock-Skew, kein Netz-Race).
// Zu früh getippt = 1500ms Strafzeit für die Runde.
const ROUNDS = 3
const PENALTY = 1500

export default function ReactionDuel({ onFinish }) {
  const [round, setRound] = useState(0)
  const [phase, setPhase] = useState('intro') // intro | wait | go | tooearly | between | done
  const [times, setTimes] = useState([])
  const goAtRef = useRef(0)
  const timerRef = useRef(null)
  const tappedRef = useRef(false) // verhindert Doppel-Tap-Wertung in derselben Runde

  const startRound = () => {
    tappedRef.current = false
    setPhase('wait')
    const delay = 1500 + Math.random() * 2500
    timerRef.current = setTimeout(() => {
      goAtRef.current = performance.now()
      setPhase('go')
    }, delay)
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const record = (ms) => {
    const next = [...times, ms]
    setTimes(next)
    if (next.length >= ROUNDS) {
      setPhase('done')
      const avg = Math.round(next.reduce((s, x) => s + x, 0) / next.length)
      onFinish({ responseMs: avg, value: String(avg) })
    } else {
      setRound(next.length)
      setPhase('between')
    }
  }

  const tap = () => {
    if (tappedRef.current) return
    if (phase === 'wait') { // zu früh!
      tappedRef.current = true
      clearTimeout(timerRef.current)
      setPhase('tooearly')
      setTimeout(() => record(PENALTY), 900)
    } else if (phase === 'go') {
      tappedRef.current = true
      record(Math.round(performance.now() - goAtRef.current))
    }
  }

  const bg = phase === 'go' ? 'bg-mint' : phase === 'tooearly' ? 'bg-brand animate-shake' : 'bg-panel2'

  return (
    <div className="card p-4 text-center space-y-3">
      <div className="flex justify-center gap-1">
        {Array.from({ length: ROUNDS }, (_, i) => (
          <span key={i} className={`chip ${times[i] != null ? 'bg-mint/20 text-mint' : i === round ? 'bg-brand/20 text-brand' : 'bg-panel2 text-white/30'}`}>
            R{i + 1}{times[i] != null ? ` · ${times[i]}ms` : ''}
          </span>
        ))}
      </div>

      {phase === 'intro' && (
        <>
          <p className="text-white/70 text-sm">Tippe, sobald das Feld <b className="text-mint">GRÜN</b> wird. Zu früh = {PENALTY}ms Strafe. 3 Runden, Durchschnitt zählt.</p>
          <button className="btn-primary w-full text-lg" onClick={startRound}>Runde 1 starten ⚡</button>
        </>
      )}

      {(phase === 'wait' || phase === 'go' || phase === 'tooearly') && (
        <button onClick={tap}
          className={`w-full h-56 rounded-2xl grid place-items-center text-2xl font-display transition-colors ${bg}`}>
          {phase === 'wait' && <span className="text-white/50">Warte auf GRÜN…</span>}
          {phase === 'go' && <span className="text-ink">JETZT TIPPEN!</span>}
          {phase === 'tooearly' && <span className="text-white">ZU FRÜH! 🫣 +{PENALTY}ms</span>}
        </button>
      )}

      {phase === 'between' && (
        <button className="btn-primary w-full text-lg" onClick={startRound}>Runde {round + 1} starten ⚡</button>
      )}

      {phase === 'done' && (
        <p className="text-mint font-semibold text-lg">
          Ø {Math.round(times.reduce((s, x) => s + x, 0) / times.length)} ms – abgegeben ✓<br />
          <span className="text-white/50 text-sm font-normal">Warte auf deinen Gegner…</span>
        </p>
      )}
    </div>
  )
}
