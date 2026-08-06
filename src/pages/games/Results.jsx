import { Link } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Scoreboard from '../../components/Scoreboard.jsx'
import Avatar from '../../components/Avatar.jsx'
import Confetti from '../../components/Confetti.jsx'
import { loadLocal } from '../../lib/storage'
import { crewMeter, statsFromHistory } from '../../lib/duelLogic'
import { pointsToEuro, fmtEuro } from '../../lib/gameData'

export default function Results({ session, players, config }) {
  const history = session.state?.history || []
  const meter = crewMeter(history)
  const stats = statsFromHistory(history)
  const groom = players.find((p) => p.is_groom)
  const crew = players.filter((p) => !p.is_groom).sort((a, b) => b.score - a.score)
  const mvp = crew[0]
  const groomBeaten = meter.crew > meter.groom

  // Abrechnung: jeder gleicht seine Abweichung vom Crew-Schnitt aus.
  // Der Bräutigam bleibt außen vor – er spielt jedes Duell, sein Score
  // ist mit dem der Crew nicht vergleichbar.
  const cents = config?.centsPerPoint || 0
  const avg = crew.length ? crew.reduce((s, p) => s + p.score, 0) / crew.length : 0
  const settlement = cents
    ? crew.map((p) => ({ p, euro: pointsToEuro(p.score - avg, cents) }))
    : null

  return (
    <Layout subtitle="Endstand" title="Das Urteil 🏛️"
            right={loadLocal().isAdmin && (
              // Ohne diesen Link käme der Organisator nach dem Endstand
              // nicht mehr ins Admin-Panel zurück
              <Link to={`/admin/${session.id}`} className="chip bg-brand text-white">ADMIN</Link>
            )}>
      <Confetti count={60} />

      {/* Crew vs. Bräutigam Verdict */}
      <div className={`card p-6 text-center border-2 ${groomBeaten ? 'border-mint/60' : 'border-gold/60'}`}>
        <div className="text-5xl mb-2">{groomBeaten ? '💪🍺' : '👑🔥'}</div>
        <h2 className="h-display text-3xl">
          {groomBeaten
            ? `Bräutigam GESCHLAGEN! ${meter.crew}:${meter.groom}`
            : meter.crew === meter.groom
              ? `Unentschieden ${meter.crew}:${meter.groom} – Respekt!`
              : `${groom?.name || 'Der Bräutigam'} bleibt der KING! ${meter.groom}:${meter.crew}`}
        </h2>
        <p className="text-white/50 text-sm mt-2">
          {groomBeaten
            ? `${groom?.name} zahlt die nächste Runde. So will es das Gesetz.`
            : 'Die Crew zahlt die nächste Runde. Verneigt euch.'}
        </p>
      </div>

      {/* MVP */}
      {mvp && (
        <div className="card p-5 text-center">
          <p className="text-white/50 text-xs uppercase tracking-widest">MVP der Nacht</p>
          <Avatar avatar={mvp.avatar} size={80} className="mx-auto mt-2"
                  wins={stats[mvp.id]?.wins || 0} losses={stats[mvp.id]?.losses || 0} />
          <h3 className="h-display text-3xl text-mint mt-1">{mvp.name}</h3>
          <p className="text-white/60">{mvp.score} Punkte</p>
        </div>
      )}

      <Scoreboard players={players} history={history} />

      {/* Abrechnung in echtem Geld */}
      {settlement && (
        <div className="card p-4">
          <h3 className="h-display text-xl mb-1">💶 Abrechnung</h3>
          <p className="text-white/40 text-xs mb-3">
            1 Punkt = {cents} Cent · Ausgleich zum Crew-Schnitt ({Math.round(avg)} P.).
            Minus zahlt, Plus bekommt.
          </p>
          <ul className="space-y-1">
            {settlement.map(({ p, euro }) => (
              <li key={p.id} className="flex items-center justify-between bg-panel2 rounded-xl px-3 py-2">
                <span className="font-semibold text-sm truncate">{p.name}</span>
                <span className={`font-display text-xl tabular-nums ${
                  euro > 0 ? 'text-mint' : euro < 0 ? 'text-brand' : 'text-white/40'
                }`}>
                  {euro > 0 ? '+' : ''}{fmtEuro(euro)}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-white/30 text-[10px] mt-2">
            Nur eine Rechenhilfe – die App bewegt kein Geld. Summe ergibt null,
            ihr könnt es direkt untereinander ausgleichen.
          </p>
        </div>
      )}

      <div className="card p-4 text-center text-white/60 text-sm">
        Danke fürs Mitspielen – auf {groom?.name || 'den Bräutigam'}! 🍻
      </div>
    </Layout>
  )
}
