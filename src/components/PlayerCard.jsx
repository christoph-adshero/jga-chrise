import { useState } from 'react'
import Avatar from './Avatar.jsx'
import { addBeer } from '../lib/api'
import { sounds } from '../lib/sounds'
import { loadLocal } from '../lib/storage'

// Spielerkarte: Tippe irgendwo auf einen Spieler → große Ansicht mit
// Avatar, Stats und Bierzähler. Eigenes Bier zählt jeder selbst,
// der Organisator darf bei allen (auch korrigieren).
export default function PlayerCard({ player, stats, meId, onClose }) {
  const [bounce, setBounce] = useState(false)
  const isMe = player.id === meId
  const isAdmin = loadLocal().isAdmin
  const s = stats?.[player.id] || { wins: 0, losses: 0 }

  const prost = async (delta = 1) => {
    if (delta > 0) { sounds.beer(); setBounce(true); setTimeout(() => setBounce(false), 500) }
    try { await addBeer(player.id, delta) } catch {}
  }

  const titel = player.is_groom
    ? '👑 DER BRÄUTIGAM'
    : s.wins >= 2 ? '🔥 Bräutigam-Schreck'
    : (player.beers || 0) >= 5 ? '🍺 Durstlöscher'
    : s.losses >= 2 ? '💧 Pechvogel'
    : '⚔️ Herausforderer'

  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center"
         onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full sm:max-w-sm animate-sheetUp" onClick={(e) => e.stopPropagation()}>
        <div className={`card m-3 p-6 text-center border-2 ${player.is_groom ? 'border-gold/60' : 'border-line'}`}>
          <button onClick={onClose}
                  className="absolute top-5 right-5 w-9 h-9 grid place-items-center rounded-full bg-panel2 border border-line text-white/60">✕</button>

          <div className={player.is_groom ? 'inline-block rounded-full animate-glow' : 'inline-block'}>
            <Avatar avatar={player.avatar} crown={player.is_groom}
                    wins={s.wins} losses={s.losses} size={180} className="mx-auto" />
          </div>

          <h2 className="h-display text-4xl mt-3">{player.name}</h2>
          <div className="chip bg-gold/15 text-gold inline-block mt-1">{titel}</div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <Stat label="Punkte" value={player.score ?? 0} tone="text-white" />
            <Stat label="Duelle" value={`${s.wins}W · ${s.losses}L`} tone="text-mint" />
            <Stat label="Biere" value={<span className={bounce ? 'inline-block animate-beerBounce' : ''}>🍺 {player.beers ?? 0}</span>} tone="text-gold" />
          </div>

          {(isMe || isAdmin) && (
            <div className="mt-4 space-y-2">
              <button className="btn-gold w-full text-lg py-4" onClick={() => prost(1)}>
                🍻 Prost! (+1 Bier)
              </button>
              {isAdmin && !isMe && (
                <p className="text-white/30 text-xs">Du zählst als Organisator für {player.name} mit.</p>
              )}
              {isAdmin && (
                <button className="text-white/40 text-xs underline" onClick={() => prost(-1)}>
                  eins zu viel gezählt? (−1)
                </button>
              )}
            </div>
          )}
          {!isMe && !isAdmin && (
            <p className="text-white/30 text-xs mt-4">Sein Bier zählt jeder selbst. Ehrensache. 🤝</p>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, tone }) {
  return (
    <div className="bg-panel2 rounded-xl py-2.5">
      <div className={`font-display text-xl ${tone}`}>{value}</div>
      <div className="text-[10px] uppercase text-white/40">{label}</div>
    </div>
  )
}
