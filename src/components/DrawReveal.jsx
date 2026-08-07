import { useEffect, useRef, useState } from 'react'
import Avatar from './Avatar.jsx'
import { sounds } from '../lib/sounds'

// ============================================================
//  Auslosung wie beim Glücksrad: die Avatare der Crew rattern
//  durch, werden langsamer und bleiben auf dem Herausforderer
//  stehen. Läuft auf jedem Handy gleichzeitig (getriggert über
//  duel.id), danach übernimmt die normale Duell-Ansicht.
// ============================================================

const START_MS = 55      // erstes Intervall
const SLOWDOWN = 1.13    // pro Schritt langsamer
const STOP_MS = 380      // ab hier ist Schluss

export default function DrawReveal({ crew, challenger, groom, onDone }) {
  const [i, setI] = useState(0)
  const [locked, setLocked] = useState(false)
  const timer = useRef(null)

  // Der Herausforderer soll am Ende stehen bleiben – dafür rotieren wir
  // durch eine Liste, die genau auf ihm endet.
  const ring = crew.length ? crew : [challenger].filter(Boolean)

  useEffect(() => {
    let step = 0
    let delay = START_MS
    let idx = 0

    const spin = () => {
      idx = (idx + 1) % ring.length
      setI(idx)
      sounds.tick()
      step += 1
      delay *= SLOWDOWN

      if (delay >= STOP_MS) {
        // Auf dem echten Herausforderer landen
        const target = ring.findIndex((p) => p.id === challenger?.id)
        setI(target >= 0 ? target : idx)
        setLocked(true)
        sounds.lock()
        timer.current = setTimeout(onDone, 1100)
        return
      }
      timer.current = setTimeout(spin, delay)
    }

    timer.current = setTimeout(spin, delay)
    return () => clearTimeout(timer.current)
  }, [])

  const shown = locked ? challenger : ring[i]

  return (
    <div className="card p-6 text-center border-brand/40">
      <div className="text-white/50 text-xs uppercase tracking-widest">
        {locked ? 'Herausforderer steht' : 'Wer muss ran?'}
      </div>

      <div className={`mt-4 inline-block rounded-full ${locked ? 'animate-winPop animate-glow' : ''}`}>
        <Avatar avatar={shown?.avatar} size={150} className={locked ? '' : 'opacity-90'} />
      </div>

      <div className={`h-display text-4xl mt-3 ${locked ? 'text-mint' : 'text-white/70'}`}>
        {shown?.name || '…'}
      </div>

      {locked ? (
        <p className="text-white/60 mt-1">tritt an gegen 👑 {groom?.name}</p>
      ) : (
        <div className="flex justify-center gap-1.5 mt-3">
          {ring.map((p, n) => (
            <span key={p.id} className={`w-2 h-2 rounded-full transition ${
              n === i ? 'bg-brand scale-125' : 'bg-white/15'
            }`} />
          ))}
        </div>
      )}
    </div>
  )
}
