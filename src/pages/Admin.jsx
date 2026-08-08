import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import Scoreboard from '../components/Scoreboard.jsx'
import Avatar from '../components/Avatar.jsx'
import { useSession, useAnswers } from '../hooks/useSession.js'
import {
  updateSession, updatePlayer, deletePlayer, addPoints, setDuelState, appendHistory,
  resolveDuelRpc, resolveTaskRpc, addTestPlayers, removeTestPlayers
} from '../lib/api'
import { useBotDriver } from '../hooks/useBotDriver.js'
import { withGroomName, defaultConfig, DISCIPLINES, JOKERS, CONTEXTS, disciplineFits, getDiscipline } from '../lib/gameData.js'
import { crewMeter, drawChallenger, drawDiscipline, duelCounts } from '../lib/duelLogic.js'
import { ADMIN_PIN } from '../lib/supabase'

const uid = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`

export default function Admin() {
  const { sessionId } = useParams()
  const { session, players, refresh } = useSession(sessionId)
  const [pin, setPin] = useState('')
  const [authed, setAuthed] = useState(false)

  if (!session) {
    return <Layout title="Admin"><div className="card p-6 text-center text-white/60">Lädt…</div></Layout>
  }

  if (!authed) {
    return (
      <Layout subtitle={session.code} title="Admin-Login">
        <div className="card p-5 space-y-3">
          <p className="text-white/60 text-sm">PIN eingeben (Standard in <code>.env</code>: VITE_ADMIN_PIN).</p>
          <input className="input tracking-[0.4em] text-center" inputMode="numeric" type="password"
                 value={pin} onChange={(e) => setPin(e.target.value)} placeholder="••••" />
          <button className="btn-primary w-full" onClick={() => setAuthed(pin === ADMIN_PIN)}>Einloggen</button>
          {pin && pin !== ADMIN_PIN && <p className="text-brand text-sm">Falscher PIN.</p>}
          <Link to={`/play/${session.id}`} className="block text-center text-white/40 text-sm">← Zur Spieleransicht</Link>
        </div>
      </Layout>
    )
  }

  return <AdminPanel session={session} players={players} refresh={refresh} />
}

function AdminPanel({ session, players, refresh }) {
  const state = session.state || {}
  const config = withGroomName(session.config || defaultConfig, session.config?.groomName)
  const groom = players.find((p) => p.is_groom)
  const crew = players.filter((p) => !p.is_groom && p.active !== false)
  const meter = crewMeter(state.history)
  const [groomName, setGroomName] = useState(session.config?.groomName || '')
  const [cents, setCents] = useState(session.config?.centsPerPoint ?? 0)
  const [saved, setSaved] = useState(false)
  const bots = players.filter((p) => p.avatar?.bot)

  // Im Test-Modus spielen, wetten und voten die Bots automatisch mit
  useBotDriver(session, players, bots.length > 0)

  const set = (patch) => updateSession(session.id, patch)

  const saveConfig = async () => {
    await updateSession(session.id, {
      config: { ...(session.config || defaultConfig), groomName, centsPerPoint: Number(cents) || 0 }
    })
    setSaved(true); setTimeout(() => setSaved(false), 1500)
  }

  const loadTestCrew = async () => {
    const added = await addTestPlayers(session.id, players)
    // Ohne markierten Bräutigam läuft die Arena nicht – im Test automatisch setzen
    if (!groom) {
      const all = [...players, ...added]
      const chrise = all.find((p) => /chrise/i.test(p.name)) || all[0]
      if (chrise) await updatePlayer(chrise.id, { is_groom: true })
    }
  }

  return (
    <Layout subtitle={`Admin · Code ${session.code}`} title="Kommandozentrale"
            right={<Link to={`/play/${session.id}`} className="chip bg-panel2 text-white/60 border border-line">Spieleransicht</Link>}>

      {/* Status */}
      <div className="card p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Status" value={session.status} />
          <Stat label="Modus" value={session.current_game || 'Pause'} />
          <Stat label="Crew : Groom" value={`${meter.crew} : ${meter.groom}`} />
        </div>
      </div>

      {/* Modus-Wahl */}
      <div className="card p-4 space-y-2">
        <h3 className="h-display text-xl">Modus</h3>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-ghost" onClick={() => set({ status: 'lobby', current_game: null })}>🏠 Lobby</button>
          <button className="btn-ghost" onClick={() => set({ status: 'playing', current_game: null })}>⏸ Pause</button>
          <button className="btn-primary col-span-2" onClick={() => set({ status: 'playing', current_game: 'duell' })}>🥊 Schlag den Bräutigam</button>
          <button className="btn-gold col-span-2" onClick={() => set({ status: 'finished' })}>🏛️ Endstand & Urteil</button>
        </div>
        <p className="text-white/35 text-xs">
          Endstand erst ganz zum Schluss – nach dem Finale. Er beendet den Abend und zeigt
          Sieger, MVP und Abrechnung. Ihr kommt jederzeit hierher zurück und könnt
          weiterspielen, es geht also nichts kaputt.
        </p>
      </div>

      {/* Arena-Steuerung */}
      {session.current_game === 'duell' && !groom && (
        <div className="card p-4 text-center text-brand">⚠️ Erst in der Lobby den Bräutigam markieren!</div>
      )}
      {session.current_game === 'duell' && groom && (
        state.duel
          ? <DuelControls session={session} state={state} players={players} groom={groom} />
          : state.task
            ? <TaskControls session={session} state={state} groom={groom} config={config} />
            : <ArenaSetup session={session} state={state} groom={groom} crew={crew} config={config} />
      )}

      {/* Joker-Status */}
      <div className="card p-4">
        <h3 className="h-display text-xl mb-2">👑 Bräutigam-Joker</h3>
        <div className="flex gap-2">
          {JOKERS.map((j) => (
            <span key={j.id} className={`chip ${state.jokers?.[j.id] ? 'bg-panel2 text-white/30 line-through' : 'bg-gold/20 text-gold'}`}>
              {j.icon} {j.name}
            </span>
          ))}
        </div>
      </div>

      {/* Spieler */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="h-display text-xl">Spieler verwalten</h3>
          <button className="chip bg-mint/20 text-mint"
                  onClick={() => players.filter((p) => !p.is_ready)
                    .forEach((p) => updatePlayer(p.id, { is_ready: true }))}>
            ✅ Alle bereit
          </button>
        </div>
        <ul className="space-y-2">
          {players.map((p) => {
            // Wer gerade im laufenden Duell steht, darf nicht verschwinden –
            // sonst hängt das Duell ohne Gegner fest.
            const imDuell = state.duel && !state.duel.winner &&
              (p.id === state.duel.challengerId || p.is_groom)
            const gespielt = (state.history || []).some(
              (h) => h.challengerId === p.id || h.winner === p.id)

            const entfernen = () => {
              const warnung = gespielt
                ? `\n\nACHTUNG: ${p.name} hat schon gespielt. Seine Duelle bleiben in der Historie stehen, seine Punkte sind weg.`
                : ''
              if (!window.confirm(`${p.name} endgültig aus der Runde entfernen?${warnung}`)) return
              // Supabase liefert bei DELETE nur den Primärschlüssel, der
              // session_id-Filter im Realtime-Kanal greift dann nicht –
              // also selbst nachladen statt aufs Event zu warten.
              deletePlayer(p.id)
                .then(() => refresh?.())
                .catch((e) => window.alert(`Hat nicht geklappt: ${e.message}`))
            }

            return (
              <li key={p.id} className="flex items-center justify-between bg-panel2 rounded-xl px-3 py-2">
                {/* Punkt antippen = für ihn „bereit" melden, falls einer nicht
                    an sein Handy geht oder gar keins dabeihat */}
                <button className={`flex items-center gap-2 font-semibold text-left ${p.active === false ? 'line-through opacity-50' : ''}`}
                        title={p.is_ready ? 'Bereit – antippen zum Zurücknehmen' : 'Für ihn „bereit" melden'}
                        onClick={() => updatePlayer(p.id, { is_ready: !p.is_ready })}>
                  <Avatar avatar={p.avatar} crown={p.is_groom} size={28} />
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${p.is_ready ? 'bg-mint' : 'bg-white/20'}`} />
                  {p.name} <span className="text-white/40 font-normal">({p.score})</span>
                </button>
                <span className="flex items-center gap-1">
                  <button className="chip bg-panel border border-line" onClick={() => addPoints(p.id, -25)}>−25</button>
                  <button className="chip bg-panel border border-line" onClick={() => addPoints(p.id, 25)}>+25</button>
                  <button className="chip bg-gold/20 text-gold" title="Cartoon-Avatar-URL setzen"
                    onClick={() => {
                      const url = window.prompt(`Cartoon-Avatar-URL für ${p.name} (leer = entfernen):`, p.avatar?.imageUrl || '')
                      if (url === null) return
                      updatePlayer(p.id, { avatar: { ...(p.avatar || {}), imageUrl: url.trim() || undefined } })
                    }}>🏎️</button>
                  <button className="chip bg-brand/20 text-brand" onClick={() => updatePlayer(p.id, { active: p.active === false })}>
                    {p.active === false ? 'Zurück' : 'DQ'}
                  </button>
                  <button className="chip bg-panel border border-line disabled:opacity-25"
                          disabled={imDuell} onClick={entfernen}
                          title={imDuell ? 'Steht im laufenden Duell' : 'Spieler löschen'}>🗑</button>
                </span>
              </li>
            )
          })}
        </ul>
        <p className="text-white/35 text-xs mt-2">
          Namen antippen meldet ihn bereit (grüner Punkt) – praktisch, wenn einer
          nicht ans Handy geht. 🗑 löscht endgültig, für Doppelanmeldungen.
          Wer nur kurz weg ist (Klo, Taxi), bekommt DQ und kann zurückgeholt werden.
        </p>
      </div>

      {/* Test-Modus */}
      <div className="card p-4 space-y-2 border-gold/30">
        <h3 className="h-display text-xl">🧪 Test-Modus</h3>
        {bots.length === 0 ? (
          <>
            <p className="text-white/50 text-sm">
              Füllt die Runde mit Testspielern auf. Die spielen, wetten und voten
              automatisch mit – du kannst also alles allein durchprobieren.
            </p>
            <button className="btn-gold w-full" onClick={loadTestCrew}>Test-Crew laden</button>
          </>
        ) : (
          <>
            <p className="text-mint text-sm">
              🤖 {bots.length} Testspieler aktiv – sie reagieren automatisch.
              Starte einfach ein Duell.
            </p>
            <button className="btn-ghost w-full" onClick={() => removeTestPlayers(session.id)}>
              Testspieler entfernen
            </button>
          </>
        )}
      </div>

      {/* Konfiguration */}
      <div className="card p-4 space-y-3">
        <h3 className="h-display text-xl">Setup</h3>
        <label className="block">
          <span className="text-sm text-white/60">Name des Bräutigams (ersetzt [BRÄUTIGAM] überall)</span>
          <input className="input mt-1" value={groomName} onChange={(e) => setGroomName(e.target.value)} placeholder="z.B. Max" />
        </label>
        <label className="block">
          <span className="text-sm text-white/60">Wetteinsatz in echtem Geld: Cent pro Punkt (0 = aus)</span>
          <input className="input mt-1" type="number" inputMode="numeric" min="0" max="100"
                 value={cents} onChange={(e) => setCents(e.target.value)} placeholder="z.B. 1" />
        </label>
        {Number(cents) > 0 && (
          <p className="text-gold text-xs">
            Beispiel: Duellsieg (250 P.) = {((250 * cents) / 100).toFixed(2).replace('.', ',')} € ·
            Wetteinsatz 100 P. = {((100 * cents) / 100).toFixed(2).replace('.', ',')} €.
            Am Ende zeigt die App eine Abrechnung.
          </p>
        )}
        <button className="btn-primary w-full" onClick={saveConfig}>{saved ? 'Gespeichert ✓' : 'Speichern'}</button>
        <p className="text-white/30 text-xs">Quizfragen über den Bräutigam in <code>src/lib/gameData.js</code> anpassen (Antworten kennt nur ihr!).</p>
      </div>

      <Scoreboard players={players} history={state.history} />
    </Layout>
  )
}

// ---------- Arena: nächstes Duell / Glücksrad ----------
function ArenaSetup({ session, state, groom, crew, config }) {
  const [context, setContext] = useState(state.context || 'bar')
  const [manual, setManual] = useState(false)
  const [challengerId, setChallengerId] = useState(null)
  const [discipline, setDiscipline] = useState(null)
  const usedTasks = new Set((state.history || []).filter((h) => h.type === 'task').map((h) => h.index))
  const mvp = [...crew].sort((a, b) => b.score - a.score)[0]
  const counts = duelCounts(crew, state.history)
  const gespielt = (state.history || []).filter((h) => h.type === 'duel').length

  // Eindeutiger, monotoner Rundenzähler (statt Zeitstempel – kein n-Kollisions-Leak
  // von Wetten/Antworten eines abgebrochenen Duells ins nächste)
  const nextN = () => (state.counter || 0) + 1

  const open = (challengerId, disciplineId, finale = false) => {
    if (!challengerId || !disciplineId) return
    const n = nextN()
    setDuelState(session.id, { ...state, counter: n, context }, {
      id: uid(), n, challengerId, discipline: disciplineId,
      phase: 'bet', winner: null, finale
    })
  }

  // Auslosen: fair rotierender Herausforderer + passende, noch nicht
  // gespielte Disziplin für die aktuelle Situation
  const drawDuel = () => {
    const ch = drawChallenger(crew, state.history)
    const disc = drawDiscipline(DISCIPLINES, context, state.history, disciplineFits)
    open(ch?.id, disc?.id)
  }

  const spinWheel = () => {
    const tasks = config.tasks || []
    const available = tasks.map((_, i) => i).filter((i) => !usedTasks.has(i))
    if (!available.length) return
    const index = available[Math.floor(Math.random() * available.length)]
    const n = nextN()
    updateSession(session.id, {
      state: { ...state, counter: n, duel: null, task: { id: uid(), n, index, phase: 'bet', result: null } }
    })
  }

  return (
    <div className="space-y-3">
      {/* SCHRITT 1: Wo seid ihr gerade? */}
      <div className="card p-4">
        <h3 className="h-display text-xl mb-1">1 · Wo seid ihr gerade?</h3>
        <p className="text-white/40 text-xs mb-2">Bestimmt, welche Spiele ausgelost werden können.</p>
        <div className="grid grid-cols-3 gap-2">
          {CONTEXTS.map((c) => (
            <button key={c.id} onClick={() => setContext(c.id)}
              className={`rounded-xl p-2 text-center border transition ${
                context === c.id ? 'bg-brand/20 border-brand' : 'bg-panel2 border-line'
              }`}>
              <div className="text-xl">{c.icon}</div>
              <div className="text-[11px] font-semibold">{c.label}</div>
              <div className="text-[9px] text-white/40 leading-tight">{c.hint}</div>
            </button>
          ))}
        </div>
      </div>

      {/* SCHRITT 2: Der eine Knopf */}
      <div className="card p-4 space-y-3 border-brand/40">
        <div className="flex items-baseline justify-between">
          <h3 className="h-display text-xl">2 · Duell starten</h3>
          <span className="text-white/40 text-xs">{gespielt} Duelle gespielt</span>
        </div>

        <button className="btn-primary w-full text-xl py-5" onClick={drawDuel}>
          🎲 Nächstes Duell auslosen
        </button>
        <p className="text-white/40 text-xs text-center">
          Wählt automatisch den, der am seltensten dran war – und ein Spiel, das hier passt.
        </p>

        {/* Wer war wie oft dran */}
        <div className="flex flex-wrap gap-1.5 justify-center">
          {crew.map((p) => (
            <span key={p.id} className={`chip ${
              counts[p.id] === Math.min(...Object.values(counts))
                ? 'bg-mint/20 text-mint' : 'bg-panel2 text-white/40'
            }`}>
              {p.name} {counts[p.id]}×
            </span>
          ))}
        </div>
      </div>

      {/* Sonderfälle – bewusst klein gehalten */}
      <div className="card p-4 space-y-2">
        <h3 className="text-sm text-white/50">Sonderfälle</h3>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-ghost text-sm" onClick={spinWheel}>🎡 Glücksrad</button>
          <button className="btn-gold text-sm" disabled={!mvp}
                  onClick={() => open(mvp?.id, drawDiscipline(DISCIPLINES, context, [], disciplineFits)?.id, true)}>
            🏆 Finale
          </button>
        </div>
        <p className="text-white/30 text-[11px]">
          Glücksrad = Zusatzaufgabe für {groom.name}. Finale = letztes Duell gegen
          den Führenden ({mvp?.name || '—'}), zählt doppelt und alle setzen die Hälfte ihrer Punkte.
        </p>

        <button className="text-white/40 text-xs underline w-full pt-1" onClick={() => setManual(!manual)}>
          {manual ? 'Manuelle Wahl ausblenden' : 'Lieber selbst wählen (z.B. Padel am Court)'}
        </button>

        {manual && (
          <div className="space-y-2 pt-1">
            <div className="flex flex-wrap gap-1.5">
              {crew.map((p) => (
                <button key={p.id} onClick={() => setChallengerId(p.id)}
                  className={`chip px-3 py-1.5 ${challengerId === p.id ? 'bg-brand text-white' : 'bg-panel2 border border-line'}`}>
                  {p.name}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {DISCIPLINES.map((d) => (
                <button key={d.id} onClick={() => setDiscipline(d.id)}
                  className={`rounded-xl p-2 text-center border transition ${
                    discipline === d.id ? 'bg-brand/20 border-brand' : 'bg-panel2 border-line'
                  }`}>
                  <div className="text-xl">{d.icon}</div>
                  <div className="text-[10px] leading-tight text-white/70">{d.name}</div>
                </button>
              ))}
            </div>
            <button className="btn-primary w-full" disabled={!challengerId || !discipline}
                    onClick={() => open(challengerId, discipline)}>
              Dieses Duell eröffnen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------- Duell-Steuerung ----------
function DuelControls({ session, state, players, groom }) {
  const duel = state.duel
  const challenger = players.find((p) => p.id === duel.challengerId)
  const { answers: votes } = useAnswers(session.id, 'vote', duel.n)
  const [newDisc, setNewDisc] = useState(null)

  const goLive = () => setDuelState(session.id, state, { ...duel, phase: 'live' })
  const cancel = () => setDuelState(session.id, state, null)

  const forceWinner = (winnerId) =>
    resolveDuelRpc(session.id, duel.id, winnerId, 'Organisator-Entscheidung').catch(() => {})

  const next = () => appendHistory(session.id, state, {
    type: 'duel', discipline: duel.discipline, challengerId: duel.challengerId,
    groomId: groom.id, winner: duel.winner, finale: !!duel.finale
  })

  const applyVeto = () => {
    if (!newDisc) return
    setDuelState(session.id, state, { ...duel, id: uid(), discipline: newDisc, veto: false })
  }

  // Was ist gerade zu tun? Eine klare Ansage statt Button-Wald.
  const schritt = duel.veto ? { n: '!', text: 'Veto – wähle unten eine neue Disziplin' }
    : duel.phase === 'bet'  ? { n: 1, text: 'Die Crew wettet gerade. Wenn alle getippt haben → freigeben.' }
    : duel.phase === 'live' ? { n: 2, text: 'Duell läuft. Handy-Duelle werten sich selbst aus, sonst voten die Zuschauer.' }
    : { n: 3, text: 'Fertig! Auf „Weiter" tippen, dann kommt das nächste Duell.' }

  return (
    <div className="card p-4 space-y-3 border-brand/40">
      <h3 className="h-display text-xl">{getDiscipline(duel.discipline)?.icon} {challenger?.name} vs. {groom.name}</h3>
      <div className="bg-panel2 rounded-xl p-3 flex gap-2 items-start">
        <span className="chip bg-brand text-white shrink-0">{schritt.n}</span>
        <span className="text-sm text-white/80">{schritt.text}</span>
      </div>

      {duel.veto && (
        <div className="space-y-2">
          <p className="text-gold text-sm">🚫 Veto! Neue Disziplin wählen:</p>
          <div className="grid grid-cols-3 gap-1.5">
            {DISCIPLINES.filter((d) => d.id !== duel.discipline).map((d) => (
              <button key={d.id} onClick={() => setNewDisc(d.id)}
                className={`rounded-xl p-2 text-center border ${newDisc === d.id ? 'bg-brand/20 border-brand' : 'bg-panel2 border-line'}`}>
                <div className="text-xl">{d.icon}</div>
                <div className="text-[10px] text-white/70">{d.name}</div>
              </button>
            ))}
          </div>
          <button className="btn-primary w-full" disabled={!newDisc} onClick={applyVeto}>Neue Disziplin setzen</button>
        </div>
      )}

      {duel.phase === 'bet' && !duel.veto && (
        <button className="btn-primary w-full text-lg py-4" onClick={goLive}>🔫 Duell freigeben</button>
      )}

      {duel.phase === 'live' && (
        <>
          <p className="text-white/50 text-sm">Zuschauer-Votes: {votes.length}</p>
          <p className="text-sm text-white/60">Manuell werten (Notfall / Gleichstand):</p>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost" onClick={() => forceWinner(duel.challengerId)}>🏆 {challenger?.name}</button>
            <button className="btn-gold" onClick={() => forceWinner(groom.id)}>🏆 {groom.name}</button>
          </div>
        </>
      )}

      {duel.phase === 'done' && (
        <button className="btn-primary w-full text-lg py-4" onClick={next}>Weiter →</button>
      )}

      <button className="btn text-brand text-sm w-full" onClick={cancel}>✕ Duell abbrechen (ohne Wertung)</button>
    </div>
  )
}

// ---------- Aufgaben-Steuerung ----------
function TaskControls({ session, state, groom, config }) {
  const task = state.task
  const t = (config.tasks || [])[task.index]

  const setTask = (patch) => updateSession(session.id, { state: { ...state, task: { ...task, ...patch } } })
  const goLive = () => setTask({ phase: 'live' })
  const cancel = () => updateSession(session.id, { state: { ...state, task: null } })

  const force = (result) => resolveTaskRpc(session.id, task.id, result).catch(() => {})

  const next = () => appendHistory(session.id, state, { type: 'task', index: task.index, result: task.result }, 'task')

  return (
    <div className="card p-4 space-y-3">
      <h3 className="h-display text-xl">🎡 Aufgabe läuft</h3>
      <p className="text-sm bg-panel2 rounded-xl p-3">{t?.icon} {t?.task}</p>
      {task.phase === 'bet' && <button className="btn-primary w-full" onClick={goLive}>▶️ Aufgabe freigeben (Wetten schließen)</button>}
      {task.phase === 'live' && (
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-primary" onClick={() => force('success')}>✅ Geschafft (Force)</button>
          <button className="btn-ghost" onClick={() => force('fail')}>❌ Verkackt (Force)</button>
        </div>
      )}
      {task.phase === 'done' && <button className="btn-primary w-full" onClick={next}>Weiter →</button>}
      <button className="btn text-brand text-sm w-full" onClick={cancel}>✕ Aufgabe abbrechen</button>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-white/40 text-xs uppercase">{label}</div>
      <div className="font-display text-xl capitalize">{value}</div>
    </div>
  )
}
