import { useEffect, useRef, useState } from 'react'
import { duelQuizFor } from '../../lib/duelLogic'

// Blitz-Quiz: 5 Fragen (gleiche auf beiden Handys via Seed), 12s pro Frage.
// Punkte: 100 für richtig + bis zu 50 Speed-Bonus.
export default function QuizDuel({ duelId, seconds = 12, onFinish }) {
  const questions = useRef(duelQuizFor(duelId)).current
  const [idx, setIdx] = useState(-1) // -1 = intro
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState(null)
  const [left, setLeft] = useState(seconds)
  const startRef = useRef(0)
  const scoreRef = useRef(0)
  const advancedRef = useRef(-1) // verhindert doppeltes advance (Timeout + Tap gleichzeitig)

  const next = () => {
    setPicked(null)
    startRef.current = performance.now()
    setLeft(seconds)
    setIdx((i) => i + 1)
  }

  useEffect(() => {
    if (idx < 0 || idx >= questions.length || picked !== null) return
    const iv = setInterval(() => {
      const rem = Math.max(0, seconds - (performance.now() - startRef.current) / 1000)
      setLeft(rem)
      if (rem <= 0) {
        clearInterval(iv)
        setPicked(-1) // Zeit abgelaufen = falsch
        setTimeout(advance, 900)
      }
    }, 100)
    return () => clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, picked])

  const advance = () => {
    if (advancedRef.current >= idx) return
    advancedRef.current = idx
    if (idx + 1 >= questions.length) {
      onFinish({ value: String(scoreRef.current) })
      setIdx(questions.length) // done-Screen
    } else {
      next()
    }
  }

  const pick = (i) => {
    if (picked !== null) return
    setPicked(i)
    const q = questions[idx]
    if (i === q.correct) {
      const elapsed = (performance.now() - startRef.current) / 1000
      const bonus = Math.round(Math.max(0, (seconds - elapsed) / seconds) * 50)
      scoreRef.current += 100 + bonus
      setScore(scoreRef.current)
    }
    setTimeout(advance, 900)
  }

  if (idx === -1) {
    return (
      <div className="card p-4 text-center space-y-3">
        <p className="text-white/70 text-sm">5 Schnellfragen · {seconds}s pro Frage · richtig + schnell = Punkte 🧠</p>
        <button className="btn-primary w-full text-lg" onClick={next}>Quiz starten</button>
      </div>
    )
  }

  if (idx >= questions.length) {
    return (
      <div className="card p-4 text-center">
        <p className="text-mint font-semibold text-lg">{score} Punkte – abgegeben ✓<br />
          <span className="text-white/50 text-sm font-normal">Warte auf deinen Gegner…</span></p>
      </div>
    )
  }

  const q = questions[idx]
  return (
    <div className="card p-4 space-y-3">
      <div className="flex justify-between text-sm text-white/60">
        <span>Frage {idx + 1}/5</span>
        <span className={left <= 3 ? 'text-brand font-bold' : ''}>⏱ {Math.ceil(left)}s</span>
        <span className="text-gold">{score} P.</span>
      </div>
      <div className="h-1.5 bg-panel2 rounded-full overflow-hidden">
        <div className="h-full bg-mint transition-all" style={{ width: `${(left / seconds) * 100}%` }} />
      </div>
      <p className="font-bold leading-snug">{q.q}</p>
      <div className="grid gap-2">
        {q.options.map((opt, i) => (
          <button key={i} disabled={picked !== null} onClick={() => pick(i)}
            className={`btn justify-start text-left text-sm ${
              picked !== null && i === q.correct ? 'bg-mint text-ink' :
              picked === i ? 'bg-brand text-white' : 'bg-panel2 border border-line'
            }`}>
            <span className="font-display w-5">{String.fromCharCode(65 + i)}</span>{opt}
          </button>
        ))}
      </div>
    </div>
  )
}
