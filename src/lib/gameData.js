// ============================================================
//  Spielinhalte "CREW vs. BRÄUTIGAM".
//  [BRÄUTIGAM] wird im Admin-Panel durch den echten Namen ersetzt.
// ============================================================

export const GROOM = '[BRÄUTIGAM]'

// ---------- DISZIPLINEN für die Duell-Arena ----------
// kind: phone  = Mini-Game läuft auf beiden Handys (auto-Auswertung)
//       real   = reale Aufgabe, Organisator wertet
//       crowd  = Zuschauer voten den Sieger
export const DISCIPLINES = [
  {
    id: 'reaction',
    kind: 'phone',
    icon: '⚡',
    name: 'Reaktions-Duell',
    desc: 'Der Screen wird nach zufälliger Zeit GRÜN. Wer schneller tippt, gewinnt. Zu früh getippt = 1,5s Strafzeit für die Runde.',
    bestOf: 3
  },
  {
    id: 'tap',
    kind: 'phone',
    icon: '👆',
    name: 'Tap-Sprint',
    desc: '10 Sekunden. Hämmere so oft auf den Button wie du kannst. Mehr Taps gewinnen.',
    seconds: 10
  },
  {
    id: 'quizduel',
    kind: 'phone',
    icon: '🧠',
    name: 'Blitz-Quiz',
    desc: '5 Schnellfragen. Richtig + schnell = Punkte. Wer mehr Duell-Punkte holt, gewinnt.',
    seconds: 12
  },
  {
    id: 'estimate',
    kind: 'phone',
    icon: '🎯',
    name: 'Schätzmeister',
    desc: '3 Schätzfragen. Wer näher dran ist, holt den Punkt. Best of 3.',
    seconds: 20
  },
  {
    id: 'memory',
    kind: 'phone',
    icon: '🔢',
    name: 'Zahlen-Memory',
    desc: 'Eine Zahlenfolge blitzt auf und wird jede Runde länger. Tippe sie nach. Höheres Level gewinnt.'
  },
  {
    id: 'timing',
    kind: 'phone',
    icon: '⏱️',
    name: 'Zeitgefühl',
    desc: 'Starte die Stoppuhr und stoppe sie BLIND bei exakt 10,00 Sekunden (die Anzeige verschwindet nach 3s). Wer näher dran ist, gewinnt. Mit Pegel eine Wissenschaft.',
    target: 10
  },
  {
    id: 'steady',
    kind: 'phone',
    icon: '🤚',
    name: 'Ruhige Hand',
    desc: 'Handy flach auf die offene Hand und STILL halten. Wer zuerst zittert, verliert. Ab Bier vier ein Drama.'
  },
  {
    id: 'stroop',
    kind: 'phone',
    icon: '🎨',
    name: 'Farben-Falle',
    desc: 'Das Wort "ROT" steht in blauer Schrift – tippe die FARBE, nicht das Wort. 30 Sekunden, jeder Fehler kostet.',
    seconds: 30
  },
  {
    id: 'typing',
    kind: 'phone',
    icon: '⌨️',
    name: 'Tipp-Diktat',
    desc: 'Einen Satz so schnell wie möglich fehlerfrei abtippen. Wer zuerst fertig ist, gewinnt.'
  },
  {
    id: 'math',
    kind: 'phone',
    icon: '🧮',
    name: 'Kopfrechnen',
    desc: '45 Sekunden Rechenaufgaben im Akkord. Wer mehr richtig hat, gewinnt.',
    seconds: 45
  },
  {
    id: 'aim',
    kind: 'phone',
    icon: '🎚️',
    name: 'Zielbalken',
    desc: 'Ein Marker saust hin und her – stoppe ihn genau in der Mitte. 3 Versuche, Millimeterarbeit.'
  },
  {
    id: 'real_arm',
    kind: 'real',
    icon: '💪',
    name: 'Armdrücken',
    desc: 'Klassiker. Best of 3 am Tisch. Die Zuschauer werten.'
  },
  {
    id: 'real_liegestuetz',
    kind: 'real',
    icon: '🏋️',
    name: 'Liegestütz-Battle',
    desc: '60 Sekunden, wer schafft mehr? Laut mitzählen, die Zuschauer werten.'
  },
  {
    id: 'real_padel',
    kind: 'real',
    icon: '🎾',
    name: 'Padel-Duell',
    desc: 'Best of 5 Punkte, 1 gegen 1 auf dem Court. Die Zuschauer werten den Sieger.'
  },
  {
    id: 'real_plank',
    kind: 'real',
    icon: '🧘',
    name: 'Plank-Battle',
    desc: 'Unterarmstütz auf Zeit. Sieht harmlos aus, tut weh. Wer zuerst zusammenklappt, verliert.'
  },
  {
    id: 'real_jump',
    kind: 'real',
    icon: '🦘',
    name: 'Standweitsprung',
    desc: 'Zwei Versuche aus dem Stand, die weiteste Weite zählt. Absprungmarke nicht übertreten!'
  },
  {
    id: 'real_balance',
    kind: 'real',
    icon: '🦩',
    name: 'Einbein-Stand',
    desc: 'Auf einem Bein, Augen zu, Arme verschränkt. Wer zuerst absetzt, verliert. Der Gleichgewichtssinn verabschiedet sich mit jedem Bier.'
  },
  {
    id: 'crowd_promi',
    kind: 'crowd',
    icon: '🤩',
    name: 'Promi-Foto',
    desc: 'Wer ergattert das bessere Foto mit einer Berühmtheit – oder mit jemandem, der aussieht wie einer? Doppelgänger zählen! Die Crew votet das Siegerfoto.'
  }
]

export function getDiscipline(id) {
  return DISCIPLINES.find((d) => d.id === id)
}

// ---------- Wo lässt sich was spielen? ----------
// Damit die Auslosung nicht Standweitsprung im Auto vorschlägt.
export const CONTEXTS = [
  { id: 'unterwegs', icon: '🚗', label: 'Unterwegs', hint: 'Auto, U-Bahn, Warten' },
  { id: 'draussen',  icon: '🏖️', label: 'Draußen',   hint: 'Insel, Park, Platz' },
  { id: 'bar',       icon: '🍺', label: 'Bar & Tisch', hint: 'Beisl, Heuriger, Lokal' }
]

// Handy-Duelle gehen überall – nur die körperlichen brauchen Platz.
// Leere Liste = kommt nie in der Auslosung (nur manuell wählbar).
const WHERE = {
  real_arm:         ['bar', 'draussen'],
  real_liegestuetz: ['draussen', 'bar'],
  real_plank:       ['draussen'],
  real_jump:        ['draussen'],
  real_balance:     ['draussen', 'bar'],
  crowd_promi:      ['bar', 'draussen'],
  real_padel:       []
}

export const disciplineFits = (d, ctx) =>
  (WHERE[d.id] ?? ['unterwegs', 'draussen', 'bar']).includes(ctx)

export const isManualOnly = (d) => (WHERE[d.id] ?? null)?.length === 0

// ---------- Blitz-Quiz-Fragen (Duell) ----------
// Bewusst OHNE Orts-Bezug: Der Bräutigam darf aus dem Spiel nicht ablesen,
// wo es hingeht.
export const DUEL_QUIZ = [
  { q: 'Wie viel Bier passt in eine "Maß"?', options: ['0,5 l', '0,75 l', '1,0 l', '1,5 l'], correct: 2 },
  { q: 'Woraus besteht ein Radler?', options: ['Bier + Limo', 'Bier + Cola', 'Bier + Sekt', 'Bier + Sprudel'], correct: 0 },
  { q: 'Wie viele Karten hat ein Skatblatt?', options: ['32', '36', '48', '52'], correct: 0 },
  { q: 'Welche Farben hat die bayerische Flagge?', options: ['Weiß-Blau', 'Rot-Gold', 'Schwarz-Gelb', 'Grün-Weiß'], correct: 0 },
  { q: 'Wie viele Bundesländer hat Deutschland?', options: ['14', '15', '16', '17'], correct: 2 },
  { q: 'Wie lang ist eine Halbzeit beim Fußball?', options: ['40 Min', '45 Min', '50 Min', '60 Min'], correct: 1 },
  { q: 'Wie viel Alkohol hat ein normales Pils ungefähr?', options: ['2,5 %', '4,8 %', '7,5 %', '9,0 %'], correct: 1 },
  { q: 'Was gehört NICHT in einen Hugo?', options: ['Prosecco', 'Holunder', 'Minze', 'Wodka'], correct: 3 },
  { q: 'Wie viele Nullen hat eine Milliarde?', options: ['6', '8', '9', '12'], correct: 2 },
  { q: 'Wie viele Spieler einer Mannschaft stehen beim Fußball auf dem Platz?', options: ['9', '10', '11', '12'], correct: 2 }
]

// ---------- Farben-Falle (Stroop) ----------
export const STROOP_COLORS = [
  { name: 'ROT', hex: '#ef4444' },
  { name: 'BLAU', hex: '#3b82f6' },
  { name: 'GRÜN', hex: '#22c55e' },
  { name: 'GELB', hex: '#eab308' }
]

// ---------- Tipp-Diktat ----------
export const TYPING_PHRASES = [
  'Grüß Gott, i hätt gern a Maß',
  'Der Bräutigam zahlt heute jede Runde',
  'Oachkatzlschwoaf und Kaiserschmarrn',
  'Zwanzig Zwetschgen im Zwetschgenzelt',
  'Fischers Fritze fischt frische Fische',
  'Blaukraut bleibt Blaukraut, Brautkleid bleibt Brautkleid',
  'A Hoibe geht no, dann is Schluss',
  'Heute wird der Junggeselle geschlagen'
]

// ---------- Schätzfragen (Duell) ----------
export const ESTIMATE_QUESTIONS = [
  { q: 'Wie viele Liter Bier trinkt ein Deutscher im Schnitt pro Jahr?', answer: 88, unit: 'Liter' },
  { q: 'Wie hoch ist der Kölner Dom in Metern?', answer: 157, unit: 'm' },
  { q: 'Wie viele Einwohner hat Waldkirchen ungefähr?', answer: 10500, unit: 'Einwohner' },
  { q: 'Wie viele Knochen hat ein erwachsener Mensch?', answer: 206, unit: 'Knochen' },
  { q: 'Wie viele Tasten hat ein Klavier?', answer: 88, unit: 'Tasten' },
  { q: 'In welchem Jahr wurde das Reinheitsgebot erlassen?', answer: 1516, unit: '' },
  { q: 'Wie schnell ist ein Ball beim Elfmeter ungefähr?', answer: 110, unit: 'km/h' },
  { q: 'Wie viele Liter passen in eine normale Badewanne?', answer: 150, unit: 'Liter' }
]

// ---------- BRÄUTIGAM-GLÜCKSRAD: Zusatzaufgaben ----------
// successPts: Punkte für den Bräutigam bei Erfolg
// failPts:    Punkte für JEDEN Herausforderer bei Scheitern
export const BACHELOR_TASKS = [
  { icon: '🍹', task: 'Lass dir von einem/einer Fremden einen Drink ausgeben (oder zumindest anstoßen).', successPts: 80, failPts: 40 },
  { icon: '🎶', task: 'Bring eine fremde Gruppe dazu, mit dir anzustoßen und "Prost auf den Bräutigam!" zu rufen.', successPts: 80, failPts: 40 },
  { icon: '🗣️', task: 'Sprich die nächsten 10 Minuten NUR in Reimen. 3 Verstöße = gescheitert.', successPts: 80, failPts: 40 },
  { icon: '💪', task: '10 Liegestütze mitten in der Bar – mit Publikums-Applaus danach.', successPts: 60, failPts: 30 },
  { icon: '🧢', task: 'Tausche für 30 Minuten ein Kleidungsstück mit einem Teammitglied.', successPts: 60, failPts: 30 },
  { icon: '🇬🇧', task: 'Bestell die nächste Runde komplett auf Englisch – mit dem schlechtesten Akzent, den du drauf hast.', successPts: 60, failPts: 30 },
  { icon: '📸', task: 'Überrede einen Fremden mit Bart zu einem Gruppenfoto.', successPts: 70, failPts: 35 },
  { icon: '💃', task: 'Fordere jemanden (freundlich!) zu einem 30-Sekunden-Tanz-Battle heraus.', successPts: 90, failPts: 45 },
  { icon: '🎤', task: 'Halte eine 60-Sekunden-Lobrede auf deine Verlobte – auf einem Stuhl stehend.', successPts: 70, failPts: 35 },
  { icon: '🕵️', task: 'Finde heraus: Vorname + Sternzeichen eines Fremden – nur durch Smalltalk.', successPts: 70, failPts: 35 },
  { icon: '🍋', task: 'Iss eine Zitronenscheibe ohne das Gesicht zu verziehen.', successPts: 50, failPts: 25 },
  { icon: '📞', task: 'Ruf deine Verlobte an und sing ihr 30 Sekunden ein Ständchen – auf Lautsprecher.', successPts: 90, failPts: 45 }
]

// ---------- Punktesystem (rebalanced nach Design-Review) ----------
export const POINTS = {
  duelWin: 250,          // Duell gewonnen (Herausforderer ODER Bräutigam)
  duelWinFinale: 500,    // Finale zählt doppelt
  groomTrost: 50,        // Trostpunkte für den Bräutigam pro verlorenem Duell (er spielt jedes)
  taskSuccess: 100       // Bräutigam schafft Glücksrad-Aufgabe
}

// Wett-Einsätze (Zuschauer wählen ihren Einsatz; richtig = +Einsatz, falsch = −Einsatz)
export const BET_STAKES = [20, 50, 100]

// Bräutigam-Joker (je 1× pro Nacht)
export const JOKERS = [
  { id: 'veto',     icon: '🚫', name: 'Veto',        desc: 'Disziplin ablehnen – es wird neu gewählt.' },
  { id: 'handicap', icon: '⚖️', name: 'Handicap',    desc: 'Der Herausforderer bekommt eine Erschwernis (z.B. nur linke Hand).' },
  { id: 'double',   icon: '✨', name: 'Verdopplung', desc: 'VOR dem Duell ansagen: Dieses Duell zählt für dich doppelt (500 statt 250).' }
]

export const defaultConfig = {
  groomName: '',
  centsPerPoint: 0, // 0 = aus. Sonst: Punktestand × Cent = Einsatz in echtem Geld
  tasks: BACHELOR_TASKS
}

// Punkte → Euro (nur Anzeige, die App bewegt kein Geld)
export function pointsToEuro(points, centsPerPoint) {
  if (!centsPerPoint) return null
  return (points * centsPerPoint) / 100
}

export const fmtEuro = (v) =>
  `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(2).replace('.', ',')} €`

// Ersetzt [BRÄUTIGAM] durch den echten Namen in allen Texten
export function withGroomName(config, name) {
  if (!name) return config
  const replace = (s) => (typeof s === 'string' ? s.split(GROOM).join(name) : s)
  const deep = (obj) => {
    if (Array.isArray(obj)) return obj.map(deep)
    if (obj && typeof obj === 'object') {
      const out = {}
      for (const k in obj) out[k] = deep(obj[k])
      return out
    }
    return replace(obj)
  }
  return deep(config)
}

// Deterministischer Seed aus einem String (für synchrone Zufallswerte auf allen Handys)
export function seedFrom(str) {
  let h = 2166136261
  for (let i = 0; i < String(str).length; i++) {
    h ^= String(str).charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}
