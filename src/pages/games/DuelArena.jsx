import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Scoreboard from '../../components/Scoreboard.jsx'
import Avatar from '../../components/Avatar.jsx'
import PlayerCard from '../../components/PlayerCard.jsx'
import AdminBar from '../../components/AdminBar.jsx'
import Confetti from '../../components/Confetti.jsx'
import { sounds } from '../../lib/sounds'
import EmojiReactions from '../../components/EmojiReactions.jsx'
import ReactionDuel from '../../components/minigames/ReactionDuel.jsx'
import TapSprint from '../../components/minigames/TapSprint.jsx'
import QuizDuel from '../../components/minigames/QuizDuel.jsx'
import EstimateDuel from '../../components/minigames/EstimateDuel.jsx'
import MemoryDuel from '../../components/minigames/MemoryDuel.jsx'
import TimingDuel from '../../components/minigames/TimingDuel.jsx'
import SteadyDuel from '../../components/minigames/SteadyDuel.jsx'
import StroopDuel from '../../components/minigames/StroopDuel.jsx'
import TypingDuel from '../../components/minigames/TypingDuel.jsx'
import MathDuel from '../../components/minigames/MathDuel.jsx'
import AimDuel from '../../components/minigames/AimDuel.jsx'
import { useAnswers } from '../../hooks/useSession.js'
import { useWakeLock } from '../../hooks/useWakeLock.js'
import { loadLocal } from '../../lib/storage'
import { getDiscipline, POINTS, BET_STAKES, JOKERS } from '../../lib/gameData'
import { computeDuelWinner, computeEstimateWinner, crewMeter, statsFromHistory, majorityWinner } from '../../lib/duelLogic'
import {
  submitAnswer, placeBet, castVote,
  resolveDuelRpc, resolveTaskRpc, setDuelState, appendHistory
} from '../../lib/api'

// ============================================================
//  DUELL-ARENA: Crew vs. Bräutigam
// ============================================================
export default function DuelArena({ session, players, me, config }) {
  const state = session.state || {}
  const groom = players.find((p) => p.is_groom)

  if (!groom) {
    return (
      <Layout subtitle="Duell-Arena" title="Kein Bräutigam?!">
        <div className="card p-5 text-center text-white/60">In der Lobby muss zuerst der Bräutigam markiert werden.</div>
      </Layout>
    )
  }

  if (state.duel) return <DuelView session={session} players={players} me={me} groom={groom} state={state} config={config} />
  if (state.task) return <TaskView session={session} players={players} me={me} groom={groom} state={state} config={config} />
  return <Interlude session={session} players={players} me={me} groom={groom} state={state} config={config} />
}

// ---------- Zwischenrunde ----------
function Interlude({ session, players, me, groom, state, config }) {
  const meter = crewMeter(state.history)
  const local = loadLocal()
  return (
    <Layout subtitle="Duell-Arena" title="Crew vs. Bräutigam"
            right={local.isAdmin && <Link to={`/admin/${session.id}`} className="chip bg-brand text-white">ADMIN</Link>}>
      <CrewMeter meter={meter} groom={groom} />
      <div className="card p-5 text-center">
        <div className="text-4xl mb-2">🥊</div>
        <p className="text-white/70">Nächstes Duell kommt gleich – der Organisator lost gerade aus.</p>
        {state.jokers && <JokerStatus jokers={state.jokers} />}
      </div>
      <AdminBar session={session} players={players} config={config} />
      <Scoreboard players={players} history={state.history} />
      <EmojiReactions sessionId={session.id} />
    </Layout>
  )
}

function CrewMeter({ meter, groom }) {
  const total = Math.max(1, meter.crew + meter.groom)
  return (
    <div className="card p-4">
      <div className="flex justify-between items-baseline mb-2">
        <span className="font-display text-2xl">CREW <span className="text-mint">{meter.crew}</span></span>
        <span className="text-white/40 text-xs uppercase">Duell-Siege</span>
        <span className="font-display text-2xl"><span className="text-gold">{meter.groom}</span> {groom.name.toUpperCase()}</span>
      </div>
      <div className="h-3 rounded-full bg-panel2 overflow-hidden flex">
        <div className="bg-mint h-full transition-all" style={{ width: `${(meter.crew / total) * 100}%` }} />
        <div className="bg-gold h-full transition-all" style={{ width: `${(meter.groom / total) * 100}%` }} />
      </div>
    </div>
  )
}

function JokerStatus({ jokers }) {
  return (
    <div className="flex justify-center gap-2 mt-3">
      {JOKERS.map((j) => (
        <span key={j.id} className={`chip ${jokers?.[j.id] ? 'bg-panel2 text-white/30 line-through' : 'bg-gold/20 text-gold'}`}>
          {j.icon} {j.name}
        </span>
      ))}
    </div>
  )
}

// ---------- Duell ----------
function DuelView({ session, players, me, groom, state, config }) {
  const duel = state.duel
  const disc = getDiscipline(duel.discipline)
  const challenger = players.find((p) => p.id === duel.challengerId)
  const isDuelist = me.id === groom.id || me.id === duel.challengerId
  const spectators = players.filter((p) => p.active !== false && p.id !== groom.id && p.id !== duel.challengerId)
  const spectatorIds = new Set(spectators.map((p) => p.id))
  const { answers } = useAnswers(session.id, 'duell', duel.n)
  const { answers: bets } = useAnswers(session.id, 'bet', duel.n)
  const { answers: allVotes } = useAnswers(session.id, 'vote', duel.n)
  const votes = allVotes.filter((v) => spectatorIds.has(v.player_id)) // DQ'te zählen nicht
  const resolvingRef = useRef(false)
  const [tick, setTick] = useState(0)
  // Auswerten darf jeder Duellant – und zusätzlich der Organisator.
  // Sonst bliebe ein Duell hängen, wenn beide Duellanten Bots sind (Test-Modus)
  // oder ein Duellant offline geht. Der RPC-Guard verhindert Doppelwertung.
  const mayResolve = isDuelist || loadLocal().isAdmin

  useWakeLock(duel.phase === 'live' && isDuelist && disc?.kind === 'phone')

  // Fallback-Tick: re-triggert die Auswertung, falls ein Claim-Versuch am Netz scheiterte
  useEffect(() => {
    if (duel.phase !== 'live' || duel.winner) return
    const iv = setInterval(() => setTick((t) => t + 1), 3000)
    return () => clearInterval(iv)
  }, [duel.phase, duel.winner])

  // --- Auto-Auswertung Phone-Duelle: beide Antworten da → atomarer RPC-Claim
  useEffect(() => {
    if (duel.phase !== 'live' || disc?.kind !== 'phone' || duel.winner || resolvingRef.current) return
    const a = answers.find((x) => x.player_id === groom.id)
    const b = answers.find((x) => x.player_id === duel.challengerId)
    if (!a || !b || !mayResolve) return
    resolvingRef.current = true
    const result = duel.discipline === 'estimate'
      ? computeEstimateWinner(duel.id, a, b)
      : computeDuelWinner(duel.discipline, a, b)
    if (result) {
      resolveDuelRpc(session.id, duel.id, result.winnerId, result.detail)
        .catch(() => {})
        .finally(() => { resolvingRef.current = false })
    } else {
      resolvingRef.current = false
    }
  }, [answers, duel, disc, mayResolve, groom.id, session.id, tick])

  // --- Auto-Auswertung Real/Crowd-Duelle: alle aktiven Zuschauer gevotet → Mehrheit
  useEffect(() => {
    if (duel.phase !== 'live' || disc?.kind === 'phone' || duel.winner || resolvingRef.current) return
    const m = majorityWinner(votes, spectators.length)
    if (!m) return
    resolvingRef.current = true
    resolveDuelRpc(session.id, duel.id, m.value, `Zuschauer-Vote ${m.count}/${m.total}`)
      .catch(() => {})
      .finally(() => { resolvingRef.current = false })
  }, [votes.length, duel, disc, spectators.length, session.id, tick])

  return (
    <Layout subtitle={`Duell${duel.finale ? ' · FINALE 🏆' : ''} · ${disc?.icon} ${disc?.name}`}
            title={duel.phase === 'done' ? 'Ergebnis' : `${challenger?.name} vs. ${groom.name}`}
            right={loadLocal().isAdmin && (
              <Link to={`/admin/${session.id}`} className="chip bg-brand text-white">ADMIN</Link>
            )}>
      <Matchup groom={groom} challenger={challenger} duel={duel} history={state.history} meId={me.id} />

      {/* Spielerklärung – auch schon in der Wettphase sichtbar,
          damit jeder weiß, worauf er eigentlich wettet */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{disc?.icon}</span>
          <h3 className="h-display text-xl">{disc?.name}</h3>
          <span className={`chip ml-auto ${
            disc?.kind === 'phone' ? 'bg-mint/20 text-mint'
            : disc?.kind === 'real' ? 'bg-brand/20 text-brand'
            : 'bg-gold/20 text-gold'
          }`}>
            {disc?.kind === 'phone' ? '📱 am Handy' : disc?.kind === 'real' ? '💪 in echt' : '🗳️ Publikum'}
          </span>
        </div>
        <p className="text-white/70 text-sm leading-snug">{disc?.desc}</p>
        <p className="text-white/35 text-xs mt-1.5">
          {disc?.kind === 'phone'
            ? 'Beide spielen gleichzeitig auf ihrem Handy – die App wertet automatisch aus.'
            : 'Ihr macht das in echt, danach voten die Zuschauer den Sieger.'}
        </p>
      </div>

      {duel.phase === 'bet' && (
        <BetPhase session={session} me={me} groom={groom} duel={duel} state={state}
                  challenger={challenger} bets={bets} spectators={spectators}
                  isDuelist={isDuelist} players={players} />
      )}

      {duel.phase === 'live' && (
        <LivePhase session={session} me={me} groom={groom} duel={duel} disc={disc}
                   answers={answers} votes={votes} isDuelist={isDuelist} spectators={spectators} />
      )}

      {duel.phase === 'done' && (
        <DoneCard session={session} me={me} groom={groom} duel={duel} state={state}
                  challenger={challenger} bets={bets} players={players} />
      )}

      <AdminBar session={session} players={players} config={config} />
      <EmojiReactions sessionId={session.id} />
      <Scoreboard players={players} history={state.history} compact />
    </Layout>
  )
}

function Matchup({ groom, challenger, duel, history, meId }) {
  const stats = statsFromHistory(history)
  const [open, setOpen] = useState(null)
  // Kampfansage-Sound genau einmal pro Duell
  useEffect(() => { sounds.vs() }, [duel.id])

  return (
    <div className="card p-4 flex items-center justify-around overflow-hidden">
      <div className="animate-slideInL">
        <PlayerBadge p={challenger} stats={stats} onOpen={() => setOpen(challenger)} />
      </div>
      <div className="text-center">
        <div className="font-display text-4xl text-brand animate-vsPop">VS</div>
        {duel.joker === 'double' && <div className="chip bg-gold text-ink mt-1">✨ x2 angesagt!</div>}
        {duel.handicap && <div className="chip bg-brand/20 text-brand mt-1">⚖️ {duel.handicap}</div>}
      </div>
      <div className="animate-slideInR">
        <PlayerBadge p={groom} stats={stats} crown onOpen={() => setOpen(groom)} />
      </div>
      {open && <PlayerCard player={open} stats={stats} meId={meId} onClose={() => setOpen(null)} />}
    </div>
  )
}

function PlayerBadge({ p, stats, crown = false, onOpen }) {
  if (!p) return null
  const s = stats?.[p.id] || { wins: 0, losses: 0 }
  return (
    <button className="text-center active:scale-95 transition" onClick={onOpen}>
      <Avatar avatar={p.avatar} crown={crown || p.is_groom} wins={s.wins} losses={s.losses} size={72} className="mx-auto" />
      <div className="font-semibold mt-1">{p.name}</div>
      <div className="text-white/40 text-xs">{s.wins}W · {s.losses}L{(p.beers ?? 0) > 0 ? ` · 🍺${p.beers}` : ''}</div>
    </button>
  )
}

// --- Wettphase ---
// Zeigt offen, wer auf wen gesetzt hat – erst nach der eigenen Wette,
// damit niemand einfach der Mehrheit hinterherläuft.
function BetBoard({ bets, players, challenger, groom }) {
  const side = (id) => bets
    .map((b) => { try { return { ...JSON.parse(b.value), pid: b.player_id, key: b.id } } catch { return null } })
    .filter((x) => x && x.on === id)

  const Col = ({ p, tone }) => {
    const list = side(p.id)
    const sum = list.reduce((s, x) => s + (x.stake || 0), 0)
    return (
      <div className={`rounded-xl p-2 border ${tone}`}>
        <div className="text-sm font-bold truncate">{p.name}</div>
        <div className="text-[10px] text-white/40 mb-1.5">{list.length} Wetten · {sum} P.</div>
        <div className="space-y-1">
          {list.map((x) => {
            const pl = players.find((y) => y.id === x.pid)
            return (
              <div key={x.key} className="flex items-center gap-1.5">
                <Avatar avatar={pl?.avatar} size={22} />
                <span className="text-xs truncate flex-1">{pl?.name}</span>
                <span className="text-[10px] text-gold shrink-0">{x.stake}</span>
              </div>
            )
          })}
          {!list.length && <div className="text-white/25 text-xs">niemand</div>}
        </div>
      </div>
    )
  }

  return (
    <div className="card p-3">
      <h3 className="text-sm text-white/60 mb-2">🕵️ Wer hat auf wen gesetzt?</h3>
      <div className="grid grid-cols-2 gap-2">
        <Col p={challenger} tone="border-line bg-panel2" />
        <Col p={groom} tone="border-gold/40 bg-gold/10" />
      </div>
    </div>
  )
}

function BetPhase({ session, me, groom, duel, state, challenger, bets, spectators, isDuelist, players }) {
  const finaleStake = Math.max(20, Math.floor((me.score || 0) / 2))
  const [stake, setStake] = useState(duel.finale ? finaleStake : BET_STAKES[1])
  const myBet = bets.find((b) => b.player_id === me.id)
  const isGroom = me.id === groom.id

  const bet = async (onId) => {
    if (myBet) return
    await placeBet(session.id, me.id, 'bet', duel.n, onId, duel.finale ? finaleStake : stake)
  }

  const useJoker = async (jokerId) => {
    const jokers = { ...(state.jokers || {}), [jokerId]: true }
    if (jokerId === 'veto') {
      await setDuelState(session.id, { ...state, jokers }, { ...duel, veto: true })
    } else if (jokerId === 'double') {
      await setDuelState(session.id, { ...state, jokers }, { ...duel, joker: 'double' })
    } else if (jokerId === 'handicap') {
      const text = window.prompt('Welches Handicap bekommt dein Herausforderer? (z.B. "nur linke Hand")')
      if (!text) return
      await setDuelState(session.id, { ...state, jokers }, { ...duel, handicap: text })
    }
  }

  return (
    <div className="space-y-3">
      {duel.veto && (
        <div className="card p-4 text-center text-gold animate-pop">
          🚫 <b>VETO!</b> {groom.name} lehnt die Disziplin ab – der Organisator wählt neu.
        </div>
      )}

      {/* Zuschauer wetten (DQ'te nicht) */}
      {!isDuelist && me.active !== false && (
        <div className="card p-4 space-y-3">
          <h3 className="h-display text-xl">{duel.finale ? '🎰 Alles oder Nichts!' : '💰 Deine Wette'}</h3>
          {duel.finale
            ? <p className="text-white/60 text-sm">Finale! Dein Einsatz ist fix: <b className="text-gold">{finaleStake} Punkte</b> (50% deines Scores). Wähle deine Seite!</p>
            : <p className="text-white/60 text-sm">Wer gewinnt? Richtig = +Einsatz · Falsch = −Einsatz.</p>}
          {!duel.finale && !myBet && (
            <div className="flex gap-2 justify-center">
              {BET_STAKES.map((s) => (
                <button key={s} onClick={() => setStake(s)}
                  className={`chip px-4 py-2 ${stake === s ? 'bg-gold text-ink' : 'bg-panel2 border border-line'}`}>{s} P.</button>
              ))}
            </div>
          )}
          {myBet ? (
            <p className="text-mint text-center font-semibold">
              Deine Wette: {JSON.parse(myBet.value).stake} P. auf {players_name(session, myBet, challenger, groom)} ✓
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-ghost" onClick={() => bet(challenger.id)}>{challenger.name} 💪</button>
              <button className="btn-gold" onClick={() => bet(groom.id)}>{groom.name} 👑</button>
            </div>
          )}
          <p className="text-white/30 text-xs text-center">{bets.length}/{spectators.length} Wetten platziert</p>
        </div>
      )}

      {/* Offene Wetten: Duellanten sehen sie sofort, Zuschauer nach der eigenen Wette */}
      {(isDuelist || myBet) && bets.length > 0 && challenger && (
        <BetBoard bets={bets} players={players} challenger={challenger} groom={groom} />
      )}

      {/* Duellanten bereiten sich vor */}
      {isDuelist && !isGroom && (
        <div className="card p-4 text-center text-white/70">🔥 Mach dich bereit – die Zuschauer wetten gerade.</div>
      )}

      {/* Bräutigam-Joker */}
      {isGroom && (
        <div className="card p-4 space-y-2">
          <h3 className="h-display text-xl">👑 Deine Joker</h3>
          <div className="grid gap-2">
            {JOKERS.map((j) => (
              <button key={j.id} disabled={state.jokers?.[j.id] || duel.veto}
                onClick={() => useJoker(j.id)} className="btn-ghost justify-start text-left text-sm">
                <span className="text-lg">{j.icon}</span>
                <span><b>{j.name}</b> – {j.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-white/40 text-sm">Der Organisator startet das Duell, sobald alle bereit sind.</p>
    </div>
  )
}

function players_name(session, bet, challenger, groom) {
  const on = JSON.parse(bet.value).on
  return on === groom.id ? groom.name : challenger?.name || '—'
}

// --- Live-Phase ---
function LivePhase({ session, me, groom, duel, disc, answers, votes, isDuelist, spectators }) {
  const myAnswer = answers.find((a) => a.player_id === me.id)
  const myVote = votes.find((v) => v.value && v.player_id === me.id)
  const challengerId = duel.challengerId

  const finish = async ({ value, responseMs }) => {
    await submitAnswer({
      sessionId: session.id, playerId: me.id, game: 'duell',
      roundIndex: duel.n, value, responseMs: responseMs ?? null
    })
  }

  // Duellant + Phone-Game
  if (isDuelist && disc.kind === 'phone') {
    if (myAnswer) {
      return <div className="card p-5 text-center text-mint font-semibold">Abgegeben ✓ – warte auf deinen Gegner… <br />
        <span className="text-white/40 text-sm font-normal">({answers.length}/2 fertig)</span></div>
    }
    const props = { duelId: duel.id, onFinish: finish }
    switch (duel.discipline) {
      case 'reaction': return <ReactionDuel {...props} />
      case 'tap':      return <TapSprint {...props} seconds={disc.seconds} />
      case 'quizduel': return <QuizDuel {...props} seconds={disc.seconds} />
      case 'estimate': return <EstimateDuel {...props} />
      case 'memory':   return <MemoryDuel {...props} />
      case 'timing':   return <TimingDuel {...props} target={disc.target} />
      case 'steady':   return <SteadyDuel {...props} />
      case 'stroop':   return <StroopDuel {...props} seconds={disc.seconds} />
      case 'typing':   return <TypingDuel {...props} />
      case 'math':     return <MathDuel {...props} seconds={disc.seconds} />
      case 'aim':      return <AimDuel {...props} />
      default:         return null
    }
  }

  // Real-/Crowd-Duell: Anleitung + Zuschauer-Voting
  if (disc.kind !== 'phone') {
    return (
      <div className="space-y-3">
        {duel.handicap && (
          <div className="card p-3 text-center text-brand text-sm">⚖️ Handicap: {duel.handicap}</div>
        )}
        {!isDuelist && me.active !== false && (
          <div className="card p-4 space-y-2">
            <h3 className="h-display text-xl">Wer hat gewonnen?</h3>
            {myVote ? (
              <p className="text-mint text-center font-semibold">Gevotet ✓ ({votes.length}/{spectators.length})</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-ghost" onClick={() => castVote(session.id, me.id, 'vote', duel.n, challengerId)}>Herausforderer 💪</button>
                <button className="btn-gold" onClick={() => castVote(session.id, me.id, 'vote', duel.n, groom.id)}>Bräutigam 👑</button>
              </div>
            )}
            <p className="text-white/30 text-xs text-center">Mehrheit entscheidet automatisch. Gleichstand → Organisator.</p>
          </div>
        )}
        {isDuelist && <div className="card p-4 text-center text-white/70">⚔️ Kämpft! Die Zuschauer werten euch danach.</div>}
      </div>
    )
  }

  // Zuschauer bei Phone-Duell
  return (
    <div className="card p-5 text-center">
      <div className="text-4xl mb-2 animate-pulse">📱⚡📱</div>
      <p className="text-white/70">Duell läuft auf den Handys der beiden…</p>
      <p className="text-white/40 text-sm mt-2">{answers.length}/2 haben abgegeben</p>
    </div>
  )
}

// --- Ergebnis ---
function DoneCard({ session, me, groom, duel, state, challenger, bets, players }) {
  const winner = players.find((p) => p.id === duel.winner)
  const groomWon = duel.winner === groom.id
  const local = loadLocal()
  const myBet = bets.find((b) => b.player_id === me.id)
  let betResult = null
  if (myBet) {
    const parsed = JSON.parse(myBet.value)
    betResult = parsed.on === duel.winner ? `+${parsed.stake}` : `−${parsed.stake}`
  }
  const pts = duel.finale ? POINTS.duelWinFinale : (duel.joker === 'double' && groomWon ? POINTS.duelWin * 2 : POINTS.duelWin)
  const iWon = duel.winner === me.id
  const betWon = betResult?.startsWith('+')

  // Sound genau einmal pro Ergebnis: Fanfare für Sieger & Gewinner-Wetten,
  // Wah-wah für verlorene Wetten
  useEffect(() => {
    if (iWon || betWon) sounds.win()
    else if (betResult) sounds.lose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duel.id])

  return (
    <div className="space-y-3">
      {(iWon || betWon) && <Confetti />}
      <div className={`card p-6 text-center animate-winPop border-2 ${groomWon ? 'border-gold/60' : 'border-mint/50'}`}>
        <div className="inline-block rounded-full animate-glow">
          <Avatar avatar={winner?.avatar} crown={groomWon} size={130} className="mx-auto" />
        </div>
        <h2 className="h-display text-4xl mt-3">{winner?.name} gewinnt! {groomWon ? '👑' : '💪'}</h2>
        <p className="text-white/50 text-sm">{duel.detail?.detail || duel.detail || ''}</p>
        <p className="text-gold font-display text-3xl mt-2 animate-pop">+{pts}</p>
        {!groomWon && <p className="text-white/40 text-xs">{groom.name} bekommt +{POINTS.groomTrost} Trostpunkte</p>}
        {betResult && (
          <p className={`mt-2 font-semibold ${betWon ? 'text-mint' : 'text-brand'}`}>
            Deine Wette: {betResult} Punkte {betWon ? '🎉' : '😬'}
          </p>
        )}
        {!groomWon && (
          <p className="chip bg-brand/15 text-brand mt-3 inline-block">🍺 {groom.name} trinkt!</p>
        )}
        {groomWon && duel.challengerId && (
          <p className="chip bg-brand/15 text-brand mt-3 inline-block">🍺 {challenger?.name} trinkt!</p>
        )}
      </div>
    </div>
  )
}


// ---------- Bräutigam-Aufgabe (Glücksrad) ----------
function TaskView({ session, players, me, groom, state, config }) {
  const task = state.task
  const t = (config.tasks || [])[task.index]
  const isGroom = me.id === groom.id
  const voters = players.filter((p) => p.active !== false && p.id !== groom.id)
  const voterIds = new Set(voters.map((p) => p.id))
  const { answers: allTaskBets } = useAnswers(session.id, 'taskbet', task.n)
  const { answers: allTaskVotes } = useAnswers(session.id, 'taskvote', task.n)
  const taskBets = allTaskBets.filter((b) => voterIds.has(b.player_id)) // DQ'te zählen nicht
  const taskVotes = allTaskVotes.filter((v) => voterIds.has(v.player_id))
  const resolvingRef = useRef(false)
  const [spinDone, setSpinDone] = useState(task.phase !== 'bet')
  const [tick, setTick] = useState(0)
  const myBet = taskBets.find((b) => b.player_id === me.id)
  const myVote = taskVotes.find((v) => v.player_id === me.id)
  const [stake, setStake] = useState(BET_STAKES[0])

  useEffect(() => {
    const id = setTimeout(() => setSpinDone(true), 1800)
    return () => clearTimeout(id)
  }, [])

  // Fallback-Tick gegen hängende Claims (Netzfehler)
  useEffect(() => {
    if (task.phase !== 'live' || task.result) return
    const iv = setInterval(() => setTick((x) => x + 1), 3000)
    return () => clearInterval(iv)
  }, [task.phase, task.result])

  // Auto-Auswertung: alle aktiven gevotet → Mehrheit, atomarer RPC
  useEffect(() => {
    if (task.phase !== 'live' || task.result || resolvingRef.current) return
    const m = majorityWinner(taskVotes, voters.length)
    if (!m) return
    resolvingRef.current = true
    resolveTaskRpc(session.id, task.id, m.value === 'ja' ? 'success' : 'fail')
      .catch(() => {})
      .finally(() => { resolvingRef.current = false })
  }, [taskVotes.length, task, voters.length, session.id, tick])

  if (!t) return null

  return (
    <Layout subtitle="Bräutigam-Glücksrad" title={isGroom ? 'DEINE Aufgabe 👑' : `${groom.name} muss ran!`}>
      {!spinDone ? (
        <div className="card p-8 text-center">
          <div className="text-6xl animate-spin" style={{ animationDuration: '0.5s' }}>🎡</div>
          <p className="text-white/50 mt-3">Das Rad dreht sich…</p>
        </div>
      ) : (
        <div className="card p-5 text-center animate-pop">
          <div className="text-5xl mb-2">{t.icon}</div>
          <p className="text-lg font-bold leading-snug">{t.task}</p>
          <p className="text-gold text-sm mt-2">Geschafft = +{POINTS.taskSuccess} P. für {groom.name}</p>
        </div>
      )}

      {task.phase === 'bet' && spinDone && !isGroom && me.active !== false && (
        <div className="card p-4 space-y-3">
          <h3 className="h-display text-xl">💰 Schafft er's?</h3>
          {myBet ? (
            <p className="text-mint text-center font-semibold">Wette platziert ✓ ({taskBets.length}/{voters.length})</p>
          ) : (
            <>
              <div className="flex gap-2 justify-center">
                {BET_STAKES.map((s) => (
                  <button key={s} onClick={() => setStake(s)}
                    className={`chip px-4 py-2 ${stake === s ? 'bg-gold text-ink' : 'bg-panel2 border border-line'}`}>{s} P.</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-gold" onClick={() => placeBet(session.id, me.id, 'taskbet', task.n, 'ja', stake)}>Schafft er! ✅</button>
                <button className="btn-ghost" onClick={() => placeBet(session.id, me.id, 'taskbet', task.n, 'nein', stake)}>Niemals 😈</button>
              </div>
            </>
          )}
          <p className="text-white/30 text-xs text-center">Der Organisator gibt die Aufgabe frei, dann läuft sie.</p>
        </div>
      )}

      {task.phase === 'bet' && isGroom && spinDone && (
        <div className="card p-4 text-center text-white/70">Die Crew wettet gerade auf dich… 😏 Gleich geht's los.</div>
      )}

      {task.phase === 'live' && !isGroom && me.active !== false && (
        <div className="card p-4 space-y-2">
          <h3 className="h-display text-xl">Deine Wertung</h3>
          {myVote ? (
            <p className="text-mint text-center font-semibold">Gewertet ✓ ({taskVotes.length}/{voters.length})</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-primary" onClick={() => castVote(session.id, me.id, 'taskvote', task.n, 'ja')}>Geschafft ✅</button>
              <button className="btn-ghost" onClick={() => castVote(session.id, me.id, 'taskvote', task.n, 'nein')}>Verkackt ❌</button>
            </div>
          )}
          <p className="text-white/30 text-xs text-center">Mehrheit entscheidet. Erst werten, wenn's vorbei ist!</p>
        </div>
      )}

      {task.phase === 'live' && isGroom && (
        <div className="card p-4 text-center text-gold font-semibold animate-pulseRing rounded-2xl">
          GO GO GO! Die Crew wertet dich live. 🔥
        </div>
      )}

      {task.phase === 'done' && (
        <TaskDone session={session} state={state} task={task} groom={groom} me={me} taskBets={taskBets} />
      )}

      <AdminBar session={session} players={players} config={config} />
      <EmojiReactions sessionId={session.id} />
      <Scoreboard players={players} history={state.history} compact />
    </Layout>
  )
}

function TaskDone({ session, state, task, groom, me, taskBets }) {
  const success = task.result === 'success'
  const local = loadLocal()
  const myBet = taskBets.find((b) => b.player_id === me.id)
  let betResult = null
  if (myBet) {
    const parsed = JSON.parse(myBet.value)
    betResult = parsed.on === (success ? 'ja' : 'nein') ? `+${parsed.stake}` : `−${parsed.stake}`
  }
  return (
    <div className="space-y-3">
      {success && me.id === groom.id && <Confetti />}
      <div className={`card p-5 text-center animate-pop ${success ? 'border-mint/50' : 'border-brand/50'}`}>
        <div className="text-5xl mb-1">{success ? '✅👑' : '❌🍺'}</div>
        <h2 className="h-display text-2xl">{success ? `${groom.name} hat geliefert! +${POINTS.taskSuccess} P.` : `Verkackt! ${groom.name} trinkt.`}</h2>
        {betResult && (
          <p className={`mt-1 font-semibold ${betResult.startsWith('+') ? 'text-mint' : 'text-brand'}`}>Deine Wette: {betResult} Punkte</p>
        )}
      </div>
    </div>
  )
}

