import { useEffect, useRef, useState } from 'react'
import { typingPhraseFor } from '../../lib/duelLogic'

// Tipp-Diktat: Satz fehlerfrei abtippen. Gewertet wird die Zeit in ms (kleiner = besser).
export default function TypingDuel({ duelId, onFinish }) {
  const phrase = useRef(typingPhraseFor(duelId)).current
  const [phase, setPhase] = useState('intro') // intro | live | done
  const [text, setText] = useState('')
  const [ms, setMs] = useState(0)
  const startRef = useRef(0)
  const doneRef = useRef(false)
  const inputRef = useRef(null)

  const start = () => {
    startRef.current = performance.now()
    setPhase('live')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  useEffect(() => {
    if (phase !== 'live' || doneRef.current) return
    if (text === phrase) {
      doneRef.current = true
      const t = performance.now() - startRef.current
      setMs(t)
      setPhase('done')
      onFinish({ value: String(Math.round(t)) })
    }
  }, [text, phrase, phase, onFinish])

  // Zeichenweiser Abgleich: falsche Stellen werden rot markiert
  const chars = phrase.split('').map((c, i) => {
    let state = 'todo'
    if (i < text.length) state = text[i] === c ? 'ok' : 'bad'
    return { c, state }
  })
  const hasError = chars.some((x) => x.state === 'bad')

  if (phase === 'intro') {
    return (
      <div className="card p-4 text-center space-y-3">
        <p className="text-white/70 text-sm">
          Gleich erscheint ein Satz. Tippe ihn <b>exakt</b> ab – Groß-/Kleinschreibung zählt.
          Die Uhr läuft ab dem Start. ⌨️
        </p>
        <button className="btn-primary w-full text-lg" onClick={start}>Start</button>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="card p-4 text-center">
        <p className="text-mint font-semibold text-lg">{(ms / 1000).toFixed(1)}s – abgegeben ✓<br />
          <span className="text-white/50 text-sm font-normal">Warte auf deinen Gegner…</span></p>
      </div>
    )
  }

  return (
    <div className="card p-4 space-y-3">
      <p className="text-sm text-white/50 text-center">Tippe exakt ab:</p>
      <div className="bg-panel2 rounded-xl p-3 text-center text-lg leading-relaxed break-words">
        {chars.map((x, i) => (
          <span key={i} className={
            x.state === 'ok' ? 'text-mint' : x.state === 'bad' ? 'text-white bg-brand rounded' : 'text-white/40'
          }>{x.c}</span>
        ))}
      </div>
      <input
        ref={inputRef}
        className={`input ${hasError ? 'border-brand' : ''}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoCapitalize="off" autoCorrect="off" autoComplete="off" spellCheck="false"
        placeholder="hier tippen…"
      />
      {hasError && <p className="text-brand text-xs text-center">Tippfehler – korrigieren, sonst geht's nicht weiter!</p>}
    </div>
  )
}
