import { useEffect, useRef, useState } from 'react'

// Countdown-Timer. startTs = ms-Zeitstempel (z.B. von der Session), seconds = Dauer.
export default function Timer({ seconds = 20, startTs, onDone, size = 120 }) {
  const [left, setLeft] = useState(seconds)
  const doneRef = useRef(false)

  useEffect(() => {
    doneRef.current = false
    const base = startTs || Date.now()
    const tick = () => {
      const elapsed = (Date.now() - base) / 1000
      const remaining = Math.max(0, seconds - elapsed)
      setLeft(remaining)
      if (remaining <= 0 && !doneRef.current) {
        doneRef.current = true
        onDone && onDone()
      }
    }
    tick()
    const id = setInterval(tick, 100)
    return () => clearInterval(id)
  }, [seconds, startTs, onDone])

  const pct = Math.max(0, Math.min(1, left / seconds))
  const r = size / 2 - 8
  const circ = 2 * Math.PI * r
  const danger = left <= 5

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#2a2a3c" strokeWidth="8" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r}
          stroke={danger ? '#e11d48' : '#34d399'} strokeWidth="8" fill="none"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.1s linear' }} />
      </svg>
      <span className={`absolute font-display text-4xl tabular-nums ${danger ? 'text-brand' : ''}`}>
        {Math.ceil(left)}
      </span>
    </div>
  )
}
