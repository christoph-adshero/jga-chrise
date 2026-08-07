import { Link } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import { loadLocal } from '../lib/storage'
import { POINTS, BET_STAKES, JOKERS, DISCIPLINES } from '../lib/gameData'

// Erklärt den kompletten Ablauf, bevor es losgeht.
// Zahlen kommen aus gameData, damit die Regeln nie veralten.

function Step({ n, title, children }) {
  return (
    <div className="flex gap-3">
      <span className="shrink-0 w-7 h-7 rounded-full bg-brand/20 text-brand font-display
                       text-lg grid place-items-center mt-0.5">{n}</span>
      <div className="min-w-0">
        <h4 className="font-bold leading-tight">{title}</h4>
        <p className="text-white/60 text-sm leading-snug mt-0.5">{children}</p>
      </div>
    </div>
  )
}

export default function Rules() {
  const { sessionId } = loadLocal()
  const back = sessionId ? `/play/${sessionId}` : '/'
  const phone = DISCIPLINES.filter((d) => d.kind === 'phone').length
  const real = DISCIPLINES.length - phone

  return (
    <Layout subtitle="Bevor es losgeht" title="So läuft's 📖"
            right={<Link to={back} className="chip bg-panel2 text-white/60 border border-line">← Zurück</Link>}>

      <div className="card p-5 text-center">
        <div className="text-4xl mb-2">🥊👑</div>
        <p className="text-white/80">
          <b>Die ganze Crew gegen einen.</b><br />
          Der Bräutigam spielt <b>jedes</b> Duell – ihr wechselt euch ab.
          Am Ende steht die Frage: Habt ihr ihn geschlagen?
        </p>
      </div>

      <div className="card p-4 space-y-3">
        <h3 className="h-display text-xl">Der Ablauf</h3>
        <Step n="1" title="Auslosung">
          Die App würfelt einen Herausforderer und ein Spiel aus. Jeder kommt gleich oft dran –
          da wird nicht getrickst.
        </Step>
        <Step n="2" title="Wetten">
          Alle, die nicht kämpfen, tippen auf den Sieger und setzen {BET_STAKES.join(' / ')} Punkte.
          Ihr seht vorher, welches Spiel kommt und wie es geht.
        </Step>
        <Step n="3" title="Duell">
          {phone} Spiele laufen auf den Handys der beiden – die App wertet automatisch aus.
          Die anderen {real} macht ihr in echt; danach tippen die Zuschauer auf ihren Handys,
          wer gewonnen hat. Mehrheit entscheidet, bei Gleichstand der Organisator.
        </Step>
        <Step n="4" title="Glücksrad">
          Zwischendurch zieht der Bräutigam eine Zusatzaufgabe. Ihr wettet vorher,
          ob er sie schafft.
        </Step>
        <Step n="5" title="Finale">
          Zum Schluss: der Beste der Crew gegen den Bräutigam. Doppelte Punkte,
          und alle Zuschauer setzen automatisch die Hälfte ihres Punktestands.
        </Step>
        <Step n="6" title="Endstand">
          Crew-Meter, MVP-Ranking und – wenn ihr um Geld spielt – die Abrechnung.
        </Step>
      </div>

      <div className="card p-4">
        <h3 className="h-display text-xl mb-2">🍺 Wer trinkt?</h3>
        <ul className="space-y-1.5 text-sm text-white/70">
          <li className="flex gap-2"><span>🥊</span><span><b>Wer ein Duell verliert, trinkt.</b> Der Bräutigam also oft.</span></li>
          <li className="flex gap-2"><span>🎡</span><span>Verkackt der Bräutigam eine Glücksrad-Aufgabe, trinkt er.</span></li>
          <li className="flex gap-2"><span>💸</span><span>Wette daneben? Kostet Punkte – ob du dazu trinkst, macht ihr unter euch aus.</span></li>
          <li className="flex gap-2"><span>🍻</span><span>Jeder zählt seine Biere selbst: Spieler antippen → „Prost!". Der Durstlöscher des Abends wird am Ende gekürt.</span></li>
        </ul>
      </div>

      <div className="card p-4">
        <h3 className="h-display text-xl mb-2">💰 Die Punkte</h3>
        <table className="w-full text-sm">
          <tbody className="text-white/70">
            <tr className="border-b border-line/60"><td className="py-1.5">Duell gewonnen</td><td className="text-right font-display text-gold text-lg">+{POINTS.duelWin}</td></tr>
            <tr className="border-b border-line/60"><td className="py-1.5">Finale gewonnen</td><td className="text-right font-display text-gold text-lg">+{POINTS.duelWinFinale}</td></tr>
            <tr className="border-b border-line/60"><td className="py-1.5">Bräutigam verliert ein Duell (Trostpunkte)</td><td className="text-right font-display text-gold text-lg">+{POINTS.groomTrost}</td></tr>
            <tr className="border-b border-line/60"><td className="py-1.5">Glücksrad-Aufgabe geschafft</td><td className="text-right font-display text-gold text-lg">+{POINTS.taskSuccess}</td></tr>
            <tr><td className="py-1.5">Wette richtig / falsch</td><td className="text-right font-display text-gold text-lg">±Einsatz</td></tr>
          </tbody>
        </table>
        <p className="text-white/35 text-xs mt-2">
          Der Bräutigam läuft in einer eigenen Wertung – er spielt ja jedes Duell.
          Das MVP-Ranking entscheidet nur die Crew unter sich aus.
        </p>
      </div>

      <div className="card p-4">
        <h3 className="h-display text-xl mb-2">👑 Die Joker des Bräutigams</h3>
        <p className="text-white/50 text-xs mb-2">Jeden genau einmal, ansagen vor dem Duell.</p>
        <ul className="space-y-1.5">
          {JOKERS.map((j) => (
            <li key={j.id} className="text-sm text-white/70">
              <b>{j.icon} {j.name}</b> – {j.desc}
            </li>
          ))}
        </ul>
      </div>

      <div className="card p-4 text-center">
        <p className="text-white/60 text-sm">
          Einer ist Organisator und steuert den Ablauf – bei ihm taucht unten
          immer genau der Knopf auf, der gerade dran ist. Alle anderen müssen nur
          aufs Handy schauen, wenn es vibriert. 😉
        </p>
      </div>

      <Link to={back} className="btn-primary w-full">Verstanden – los geht's! 🥊</Link>
    </Layout>
  )
}
