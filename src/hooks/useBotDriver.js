import { useEffect, useRef } from 'react'
import { submitAnswer, placeBet, castVote, resolveDuelRpc } from '../lib/api'
import { estimatesFor, computeDuelWinner, computeEstimateWinner, majorityWinner } from '../lib/duelLogic'
import { BET_STAKES, getDiscipline } from '../lib/gameData'
import { useAnswers } from './useSession.js'

// ============================================================
//  Bot-Treiber für den Test-Modus.
//  Läuft NUR im Admin-Panel und nur für Spieler mit avatar.bot === true.
//  Damit kann der Organisator die komplette App allein durchspielen.
// ============================================================

const rnd = (min, max) => Math.round(min + Math.random() * (max - min))
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

// Plausible Ergebnisse je Disziplin
function botResult(discipline, duelId) {
  switch (discipline) {
    case 'reaction': { const ms = rnd(210, 480); return { value: String(ms), responseMs: ms } }
    case 'tap':      return { value: String(rnd(35, 85)) }
    case 'quizduel': return { value: String(rnd(150, 650)) }
    case 'memory':   return { value: String(rnd(2, 8)) }
    case 'timing':   return { value: String(rnd(80, 2400)) }
    case 'steady':   return { value: String(rnd(2500, 22000)) }
    case 'stroop':   return { value: String(rnd(6, 30)) }
    case 'typing':   return { value: String(rnd(7000, 28000)) }
    case 'math':     return { value: String(rnd(3, 16)) }
    case 'aim':      return { value: String(Math.round(rnd(30, 700) / 10) / 1) }
    case 'estimate': {
      // ungefähre Schätzungen rund um die echten Antworten
      const qs = estimatesFor(duelId)
      return { value: JSON.stringify(qs.map((q) => Math.round(q.answer * (0.4 + Math.random() * 1.2)))) }
    }
    default: return { value: String(rnd(1, 50)) }
  }
}

export function useBotDriver(session, players, enabled = true) {
  const doneRef = useRef(new Set()) // verhindert Doppel-Aktionen pro Bot & Phase
  const duel = session?.state?.duel
  const { answers } = useAnswers(session?.id, 'duell', duel?.n ?? -1)
  const { answers: votes } = useAnswers(session?.id, 'vote', duel?.n ?? -1)
  const resolvingRef = useRef(false)

  // Bot gegen Bot: Im normalen Spiel werten die Handys der Duellanten aus.
  // Im Test-Modus ist niemand davon ein echtes Gerät – also übernimmt das
  // Admin-Panel. Der RPC-Guard verhindert doppelte Wertung.
  useEffect(() => {
    if (!enabled || !session || !duel || duel.winner || duel.phase !== 'live') return
    if (resolvingRef.current) return
    const disc = getDiscipline(duel.discipline)
    const groom = players.find((p) => p.is_groom)
    let winnerId = null, detail = ''

    if (disc?.kind === 'phone') {
      const a = answers.find((x) => x.player_id === groom?.id)
      const b = answers.find((x) => x.player_id === duel.challengerId)
      if (!a || !b) return
      const res = duel.discipline === 'estimate'
        ? computeEstimateWinner(duel.id, a, b)
        : computeDuelWinner(duel.discipline, a, b)
      if (!res) return
      winnerId = res.winnerId; detail = res.detail
    } else {
      // Real-/Crowd-Duell per Mehrheit – im Test sitzt der Organisator
      // im Admin-Panel, wo die Spieleransicht nicht läuft
      const spectators = players.filter(
        (p) => p.active !== false && p.id !== groom?.id && p.id !== duel.challengerId)
      const ids = new Set(spectators.map((p) => p.id))
      const m = majorityWinner(votes.filter((v) => ids.has(v.player_id)), spectators.length)
      if (!m) return
      winnerId = m.value; detail = `Zuschauer-Vote ${m.count}/${m.total}`
    }

    resolvingRef.current = true
    resolveDuelRpc(session.id, duel.id, winnerId, detail)
      .catch(() => {})
      .finally(() => { resolvingRef.current = false })
  }, [enabled, session, players, duel, answers, votes])

  useEffect(() => {
    if (!enabled || !session) return
    const bots = players.filter((p) => p.avatar?.bot && p.active !== false)
    if (!bots.length) return

    const state = session.state || {}
    const duel = state.duel
    const task = state.task
    const groom = players.find((p) => p.is_groom)
    const timers = []

    const once = (key, delay, fn) => {
      if (doneRef.current.has(key)) return
      doneRef.current.add(key)
      timers.push(setTimeout(() => { fn().catch(() => doneRef.current.delete(key)) }, delay))
    }

    // ---- Duell ----
    if (duel && !duel.winner) {
      const duelistIds = [duel.challengerId, groom?.id]
      if (duel.phase === 'bet') {
        bots.filter((b) => !duelistIds.includes(b.id)).forEach((b, i) => {
          once(`bet-${duel.id}-${b.id}`, 700 + i * 350, () =>
            placeBet(session.id, b.id, 'bet', duel.n,
              pick([duel.challengerId, groom?.id].filter(Boolean)), pick(BET_STAKES)))
        })
      }
      if (duel.phase === 'live') {
        // Bot ist selbst Duellant → Ergebnis abgeben
        bots.filter((b) => duelistIds.includes(b.id)).forEach((b, i) => {
          once(`play-${duel.id}-${b.id}`, 1800 + i * 600, () => {
            const r = botResult(duel.discipline, duel.id)
            return submitAnswer({
              sessionId: session.id, playerId: b.id, game: 'duell',
              roundIndex: duel.n, value: r.value, responseMs: r.responseMs ?? null
            })
          })
        })
        // Nur bei real/crowd-Duellen wird gevotet – Handy-Duelle werten sich selbst
        if (getDiscipline(duel.discipline)?.kind !== 'phone') {
          bots.filter((b) => !duelistIds.includes(b.id)).forEach((b, i) => {
            once(`vote-${duel.id}-${b.id}`, 2200 + i * 400, () =>
              castVote(session.id, b.id, 'vote', duel.n,
                pick([duel.challengerId, groom?.id].filter(Boolean))))
          })
        }
      }
    }

    // ---- Bräutigam-Aufgabe ----
    if (task && !task.result) {
      const voters = bots.filter((b) => b.id !== groom?.id)
      if (task.phase === 'bet') {
        voters.forEach((b, i) => {
          once(`tbet-${task.id}-${b.id}`, 800 + i * 350, () =>
            placeBet(session.id, b.id, 'taskbet', task.n, pick(['ja', 'nein']), pick(BET_STAKES)))
        })
      }
      if (task.phase === 'live') {
        voters.forEach((b, i) => {
          once(`tvote-${task.id}-${b.id}`, 2000 + i * 400, () =>
            castVote(session.id, b.id, 'taskvote', task.n, pick(['ja', 'nein'])))
        })
      }
    }

    return () => timers.forEach(clearTimeout)
  }, [session, players, enabled])
}
