import { useParams, useNavigate, Link } from 'react-router-dom'
import { useSession } from '../hooks/useSession.js'
import { useBotDriver } from '../hooks/useBotDriver.js'
import { loadLocal } from '../lib/storage.js'
import { withGroomName } from '../lib/gameData.js'
import Layout from '../components/Layout.jsx'
import Lobby from './Lobby.jsx'
import DuelArena from './games/DuelArena.jsx'
import Results from './games/Results.jsx'

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

  if (!me) {
    return (
      <Layout title="Bitte beitreten">
        <div className="card p-6 text-center">
          <p className="text-white/70 mb-4">Du bist auf diesem Handy noch nicht in der Runde.</p>
          <button className="btn-primary w-full" onClick={() => nav('/')}>Mit Code beitreten</button>
        </div>
      </Layout>
    )
  }

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
