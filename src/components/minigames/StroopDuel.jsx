import { useEffect, useRef, useState } from 'react'
import { STROOP_COLORS } from '../../lib/gameData'
import { stroopSequenceFor } from '../../lib/duelLogic'

// Farben-Falle: Tippe die SCHRIFTFARBE, nicht das gelesene Wort.
// Richtig +1, falsch −1 (nie unter 0). Gewertet wird der Punktestand.
export default function StroopDuel({ duelId, seconds = 30, onFinish }) {
  const seq = useRef(stroopSequenceFor(duelId)).current
  const [phase, setPhase] = useState('intro') // intro | live | done
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [left, setLeft] = useState(seconds)
  const [flash, setFlash] = useState(null)
  const scoreRef = useRef(0)
  const endRef = useRef(0)
  const doneRef = useRef(false)

  useEffect(() => {
    if (phase !== 'live') return
    const iv = setInterval(() => {
      const rem = Math.max(0, (endRef.current - performance.now()) / 1000)
      setLeft(rem)
      if (rem <= 0 && !doneRef.current) {
        doneRef.current = true
        clearInterval(iv)
        setPhase('done')
        onFinish({ value: String(scoreRef.current) })
      }
    }, 80)
    return () => clearInterval(iv)
  }, [phase, onFinish])

  const start = () => {
    endRef.current = performance.now() + seconds * 1000
    setPhase('live')
  }

  const pick = (colorIndex) => {
    if (phase !== 'live') return
    const correct = colorIndex === seq[idx % seq.length].ink
    scoreRef.current = Math.max(0, scoreRef.current + (correct ? 1 : -1))
    setScore(scoreRef.current)
    setFlash(correct ? 'ok' : 'bad')
    setTimeout(() => setFlash(null), 180)
    setIdx((i) => i + 1)
  }

  if (phase === 'intro') {
    return (
      <div className="card p-4 text-center space-y-3">
        <p className="text-white/70 text-sm">
          Gleich erscheinen Farbwörter in <b>falscher</b> Schriftfarbe.
          Tippe immer die <b className="text-gold">Schriftfarbe</b> – nicht das Wort!
          {' '}{seconds} Sekunden, jeder Fehler zieht einen Punkt ab. 🎨
        </p>
        <button className="btn-primary w-full text-lg" onClick={start}>Start</button>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="card p-4 text-center">
        <p className="text-mint font-semibold text-lg">{score} Treffer – abgegeben ✓<br />
          <span className="text-white/50 text-sm font-normal">Warte auf deinen Gegner…</span></p>
      </div>
    )
  }

  const cur = seq[idx % seq.length]
  return (
    <div className={`card p-4 text-center space-y-3 ${flash === 'bad' ? 'animate-shake' : ''}`}>
      <div className="flex justify-between text-sm text-white/60">
        <span className={left <= 5 ? 'text-brand font-bold' : ''}>⏱ {Math.ceil(left)}s</span>
        <span className="text-gold font-display text-xl">{score}</span>
      </div>
      <div className="h-1.5 bg-panel2 rounded-full overflow-hidden">
        <div className="h-full bg-mint" style={{ width: `${(left / seconds) * 100}%` }} />
      </div>

      <div className="h-28 grid place-items-center">
        <span className="font-display text-6xl" style={{ color: STROOP_COLORS[cur.ink].hex }}>
          {STROOP_COLORS[cur.word].name}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {STROOP_COLORS.map((c, i) => (
          <button key={c.name} onClick={() => pick(i)}
            className="btn text-ink font-bold py-4" style={{ background: c.hex }}>
            {c.name}
          </button>
        ))}
      </div>
      <p className="text-white/30 text-xs">Tippe die FARBE, in der das Wort geschrieben ist.</p>
    </div>
  )
}
