import { useEffect, useRef, useState } from 'react'

// Tap-Sprint: 10 Sekunden lokal, so viele Taps wie möglich.
export default function TapSprint({ seconds = 10, onFinish }) {
  const [phase, setPhase] = useState('intro') // intro | count | live | done
  const [count, setCount] = useState(0)
  const [left, setLeft] = useState(seconds)
  const [countdown, setCountdown] = useState(3)
  const endRef = useRef(0)
  const doneRef = useRef(false)
  const countRef = useRef(0)

  const start = () => {
    setPhase('count')
    let c = 3
    setCountdown(c)
    const iv = setInterval(() => {
      c -= 1
      if (c <= 0) {
        clearInterval(iv)
        endRef.current = performance.now() + seconds * 1000
        setPhase('live')
      } else {
        setCountdown(c)
      }
    }, 800)
  }

  useEffect(() => {
    if (phase !== 'live') return
    const iv = setInterval(() => {
      const rem = Math.max(0, (endRef.current - performance.now()) / 1000)
      setLeft(rem)
      if (rem <= 0 && !doneRef.current) {
        doneRef.current = true
        clearInterval(iv)
        setPhase('done')
        onFinish({ value: String(countRef.current) })
      }
    }, 60)
    return () => clearInterval(iv)
  }, [phase, onFinish])

  const tap = () => {
    if (phase !== 'live') return
    countRef.current += 1
    setCount(countRef.current)
  }

  return (
    <div className="card p-4 text-center space-y-3">
      {phase === 'intro' && (
        <>
          <p className="text-white/70 text-sm">{seconds} Sekunden. Hämmere auf den Button. Mehr Taps gewinnen. 👆</p>
          <button className="btn-primary w-full text-lg" onClick={start}>Bereit? Los! 🔥</button>
        </>
      )}
      {phase === 'count' && (
        <div className="h-56 grid place-items-center">
          <span className="font-display text-7xl text-gold animate-pop" key={countdown}>{countdown}</span>
        </div>
      )}
      {phase === 'live' && (
        <>
          <div className="flex justify-between text-sm text-white/60 px-1">
            <span>⏱ {left.toFixed(1)}s</span>
            <span className="font-display text-xl text-white">{count} Taps</span>
          </div>
          <button onClick={tap}
            className="w-full h-56 rounded-2xl bg-brand active:bg-brand2 active:scale-[0.99] grid place-items-center select-none touch-manipulation">
            <span className="font-display text-5xl text-white">{count}</span>
          </button>
        </>
      )}
      {phase === 'done' && (
        <p className="text-mint font-semibold text-lg">
          {count} Taps – abgegeben ✓<br />
          <span className="text-white/50 text-sm font-normal">Warte auf deinen Gegner…</span>
        </p>
      )}
    </div>
  )
}
