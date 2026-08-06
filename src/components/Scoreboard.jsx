import { useState } from 'react'
import Avatar from './Avatar.jsx'
import PlayerCard from './PlayerCard.jsx'
import { statsFromHistory } from '../lib/duelLogic'
import { loadLocal } from '../lib/storage'

// Zwei getrennte Wertungen: MVP-Ranking der Crew + Bräutigam-Kachel.
// Jede Zeile ist antippbar → große Spielerkarte mit Avatar & Bierzähler.
export default function Scoreboard({ players, history = [], compact = false }) {
  const [open, setOpen] = useState(null)
  const stats = statsFromHistory(history)
  const meId = loadLocal().playerId
  const groom = players.find((p) => p.is_groom)
  const crew = players.filter((p) => !p.is_groom).sort((a, b) => b.score - a.score)
  const medals = ['🥇', '🥈', '🥉']
  // Modal immer mit frischen Daten füttern (Realtime-Updates)
  const openPlayer = open ? players.find((p) => p.id === open) : null

  return (
    <div className="card p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="h-display text-xl">MVP-Ranking</h3>
        <span className="chip bg-panel2 text-white/60">{players.length} Spieler</span>
      </div>

      {groom && (
        <button onClick={() => setOpen(groom.id)}
                className="w-full flex items-center justify-between rounded-xl px-3 py-2 mb-2 bg-gold/10 border border-gold/40 active:scale-[0.99] transition">
          <span className="flex items-center gap-2 min-w-0">
            <Avatar avatar={groom.avatar} crown size={34}
                    wins={stats[groom.id]?.wins || 0} losses={stats[groom.id]?.losses || 0} />
            <span className="truncate font-semibold">{groom.name}</span>
            <span className="chip bg-gold text-ink">BRÄUTIGAM</span>
          </span>
          <span className="flex items-center gap-2">
            {(groom.beers ?? 0) > 0 && <span className="text-xs text-white/50">🍺{groom.beers}</span>}
            <span className="font-display text-2xl tabular-nums text-gold">{groom.score}</span>
          </span>
        </button>
      )}

      <ul className="space-y-1">
        {crew.map((p, i) => (
          <li key={p.id}>
            <button onClick={() => setOpen(p.id)}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-1.5 active:scale-[0.99] transition ${
                i === 0 ? 'bg-mint/10 border border-mint/40' : 'bg-panel2'
              } ${p.active === false ? 'opacity-40 line-through' : ''}`}>
              <span className="flex items-center gap-2 min-w-0">
                <span className="w-5 text-center text-sm">{medals[i] || i + 1}</span>
                <Avatar avatar={p.avatar} size={30}
                        wins={stats[p.id]?.wins || 0} losses={stats[p.id]?.losses || 0} />
                <span className="truncate font-semibold text-sm">{p.name}</span>
              </span>
              <span className="flex items-center gap-2">
                {(p.beers ?? 0) > 0 && <span className="text-xs text-white/50">🍺{p.beers}</span>}
                <span className="font-display text-xl tabular-nums">{p.score}</span>
              </span>
            </button>
          </li>
        ))}
        {crew.length === 0 && <li className="text-white/40 text-sm px-2 py-3">Noch keine Spieler.</li>}
      </ul>
      {!compact && <p className="text-white/40 text-xs mt-2">Spieler antippen für die große Karte. 🍺 zählt jeder selbst.</p>}

      {openPlayer && (
        <PlayerCard player={openPlayer} stats={stats} meId={meId} onClose={() => setOpen(null)} />
      )}
    </div>
  )
}
