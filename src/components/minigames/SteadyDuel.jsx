import { useEffect, useRef, useState } from 'react'

// Ruhige Hand: Handy flach halten. Sobald es zu stark kippt, ist Schluss.
// Gewertet wird die gehaltene Zeit in ms (höher = besser).
const TILT_LIMIT = 12   // Grad Abweichung von der Startlage
const MAX_MS = 60000    // Sicherheitsnetz, falls jemand eine Marmorstatue ist

export default function SteadyDuel({ onFinish }) {
  const [phase, setPhase] = useState('intro') // intro | live | done | nosensor
  const [tilt, setTilt] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const baseRef = useRef(null)
  const startRef = useRef(0)
  const doneRef = useRef(false)
  const gotDataRef = useRef(false)

  const stop = (ms) => {
    if (doneRef.current) return
    doneRef.current = true
    setPhase('done')
    setElapsed(ms)
    onFinish({ value: String(Math.round(ms)) })
  }

  useEffect(() => {
    if (phase !== 'live') return

    const onOrient = (e) => {
      if (e.beta == null && e.gamma == null) return
      gotDataRef.current = true
      const beta = e.beta || 0
      const gamma = e.gamma || 0
      if (!baseRef.current) baseRef.current = { beta, gamma }
      const d = Math.max(
        Math.abs(beta - baseRef.current.beta),
        Math.abs(gamma - baseRef.current.gamma)
      )
      setTilt(d)
      if (d > TILT_LIMIT) stop(performance.now() - startRef.current)
    }

    window.addEventListener('deviceorientation', onOrient)

    // Sensor liefert nichts (Desktop / Berechtigung verweigert) → sauber abbrechen
    const check = setTimeout(() => {
      if (!gotDataRef.current) {
        window.removeEventListener('deviceorientation', onOrient)
        setPhase('nosensor')
      }
    }, 1800)

    const tick = setInterval(() => {
      const ms = performance.now() - startRef.current
      setElapsed(ms)
      if (ms > MAX_MS) stop(MAX_MS)
    }, 100)

    return () => {
      window.removeEventListener('deviceorientation', onOrient)
      clearTimeout(check)
      clearInterval(tick)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const start = async () => {
    // iOS verlangt eine ausdrückliche Freigabe – nur direkt aus dem Tap heraus möglich
    try {
      const DOE = window.DeviceOrientationEvent
      if (DOE && typeof DOE.requestPermission === 'function') {
        const res = await DOE.requestPermission()
        if (res !== 'granted') { setPhase('nosensor'); return }
      }
    } catch { setPhase('nosensor'); return }
    baseRef.current = null
    doneRef.current = false
    gotDataRef.current = false
    startRef.current = performance.now()
    setPhase('live')
  }

  const danger = tilt > TILT_LIMIT * 0.6

  return (
    <div className="card p-4 text-center space-y-3">
      {phase === 'intro' && (
        <>
          <p className="text-white/70 text-sm">
            Handy flach auf die offene Hand, Arm ausgestreckt – und <b>still halten</b>.
            Sobald du zu stark kippst, ist Schluss. Wer länger durchhält, gewinnt. 🤚
          </p>
          <button className="btn-primary w-full text-lg" onClick={start}>Los geht's</button>
        </>
      )}

      {phase === 'live' && (
        <>
          <div className="font-display text-5xl tabular-nums text-mint">{(elapsed / 1000).toFixed(1)}s</div>
          <div className="h-3 bg-panel2 rounded-full overflow-hidden">
            <div className={`h-full transition-all ${danger ? 'bg-brand' : 'bg-mint'}`}
                 style={{ width: `${Math.min(100, (tilt / TILT_LIMIT) * 100)}%` }} />
          </div>
          <p className={`text-sm ${danger ? 'text-brand font-bold animate-shake' : 'text-white/50'}`}>
            {danger ? 'WACKELT! Ruhig halten!' : 'Ruhig … ganz ruhig …'}
          </p>
        </>
      )}

      {phase === 'done' && (
        <p className="text-mint font-semibold text-lg">
          {(elapsed / 1000).toFixed(1)}s durchgehalten – abgegeben ✓<br />
          <span className="text-white/50 text-sm font-normal">Warte auf deinen Gegner…</span>
        </p>
      )}

      {phase === 'nosensor' && (
        <div className="space-y-2">
          <p className="text-brand font-semibold">Kein Bewegungssensor verfügbar 📵</p>
          <p className="text-white/50 text-sm">
            Dieses Handy gibt die Lage nicht frei. Der Organisator wertet das Duell von Hand –
            haltet einfach beide das Handy hoch, wer zuerst wackelt, verliert.
          </p>
        </div>
      )}
    </div>
  )
}
