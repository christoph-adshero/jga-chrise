import { useRef, useState } from 'react'
import { estimatesFor } from '../../lib/duelLogic'

// Schätzmeister: 3 Fragen (Seed), wer näher dran ist holt den Punkt.
export default function EstimateDuel({ duelId, onFinish }) {
  const questions = useRef(estimatesFor(duelId)).current
  const [idx, setIdx] = useState(-1)
  const [guess, setGuess] = useState('')
  const guessesRef = useRef([])

  const submit = () => {
    if (guess === '') return
    guessesRef.current.push(Number(guess))
    setGuess('')
    if (idx + 1 >= questions.length) {
      onFinish({ value: JSON.stringify(guessesRef.current) })
      setIdx(questions.length)
    } else {
      setIdx(idx + 1)
    }
  }

  if (idx === -1) {
    return (
      <div className="card p-4 text-center space-y-3">
        <p className="text-white/70 text-sm">3 Schätzfragen · näher dran = Punkt · best of 3 🎯</p>
        <button className="btn-primary w-full text-lg" onClick={() => setIdx(0)}>Los geht's</button>
      </div>
    )
  }

  if (idx >= questions.length) {
    return (
      <div className="card p-4 text-center">
        <p className="text-mint font-semibold text-lg">Schätzungen abgegeben ✓<br />
          <span className="text-white/50 text-sm font-normal">Warte auf deinen Gegner…</span></p>
      </div>
    )
  }

  const q = questions[idx]
  return (
    <div className="card p-4 space-y-3">
      <div className="text-sm text-white/60">Frage {idx + 1}/3</div>
      <p className="font-bold leading-snug">{q.q}</p>
      <div className="flex gap-2">
        <input type="number" inputMode="numeric" className="input" placeholder={q.unit || 'Zahl'}
               value={guess} onChange={(e) => setGuess(e.target.value)} />
        <button className="btn-primary" onClick={submit}>OK</button>
      </div>
      <p className="text-white/30 text-xs">Die Auflösung kommt nach dem Duell – nicht schummeln! 😄</p>
    </div>
  )
}
