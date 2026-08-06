import { useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import QRShare from '../components/QRShare.jsx'
import Avatar from '../components/Avatar.jsx'
import AvatarEditor from '../components/AvatarEditor.jsx'
import { updatePlayer, setGroom } from '../lib/api'
import { CREW_SIZE } from '../lib/avatars'
import PlayerCard from '../components/PlayerCard.jsx'
import { loadLocal } from '../lib/storage'

export default function Lobby({ session, players, me }) {
  const local = loadLocal()
  const shareUrl = `${window.location.origin}/play/${session.id}`
  const readyCount = players.filter((p) => p.is_ready).length
  const groom = players.find((p) => p.is_groom)
  const hasAvatar = me.avatar && Object.keys(me.avatar).length > 0
  const [editing, setEditing] = useState(!hasAvatar)
  const [openCard, setOpenCard] = useState(null)
  const cardPlayer = openCard ? players.find((p) => p.id === openCard) : null

  const toggleReady = () => updatePlayer(me.id, { is_ready: !me.is_ready })

  return (
    <Layout
      subtitle={`Code ${session.code}`}
      title="Lobby"
      right={local.isAdmin && (
        <Link to={`/admin/${session.id}`} className="chip bg-brand text-white">ADMIN</Link>
      )}
    >
      {editing ? (
        <AvatarEditor player={me} onClose={() => setEditing(false)} />
      ) : (
        <button className="card p-3 w-full flex items-center gap-3" onClick={() => setEditing(true)}>
          <Avatar avatar={me.avatar} crown={me.is_groom} size={48} />
          <span className="text-left">
            <span className="block font-semibold">{me.name}</span>
            <span className="text-white/40 text-xs">Avatar antippen zum Bearbeiten ✏️</span>
          </span>
        </button>
      )}

      <QRShare url={shareUrl} code={session.code} />

      <div className="card p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="h-display text-xl">Crew ({players.length}/{CREW_SIZE})</h3>
          <span className="chip bg-mint/20 text-mint">{readyCount} bereit</span>
        </div>
        <ul className="space-y-2">
          {players.map((p) => (
            <li key={p.id} className="flex items-center justify-between bg-panel2 rounded-xl px-3 py-2">
              <button className="flex items-center gap-2 min-w-0 active:scale-[0.98] transition"
                      onClick={() => setOpenCard(p.id)}>
                <Avatar avatar={p.avatar} crown={p.is_groom} size={34} />
                <span className={`w-2 h-2 rounded-full shrink-0 ${p.is_ready ? 'bg-mint' : 'bg-white/20'}`} />
                <span className="font-semibold truncate">{p.name}{p.id === me.id && ' (du)'}</span>
                {p.is_groom && <span className="chip bg-gold text-ink shrink-0">BRÄUTIGAM</span>}
              </button>
              {!p.is_groom && (
                <button onClick={() => setGroom(session.id, p.id)} className="chip bg-panel text-white/60 border border-line shrink-0">
                  → Bräutigam
                </button>
              )}
            </li>
          ))}
        </ul>
        <p className="text-gold text-xs mt-2">
          {groom ? 'Bräutigam falsch? Einfach jemand anderen antippen.' : 'Tippt den Bräutigam an, um ihn zu markieren.'}
        </p>
      </div>

      {cardPlayer && (
        <PlayerCard player={cardPlayer} stats={{}} meId={me.id} onClose={() => setOpenCard(null)} />
      )}

      <button onClick={toggleReady} className={me.is_ready ? 'btn-ghost w-full' : 'btn-primary w-full text-lg'}>
        {me.is_ready ? 'Doch noch nicht bereit' : '✅ Ich bin bereit!'}
      </button>

      {/* Der Bräutigam bekommt den Plan nicht zu sehen */}
      {!me.is_groom && (
        <Link to="/plan" className="btn-gold w-full">🗺️ Plan, Adressen & Uhrzeiten</Link>
      )}

      <div className="card p-4 text-center text-white/60 text-sm">
        {readyCount === players.length && players.length >= 2 && groom
          ? '🔥 Alle bereit! Der Organisator startet jetzt die Arena.'
          : 'Sobald alle bereit sind und der Bräutigam markiert ist, geht es los. Tipp: Startet mit „Wer kennt den Bräutigam?" zum Warmwerden.'}
      </div>
    </Layout>
  )
}
