import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import { DAYS, BASECAMP, KEYSAFE_CODE, PACKLISTE, OFFENE_BUCHUNGEN, GEBUCHT, planLoaded } from '../lib/planData'
import { loadLocal, saveLocal } from '../lib/storage'
import { getPlayer } from '../lib/api'
import { supabaseConfigured } from '../lib/supabase'

// Crew-Code aus dem Build (GitHub-Secret VITE_CREW_PIN) – steht bewusst nicht
// im öffentlichen Quellcode. Ohne gesetzten Code bleibt nur die Bräutigam-Sperre.
const CREW_PIN = (import.meta.env.VITE_CREW_PIN || '').trim().toUpperCase()

export default function Plan() {
  const [day, setDay] = useState(DAYS[0]?.id)
  // 'check' → wird geprüft · 'groom' → Bräutigam · 'locked' → Code nötig · 'open'
  const [gate, setGate] = useState('check')
  const [groomName, setGroomName] = useState('')
  const [pin, setPin] = useState('')
  const [pinErr, setPinErr] = useState('')
  const active = DAYS.find((d) => d.id === day)

  // Zuerst SPERREN, dann prüfen: Wer den Link bekommt, sieht ohne Crew-Code nichts.
  useEffect(() => {
    const local = loadLocal()
    const unlocked = () => setGate(!CREW_PIN || local.planOk ? 'open' : 'locked')

    if (!local.playerId || !supabaseConfigured) { unlocked(); return }
    getPlayer(local.playerId)
      .then((p) => {
        if (p?.is_groom) {
          saveLocal({ planOk: false })   // einmal Bräutigam = dauerhaft gesperrt
          setGroomName(p.name || 'Bräutigam')
          setGate('groom')
        } else unlocked()
      })
      .catch(unlocked)
  }, [])

  const tryPin = () => {
    if (pin.trim().toUpperCase() === CREW_PIN) {
      saveLocal({ planOk: true })
      setGate('open')
    } else {
      setPinErr('Falscher Code.')
      setPin('')
    }
  }

  if (!planLoaded) {
    return (
      <Layout title="Plan"
              right={<Link to="/" className="chip bg-panel2 text-white/60 border border-line">← Start</Link>}>
        <div className="card p-6 text-center text-white/50">
          Kein Plan im Build enthalten (VITE_PLAN fehlt). <code>npm run plan</code> ausführen.
        </div>
      </Layout>
    )
  }

  if (gate === 'check') {
    return <Layout title="Moment…"><div className="card p-6 text-center text-white/50">Prüfe Berechtigung…</div></Layout>
  }

  if (gate === 'groom') {
    return (
      <Layout subtitle="Zutritt verweigert" title="Netter Versuch 😏"
              right={<Link to="/" className="chip bg-panel2 text-white/60 border border-line">← Start</Link>}>
        <div className="card p-8 text-center space-y-3">
          <div className="text-6xl">🔒👑</div>
          <p className="text-lg font-bold">Nicht für dich, {groomName}.</p>
          <p className="text-white/60 text-sm">
            Du bist der Bräutigam. Du erfährst alles, wenn es so weit ist –
            und keine Sekunde früher.
          </p>
          <p className="text-white/30 text-xs">Schön probiert. Wir sehen sowas. 🕵️</p>
        </div>
        <Link to="/" className="btn-primary w-full">Zurück zum Spiel</Link>
      </Layout>
    )
  }

  if (gate === 'locked') {
    return (
      <Layout subtitle="Nur für die Crew" title="🔒 Gesperrt"
              right={<Link to="/" className="chip bg-panel2 text-white/60 border border-line">← Start</Link>}>
        <div className="card p-6 text-center space-y-4">
          <div className="text-6xl">🤫</div>
          <p className="text-white/70 text-sm">
            Der Plan ist geheim. Den Crew-Code habt ihr in der Gruppe –
            der Bräutigam nicht.
          </p>
          <input className="input text-center uppercase tracking-[0.3em]" value={pin} maxLength={12}
                 autoCapitalize="characters" autoComplete="off"
                 onChange={(e) => { setPin(e.target.value); setPinErr('') }}
                 onKeyDown={(e) => e.key === 'Enter' && tryPin()}
                 placeholder="CREW-CODE" />
          {pinErr && <p className="text-brand text-sm">{pinErr}</p>}
          <button className="btn-primary w-full" onClick={tryPin}>Aufsperren</button>
        </div>
        <Link to="/" className="btn-ghost w-full">Zurück</Link>
      </Layout>
    )
  }

  return (
    <Layout subtitle="8.–9. August 2026" title="Der Plan 🗺️"
            right={<Link to="/" className="chip bg-panel2 text-white/60 border border-line">← Start</Link>}>

      {/* Basislager – für Taxi & Orientierung immer griffbereit */}
      <a href={BASECAMP.maps} target="_blank" rel="noreferrer"
         className="card p-4 block border-gold/40 active:scale-[0.99] transition">
        <div className="text-gold text-xs uppercase tracking-widest">🏠 Basislager</div>
        <div className="font-display text-2xl mt-0.5">{BASECAMP.address}</div>
        <div className="text-white/40 text-[11px] mt-0.5">{BASECAMP.name}</div>
        <div className="text-white/50 text-xs mt-1">{BASECAMP.note}</div>
        <div className="text-brand text-xs mt-2 font-semibold">In Karten öffnen →</div>
      </a>

      {/* Self-Check-in: das braucht der Erste, der ankommt */}
      <details className="card p-4">
        <summary className="cursor-pointer list-none flex items-center justify-between">
          <span className="h-display text-xl">🔑 So kommt ihr rein</span>
          <span className="text-white/30 text-xs">antippen</span>
        </summary>

        <ol className="mt-3 space-y-2">
          {BASECAMP.checkin.map((s, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-white/70">
              <span className="shrink-0 w-5 h-5 rounded-full bg-brand/20 text-brand text-xs
                               font-bold grid place-items-center mt-0.5">{i + 1}</span>
              <span className="leading-snug">{s}</span>
            </li>
          ))}
        </ol>

        <div className="mt-3 rounded-xl bg-panel2 border border-line px-3 py-2.5 text-center">
          <div className="text-white/40 text-[11px] uppercase tracking-widest">Code Schlüsselsafe</div>
          {KEYSAFE_CODE
            ? <div className="font-display text-3xl tracking-[0.3em] text-gold mt-0.5">{KEYSAFE_CODE}</div>
            : <div className="text-white/60 text-sm mt-1">Steht in der WhatsApp-Gruppe 📱</div>}
        </div>

        <div className="mt-3">
          <div className="text-white/40 text-[11px] uppercase tracking-widest mb-1">Beim Check-out (So)</div>
          <ul className="space-y-1">
            {BASECAMP.checkout.map((s, i) => (
              <li key={i} className="text-sm text-white/60 flex gap-2"><span className="text-mint">✓</span>{s}</li>
            ))}
          </ul>
        </div>
      </details>

      {/* Tag umschalten */}
      <div className="grid grid-cols-2 gap-2">
        {DAYS.map((d) => (
          <button key={d.id} onClick={() => setDay(d.id)}
            className={`btn ${day === d.id ? 'bg-brand text-white' : 'bg-panel2 border border-line'}`}>
            <span className="flex flex-col leading-tight">
              <span className="font-bold">{d.label}</span>
              <span className="text-[10px] opacity-70">{d.date}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="card p-3 text-center">
        <span className="text-xs text-white/50">👕 Dresscode </span>
        <span className="text-sm font-semibold text-gold">{active.dresscode}</span>
      </div>

      {/* Zeitstrahl */}
      <div className="space-y-2">
        {active.items.map((it, i) => (
          <div key={i} className="card p-3 flex gap-3">
            <div className="shrink-0 text-center w-14">
              <div className="font-display text-lg leading-none">{it.time}</div>
              <div className="text-2xl mt-1">{it.icon}</div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold leading-tight">{it.title}</h3>
                {it.status === 'fix' && <span className="chip bg-mint/20 text-mint shrink-0">✓ fix</span>}
                {it.status === 'todo' && <span className="chip bg-gold/20 text-gold shrink-0">buchen!</span>}
              </div>
              {it.place && (
                it.maps
                  ? <a href={it.maps} target="_blank" rel="noreferrer"
                       className="text-brand text-sm underline decoration-brand/40 break-words">📍 {it.place}</a>
                  : <div className="text-white/60 text-sm">📍 {it.place}</div>
              )}
              {it.note && <p className="text-white/50 text-xs mt-1 leading-snug">{it.note}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Fix gebucht */}
      <div className="card p-4 border-mint/30">
        <h3 className="h-display text-xl mb-2">✅ Steht fix</h3>
        <ul className="space-y-1">
          {GEBUCHT.map((g, i) => (
            <li key={i} className="text-sm text-white/70 flex gap-2"><span className="text-mint">✓</span>{g}</li>
          ))}
        </ul>
      </div>

      {/* Offene Punkte */}
      <div className="card p-4">
        <h3 className="h-display text-xl mb-2">⏳ Noch offen</h3>
        <ul className="space-y-1.5">
          {OFFENE_BUCHUNGEN.map((b, i) => (
            <li key={i} className="flex items-center justify-between bg-panel2 rounded-xl px-3 py-2">
              <span className="text-sm">{b.urgent && '🔥 '}{b.what}</span>
              <span className="text-white/40 text-xs shrink-0 ml-2">{b.when}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Packliste */}
      <div className="card p-4">
        <h3 className="h-display text-xl mb-2">🎒 Packliste</h3>
        <ul className="space-y-1">
          {PACKLISTE.map((p, i) => (
            <li key={i} className="text-sm text-white/70 flex gap-2"><span className="text-mint">•</span>{p}</li>
          ))}
        </ul>
      </div>

      <p className="text-white/30 text-xs text-center pb-2">
        Fahrer-Regel: Wer Samstag hinfährt, darf nachts Vollgas geben.<br />
        Wer Sonntag heimfährt, bleibt beim Heurigen beim Traubensaft. 🍇
      </p>
    </Layout>
  )
}
