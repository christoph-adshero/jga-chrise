import { useEffect, useRef, useState } from 'react'

// Zeitgefühl: Stoppuhr starten und BLIND bei exakt 10,00s stoppen.
// Anzeige verschwindet nach 3s. Geringere Abweichung gewinnt.
export default function TimingDuel({ target = 10, onFinish }) {
  const [phase, setPhase] = useState('intro') // intro | running | done
  const [display, setDisplay] = useState(0)
  const [result, setResult] = useState(null)
  const startRef = useRef(0)
  const doneRef = useRef(false)

  useEffect(() => {
    if (phase !== 'running') return
    const iv = setInterval(() => {
      const s = (performance.now() - startRef.current) / 1000
      setDisplay(s)
      if (s > target * 2 && !doneRef.current) { // Schlafmützen-Schutz: bei 20s Auto-Stopp
        doneRef.current = true
        clearInterval(iv)
        finish(target * 1000)
      }
    }, 50)
    return () => clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const start = () => {
    startRef.current = performance.now()
    doneRef.current = false
    setPhase('running')
  }

  const finish = (deviationMs) => {
    setResult(deviationMs)
    setPhase('done')
    onFinish({ value: String(Math.round(deviationMs)) })
  }

  const stop = () => {
    if (phase !== 'running' || doneRef.current) return
    doneRef.current = true
    const elapsed = (performance.now() - startRef.current) / 1000
    finish(Math.abs(elapsed - target) * 1000)
  }

  const blind = display >= 3

  return (
    <div className="card p-4 text-center space-y-3">
      {phase === 'intro' && (
        <>
          <p className="text-white/70 text-sm">
            Starte die Uhr und stoppe sie bei exakt <b className="text-gold">{target},00 Sekunden</b>.
            Ab Sekunde 3 läuft sie <b>blind</b> weiter. Wer näher dran ist, gewinnt. ⏱️
          </p>
          <button className="btn-primary w-full text-lg" onClick={start}>Uhr starten</button>
        </>
      )}

      {phase === 'running' && (
        <button onClick={stop} className="w-full h-56 rounded-2xl bg-panel2 border border-line grid place-items-center active:scale-[0.99]">
          <div>
            <div className={`font-display text-6xl tabular-nums ${blind ? 'text-white/10' : 'text-mint'}`}>
              {blind ? '?.??' : display.toFixed(2)}
            </div>
            <div className="text-white/50 text-sm mt-2">{blind ? 'Blind! Zähle im Kopf … tippe bei 10,00s' : 'Gleich wird\'s blind…'}</div>
          </div>
        </button>
      )}

      {phase === 'done' && (
        <p className="text-mint font-semibold text-lg">
          ±{(result / 1000).toFixed(2)}s daneben – abgegeben ✓<br />
          <span className="text-white/50 text-sm font-normal">Warte auf deinen Gegner…</span>
        </p>
      )}
    </div>
  )
}
