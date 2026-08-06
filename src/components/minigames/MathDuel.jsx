import { useEffect, useRef, useState } from 'react'
import { mathProblemsFor } from '../../lib/duelLogic'

// Kopfrechnen: so viele Aufgaben wie möglich in der Zeit. Gewertet wird die Anzahl richtiger.
export default function MathDuel({ duelId, seconds = 45, onFinish }) {
  const problems = useRef(mathProblemsFor(duelId)).current
  const [phase, setPhase] = useState('intro') // intro | live | done
  const [idx, setIdx] = useState(0)
  const [input, setInput] = useState('')
  const [correct, setCorrect] = useState(0)
  const [left, setLeft] = useState(seconds)
  const [flash, setFlash] = useState(null)
  const correctRef = useRef(0)
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
        onFinish({ value: String(correctRef.current) })
      }
    }, 80)
    return () => clearInterval(iv)
  }, [phase, onFinish])

  const start = () => {
    endRef.current = performance.now() + seconds * 1000
    setPhase('live')
  }

  const press = (d) => {
    if (phase !== 'live') return
    const next = (input + d).slice(0, 4)
    setInput(next)
    // Auto-Absenden, sobald die Zahl stimmt – kein extra Tap nötig
    if (Number(next) === problems[idx % problems.length].a) {
      correctRef.current += 1
      setCorrect(correctRef.current)
      setFlash('ok'); setTimeout(() => setFlash(null), 150)
      setInput('')
      setIdx((i) => i + 1)
    }
  }

  const skip = () => {
    if (phase !== 'live') return
    setInput('')
    setIdx((i) => i + 1)
    setFlash('skip'); setTimeout(() => setFlash(null), 150)
  }

  if (phase === 'intro') {
    return (
      <div className="card p-4 text-center space-y-3">
        <p className="text-white/70 text-sm">
          {seconds} Sekunden Kopfrechnen. Tippe das Ergebnis – sobald es stimmt, kommt automatisch
          die nächste Aufgabe. Keine Ahnung? Überspringen. 🧮
        </p>
        <button className="btn-primary w-full text-lg" onClick={start}>Start</button>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="card p-4 text-center">
        <p className="text-mint font-semibold text-lg">{correct} richtig – abgegeben ✓<br />
          <span className="text-white/50 text-sm font-normal">Warte auf deinen Gegner…</span></p>
      </div>
    )
  }

  const p = problems[idx % problems.length]
  return (
    <div className={`card p-4 text-center space-y-3 ${flash === 'ok' ? 'animate-pop' : ''}`}>
      <div className="flex justify-between text-sm text-white/60">
        <span className={left <= 8 ? 'text-brand font-bold' : ''}>⏱ {Math.ceil(left)}s</span>
        <span className="text-gold font-display text-xl">{correct} richtig</span>
      </div>
      <div className="h-1.5 bg-panel2 rounded-full overflow-hidden">
        <div className="h-full bg-mint" style={{ width: `${(left / seconds) * 100}%` }} />
      </div>

      <div className="font-display text-5xl py-2">{p.q}</div>
      <div className="font-display text-3xl h-10 text-gold tabular-nums">{input || '·'}</div>

      <div className="grid grid-cols-3 gap-2">
        {[1,2,3,4,5,6,7,8,9].map((n) => (
          <button key={n} onClick={() => press(String(n))} className="btn-ghost text-xl font-display">{n}</button>
        ))}
        <button onClick={() => setInput('')} className="btn-ghost text-sm">C</button>
        <button onClick={() => press('0')} className="btn-ghost text-xl font-display">0</button>
        <button onClick={skip} className="btn-ghost text-sm text-white/50">Skip ▸</button>
      </div>
    </div>
  )
}
