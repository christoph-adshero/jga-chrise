import { DISCIPLINES, isManualOnly, disciplineFits } from '../lib/gameData'

// ============================================================
//  Übersicht aller Disziplinen: gespielte durchgestrichen,
//  damit jeder sieht, was noch kommen kann.
//  Mit onPick (nur Organisator) wird jede Kachel antippbar –
//  so kommt man auch an Spiele, die die Auslosung nie zieht (Padel).
// ============================================================

const GROUPS = [
  { kind: 'phone', label: '📱 Am Handy',  hint: 'Beide spielen gleichzeitig, die App wertet automatisch' },
  { kind: 'real',  label: '💪 In echt',   hint: 'Ihr kämpft, die Zuschauer voten danach den Sieger' },
  { kind: 'crowd', label: '🗳️ Publikum',  hint: 'Die Crew entscheidet per Mehrheit' }
]

export default function DisciplineBoard({ history = [], context, onPick }) {
  const played = new Set(history.filter((h) => h.type === 'duel').map((h) => h.discipline))
  const offen = DISCIPLINES.length - played.size

  return (
    <details className="card p-4">
      <summary className="cursor-pointer list-none flex items-center justify-between gap-2">
        <span className="h-display text-xl">🎮 Alle Spiele</span>
        <span className="chip bg-panel2 text-white/60 border border-line shrink-0">
          {offen} von {DISCIPLINES.length} offen
        </span>
      </summary>

      {onPick && (
        <p className="text-white/40 text-xs mt-2">
          Antippen startet dieses Duell sofort – der Herausforderer wird trotzdem fair ausgelost.
        </p>
      )}

      {GROUPS.map((g) => {
        const list = DISCIPLINES.filter((d) => d.kind === g.kind)
        if (!list.length) return null
        return (
          <div key={g.kind} className="mt-3">
            <div className="text-white/40 text-[11px] uppercase tracking-widest">{g.label}</div>
            <div className="text-white/25 text-[11px] mb-1.5">{g.hint}</div>
            <div className="grid grid-cols-2 gap-1.5">
              {list.map((d) => {
                const done = played.has(d.id)
                const manual = isManualOnly(d)
                const passt = !context || manual || disciplineFits(d, context)
                return (
                  <button key={d.id} disabled={!onPick} onClick={() => onPick?.(d.id)}
                    title={d.desc}
                    className={`rounded-xl px-2.5 py-2 text-left border flex items-start gap-1.5 ${
                      done ? 'bg-panel2/40 border-line/50'
                           : passt ? 'bg-panel2 border-line' : 'bg-panel2/60 border-line/50'
                    } ${onPick ? 'active:scale-[0.97] transition' : ''}`}>
                    <span className={`text-base leading-none mt-0.5 ${done ? 'opacity-30' : ''}`}>{d.icon}</span>
                    <span className="min-w-0">
                      <span className={`block text-[13px] leading-tight ${
                        done ? 'line-through text-white/30' : passt ? 'text-white/85' : 'text-white/45'
                      }`}>{d.name}</span>
                      {!done && manual && (
                        <span className="text-gold text-[10px]">nur manuell</span>
                      )}
                      {!done && !manual && !passt && (
                        <span className="text-white/25 text-[10px]">hier nicht spielbar</span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {offen === 0 && (
        <p className="text-gold text-sm text-center mt-3">
          Alle Spiele durch! Ab jetzt wiederholt die Auslosung. 🏁
        </p>
      )}
    </details>
  )
}
