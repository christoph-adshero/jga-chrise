import { useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import ReactionDuel from '../components/minigames/ReactionDuel.jsx'
import TapSprint from '../components/minigames/TapSprint.jsx'
import QuizDuel from '../components/minigames/QuizDuel.jsx'
import EstimateDuel from '../components/minigames/EstimateDuel.jsx'
import MemoryDuel from '../components/minigames/MemoryDuel.jsx'
import TimingDuel from '../components/minigames/TimingDuel.jsx'
import SteadyDuel from '../components/minigames/SteadyDuel.jsx'
import StroopDuel from '../components/minigames/StroopDuel.jsx'
import TypingDuel from '../components/minigames/TypingDuel.jsx'
import MathDuel from '../components/minigames/MathDuel.jsx'
import AimDuel from '../components/minigames/AimDuel.jsx'
import { DISCIPLINES } from '../lib/gameData'
import { loadLocal } from '../lib/storage'

// Trainings-Modus: alle Handy-Minigames offline üben – ohne Session, ohne Supabase.
// „Damals & Heute" bleibt draußen: Üben hieße hier, die Fotos vorab zu sehen.
const GAMES = DISCIPLINES.filter((d) => d.kind === 'phone' && d.id !== 'photoyear')

export default function Training() {
  const [active, setActive] = useState(null)
  const [result, setResult] = useState(null)
  const [runId, setRunId] = useState(0)
  const back = loadLocal().sessionId ? `/play/${loadLocal().sessionId}` : '/'

  const start = (id) => { setActive(id); setResult(null); setRunId((r) => r + 1) }
  const onFinish = ({ value, responseMs }) => setResult(responseMs != null ? `Ø ${responseMs} ms` : value)

  const disc = GAMES.find((d) => d.id === active)

  return (
    <Layout subtitle="Offline-Übungsmodus" title="Training 🏋️"
            right={<Link to={back} className="chip bg-panel2 text-white/60 border border-line">← Zum Spiel</Link>}>
      {!active && (
        <>
          <div className="card p-4 text-center text-white/60 text-sm">
            Übe die Duell-Disziplinen, bevor es ernst wird. Läuft komplett offline – Ergebnisse zählen nicht.
          </div>
          <div className="grid grid-cols-2 gap-2">
            {GAMES.map((d) => (
              <button key={d.id} onClick={() => start(d.id)} className="card p-4 text-center active:scale-[0.98] transition">
                <div className="text-3xl">{d.icon}</div>
                <div className="font-semibold mt-1">{d.name}</div>
                <div className="text-white/40 text-xs mt-1 leading-tight">{d.desc}</div>
              </button>
            ))}
          </div>
        </>
      )}

      {active && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="h-display text-2xl">{disc.icon} {disc.name}</h2>
            <button className="chip bg-panel2 border border-line" onClick={() => setActive(null)}>✕ Zurück</button>
          </div>

          {active === 'reaction' && <ReactionDuel key={runId} onFinish={onFinish} />}
          {active === 'tap' && <TapSprint key={runId} seconds={10} onFinish={onFinish} />}
          {active === 'quizduel' && <QuizDuel key={runId} duelId={`training-${runId}`} seconds={12} onFinish={onFinish} />}
          {active === 'estimate' && <EstimateDuel key={runId} duelId={`training-${runId}`} onFinish={onFinish} />}
          {active === 'memory' && <MemoryDuel key={runId} duelId={`training-${runId}`} onFinish={onFinish} />}
          {active === 'timing' && <TimingDuel key={runId} target={disc.target} onFinish={onFinish} />}
          {active === 'steady' && <SteadyDuel key={runId} onFinish={onFinish} />}
          {active === 'stroop' && <StroopDuel key={runId} duelId={`training-${runId}`} seconds={disc.seconds} onFinish={onFinish} />}
          {active === 'typing' && <TypingDuel key={runId} duelId={`training-${runId}`} onFinish={onFinish} />}
          {active === 'math' && <MathDuel key={runId} duelId={`training-${runId}`} seconds={disc.seconds} onFinish={onFinish} />}
          {active === 'aim' && <AimDuel key={runId} onFinish={onFinish} />}

          {result != null && (
            <div className="card p-4 text-center animate-pop">
              <p className="text-white/50 text-sm">Dein Trainings-Ergebnis</p>
              <p className="font-display text-3xl text-gold">{result}</p>
              <button className="btn-primary w-full mt-3" onClick={() => start(active)}>Nochmal 🔁</button>
            </div>
          )}
        </>
      )}
    </Layout>
  )
}
