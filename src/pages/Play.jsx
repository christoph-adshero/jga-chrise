import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useSession } from '../hooks/useSession.js'
import { useBotDriver } from '../hooks/useBotDriver.js'
import { loadLocal, saveLocal } from '../lib/storage.js'
import { joinSession } from '../lib/api'
import { withGroomName } from '../lib/gameData.js'
import Layout from '../components/Layout.jsx'
import Lobby from './Lobby.jsx'
import DuelArena from './games/DuelArena.jsx'
import Results from './games/Results.jsx'

function JoinHere({ session, players, onCancel }) {
  const [name, setName] = useState(loadLocal().name || '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const join = async () => {
    if (!name.trim()) return setErr('Bitte Namen eingeben.')
    setBusy(true)
    try {
      const player = await joinSession(session.id, name.trim())
      saveLocal({ playerId: player.id, sessionId: session.id, name: player.name })
      window.location.reload()
    } catch (e) {
      setErr(e.message)
      setBusy(false)
    }
  }

  return (
    <Layout subtitle="Du bist eingeladen" title="JGA Chrise 🍻">
      <div className="card p-5 text-center">
        <div className="text-5xl mb-2">🥊👑🍺</div>
        <p className="text-white/70 text-sm">
          <b className="text-white">CREW vs. BRÄUTIGAM.</b><br />
          Trag deinen Namen ein – mehr brauchst du nicht.
        </p>
      </div>

      <div className="card p-4 space-y-3">
        <label className="block">
          <span className="text-sm text-white/60">Dein Name</span>
          <input className="input mt-1" value={name} maxLength={20} autoFocus
                 onChange={(e) => { setName(e.target.value); setErr('') }}
                 onKeyDown={(e) => e.key === 'Enter' && join()}
                 placeholder="z.B. Poldi" />
        </label>
        {err && <p className="text-brand text-sm">{err}</p>}
        <button className="btn-primary w-full text-lg" disabled={busy} onClick={join}>
          {busy ? '…' : '🚀 Mitspielen'}
        </button>
        {players.length > 0 && (
          <p className="text-white/40 text-xs text-center">
            Schon dabei: {players.map((p) => p.name).join(', ')}
          </p>
        )}
      </div>

      <Link to="/regeln" className="btn-ghost w-full">📖 So läuft's</Link>
      <button className="text-white/30 text-xs underline w-full" onClick={onCancel}>
        Doch eine andere Runde
      </button>
    </Layout>
  )
}

export default function Play() {
  const { sessionId } = useParams()
  const nav = useNavigate()
  const { session, players, loading } = useSession(sessionId)
  const local = loadLocal()
  const me = players.find((p) => p.id === local.playerId)

  // Test-Modus: Die Bots müssen auch hier mitspielen, weil der Organisator
  // den Ablauf inzwischen komplett aus der Spieleransicht steuert.
  // (Admin- und Spielerseite sind getrennte Routen – nie beide gleichzeitig aktiv.)
  useBotDriver(session, players, Boolean(local.isAdmin && players.some((p) => p.avatar?.bot)))

  if (loading) {
    return <Layout title="Lädt…"><div className="card p-6 text-center text-white/60">Verbinde mit der Runde…</div></Layout>
  }

  if (!session) {
    return (
      <Layout title="Nicht gefunden">
        <div className="card p-6 text-center">
          <p className="text-white/70 mb-4">Diese Session existiert nicht (mehr).</p>
          <Link to="/" className="btn-primary w-full">Zur Startseite</Link>
        </div>
      </Layout>
    )
  }

  // Wer den geteilten Link öffnet, tritt hier direkt bei – ohne Code.
  // Die Session steht ja schon in der URL.
  if (!me) return <JoinHere session={session} players={players} onCancel={() => nav('/')} />


  const config = withGroomName(session.config || {}, session.config?.groomName)
  const common = { session, players, me, config }

  if (session.status === 'finished') return <Results {...common} />
  if (session.status === 'lobby') return <Lobby {...common} />

  if (session.current_game === 'duell') return <DuelArena {...common} />

  return (
    <Layout subtitle={session.code} title="Gleich geht's weiter…">
      <div className="card p-6 text-center text-white/60">
        ⏸ Pause – der Organisator startet gleich das nächste Duell.
      </div>
      <Link to="/regeln" className="btn-ghost w-full">📖 Regeln nachlesen</Link>
      {!me.is_groom && (
        <Link to="/plan" className="btn-gold w-full">🗺️ Wo müssen wir als Nächstes hin?</Link>
      )}
    </Layout>
  )
}
