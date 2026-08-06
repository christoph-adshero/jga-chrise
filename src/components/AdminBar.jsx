import { useState } from 'react'
import { Link } from 'react-router-dom'
import { loadLocal } from '../lib/storage'
import {
  setDuelState, updateSession, appendHistory, resolveDuelRpc, resolveTaskRpc
} from '../lib/api'
import {
  DISCIPLINES, CONTEXTS, disciplineFits, getDiscipline
} from '../lib/gameData'
import { drawChallenger, drawDiscipline } from '../lib/duelLogic'
import DisciplineBoard from './DisciplineBoard.jsx'

// ============================================================
//  Organisator-Steuerung direkt in der Spieleransicht.
//  Zeigt immer nur den EINEN Knopf, der gerade dran ist –
//  kein Wechsel mehr ins Admin-Panel für den normalen Ablauf.
// ============================================================
const uid = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`

export default function AdminBar({ session, players, config }) {
  const [open, setOpen] = useState(false)
  if (!loadLocal().isAdmin) return null

  const state = session.state || {}
  const duel = state.duel
  const task = state.task
  const groom = players.find((p) => p.is_groom)
  const crew = players.filter((p) => !p.is_groom && p.active !== false)
  const context = state.context || 'bar'
  const nextN = () => (state.counter || 0) + 1

  const openDuel = (challengerId, disciplineId, finale = false) => {
    if (!challengerId || !disciplineId) return
    const n = nextN()
    setDuelState(session.id, { ...state, counter: n, context }, {
      id: uid(), n, challengerId, discipline: disciplineId,
      phase: 'bet', winner: null, finale
    })
  }

  const draw = () => openDuel(
    drawChallenger(crew, state.history)?.id,
    drawDiscipline(DISCIPLINES, context, state.history, disciplineFits)?.id
  )

  const spinWheel = () => {
    const used = new Set((state.history || []).filter((h) => h.type === 'task').map((h) => h.index))
    const avail = (config.tasks || []).map((_, i) => i).filter((i) => !used.has(i))
    if (!avail.length) return
    const n = nextN()
    updateSession(session.id, {
      state: { ...state, counter: n, duel: null,
               task: { id: uid(), n, index: avail[Math.floor(Math.random() * avail.length)], phase: 'bet', result: null } }
    })
  }

  const setContext = (ctx) => updateSession(session.id, { state: { ...state, context: ctx } })

  const Wrap = ({ children, hint }) => (
    <div className="card p-3 border-brand/40 space-y-2">
      <div className="flex items-center justify-between">
        <span className="chip bg-brand text-white">ORGANISATOR</span>
        <Link to={`/admin/${session.id}`} className="text-white/40 text-xs underline">Alle Einstellungen</Link>
      </div>
      {hint && <p className="text-white/50 text-xs">{hint}</p>}
      {children}
    </div>
  )

  // ---------- Bräutigam-Aufgabe läuft ----------
  if (task) {
    if (task.phase === 'bet') {
      return (
        <Wrap hint="Die Crew wettet, ob er es schafft.">
          <button className="btn-primary w-full py-4 text-lg"
                  onClick={() => updateSession(session.id, { state: { ...state, task: { ...task, phase: 'live' } } })}>
            ▶️ Aufgabe freigeben
          </button>
        </Wrap>
      )
    }
    if (task.phase === 'live') {
      return (
        <Wrap hint="Die Crew wertet per Mehrheit. Du kannst überstimmen:">
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-primary" onClick={() => resolveTaskRpc(session.id, task.id, 'success').catch(() => {})}>✅ Geschafft</button>
            <button className="btn-ghost" onClick={() => resolveTaskRpc(session.id, task.id, 'fail').catch(() => {})}>❌ Verkackt</button>
          </div>
        </Wrap>
      )
    }
    return (
      <Wrap>
        <button className="btn-primary w-full py-4 text-lg"
                onClick={() => appendHistory(session.id, state, { type: 'task', index: task.index, result: task.result }, 'task')}>
          Weiter →
        </button>
      </Wrap>
    )
  }

  // ---------- Duell läuft ----------
  if (duel) {
    const disc = getDiscipline(duel.discipline)
    const challenger = players.find((p) => p.id === duel.challengerId)

    if (duel.veto) {
      return (
        <Wrap hint="🚫 Veto! Neue Disziplin auslosen:">
          <button className="btn-primary w-full py-4"
                  onClick={() => setDuelState(session.id, state, {
                    ...duel, id: uid(), veto: false,
                    discipline: drawDiscipline(DISCIPLINES, context, state.history, disciplineFits)?.id
                  })}>
            🎲 Neue Disziplin
          </button>
        </Wrap>
      )
    }
    if (duel.phase === 'bet') {
      return (
        <Wrap hint="Wenn alle getippt haben, gib das Duell frei.">
          <button className="btn-primary w-full py-5 text-xl" onClick={() => setDuelState(session.id, state, { ...duel, phase: 'live' })}>
            🔫 Duell freigeben
          </button>
          <button className="text-white/40 text-xs underline w-full"
                  onClick={() => setDuelState(session.id, state, null)}>
            Duell abbrechen
          </button>
        </Wrap>
      )
    }
    if (duel.phase === 'live') {
      return (
        <Wrap hint={disc?.kind === 'phone'
          ? 'Wertet sich automatisch aus, sobald beide fertig sind.'
          : 'Die Zuschauer werten per Mehrheit. Notfalls selbst entscheiden:'}>
          {!open && disc?.kind === 'phone' ? (
            <button className="text-white/40 text-xs underline w-full" onClick={() => setOpen(true)}>
              Hängt etwas? Manuell werten
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-ghost text-sm"
                      onClick={() => resolveDuelRpc(session.id, duel.id, duel.challengerId, 'Organisator-Entscheidung').catch(() => {})}>
                🏆 {challenger?.name}
              </button>
              <button className="btn-gold text-sm"
                      onClick={() => resolveDuelRpc(session.id, duel.id, groom.id, 'Organisator-Entscheidung').catch(() => {})}>
                🏆 {groom?.name}
              </button>
            </div>
          )}
        </Wrap>
      )
    }
    // Ergebnis steht
    return (
      <Wrap>
        <button className="btn-primary w-full py-5 text-xl"
                onClick={() => appendHistory(session.id, state, {
                  type: 'duel', discipline: duel.discipline, challengerId: duel.challengerId,
                  groomId: groom.id, winner: duel.winner, finale: !!duel.finale
                })}>
          Weiter →
        </button>
      </Wrap>
    )
  }

  // ---------- Pause: nächstes Duell auslosen ----------
  const mvp = [...crew].sort((a, b) => b.score - a.score)[0]
  return (
    <Wrap hint="Wo seid ihr gerade? Das bestimmt, welche Spiele ausgelost werden.">
      <div className="grid grid-cols-3 gap-1.5">
        {CONTEXTS.map((c) => (
          <button key={c.id} onClick={() => setContext(c.id)}
            className={`rounded-xl py-1.5 text-center border text-[11px] ${
              context === c.id ? 'bg-brand/20 border-brand' : 'bg-panel2 border-line'
            }`}>
            <div className="text-base">{c.icon}</div>{c.label}
          </button>
        ))}
      </div>

      <button className="btn-primary w-full py-5 text-xl" onClick={draw}>
        🎲 Nächstes Duell auslosen
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button className="btn-ghost text-sm" onClick={spinWheel}>🎡 Glücksrad</button>
        <button className="btn-gold text-sm" disabled={!mvp}
                onClick={() => openDuel(mvp?.id, drawDiscipline(DISCIPLINES, context, [], disciplineFits)?.id, true)}>
          🏆 Finale
        </button>
      </div>

      {/* Spiel selbst aussuchen – nötig für Padel, praktisch für alles andere */}
      <DisciplineBoard history={state.history} context={context}
                       onPick={(id) => openDuel(drawChallenger(crew, state.history)?.id, id)} />
    </Wrap>
  )
}
