// ============================================================
//  Spielinhalte "CREW vs. BRÄUTIGAM".
//  [BRÄUTIGAM] wird im Admin-Panel durch den echten Namen ersetzt.
// ============================================================

export const GROOM = '[BRÄUTIGAM]'

// ---------- DISZIPLINEN für die Duell-Arena ----------
// kind: phone  = Mini-Game läuft auf beiden Handys (auto-Auswertung)
//       real   = reale Aufgabe, Organisator wertet
//       crowd  = Zuschauer voten den Sieger
// ---------- „Damals & Heute": Fotos des Bräutigams ----------
// Die Bilder liegen NICHT im Repo, sondern in einem Supabase-Storage-Bucket.
// Solange weniger als 3 Fotos hinterlegt sind, taucht die Disziplin nirgends auf.
// Format: { url: '…', year: 2007, note: 'optionaler Hinweis fürs Ergebnis' }
export const GROOM_PHOTOS = []

// Spannweite des Jahres-Reglers – muss alle Fotos abdecken
export const PHOTO_YEAR_RANGE = { from: 1988, to: 2026 }

// Handicap: Der Bräutigam kennt seine eigenen Fotos, deshalb muss er
// aufs Jahr genau treffen – der Herausforderer darf zwei danebenliegen.
export const PHOTO_TOLERANCE = { challenger: 2, groom: 0 }

const ALL_DISCIPLINES = [
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
  },
  {
    id: 'photoyear',
    kind: 'phone',
    icon: '📷',
    name: 'Damals & Heute',
    desc: 'Drei alte Fotos vom Bräutigam – in welchem Jahr sind sie entstanden? Handicap: Der Herausforderer punktet schon, wenn er zwei Jahre danebenliegt. Der Bräutigam muss sein eigenes Foto aufs Jahr genau treffen.'
  }
]

// Ohne hinterlegte Fotos gibt es „Damals & Heute" nicht – sonst stünde
// die Disziplin in der Auslosung und liefe ins Leere.
export const DISCIPLINES = ALL_DISCIPLINES.filter(
  (d) => d.id !== 'photoyear' || GROOM_PHOTOS.length >= 3
)

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
  { q: 'Wie viele Spieler einer Mannschaft stehen beim Fußball auf dem Platz?', options: ['9', '10', '11', '12'], correct: 2 },
  { q: 'Welches Tier hat drei Herzen?', options: ['Krake', 'Wal', 'Krokodil', 'Strauß'], correct: 0 },
  { q: 'Wie viele Zeitzonen hat Russland?', options: ['5', '8', '11', '15'], correct: 2 },
  { q: 'Was ist der härteste natürliche Stoff?', options: ['Quarz', 'Diamant', 'Granit', 'Stahl'], correct: 1 },
  { q: 'Welches Land hat die meisten Einwohner?', options: ['China', 'Indien', 'USA', 'Indonesien'], correct: 1 },
  { q: 'Wie viele Streifen hat die US-Flagge?', options: ['11', '13', '15', '50'], correct: 1 },
  { q: 'Welcher Planet ist der Sonne am nächsten?', options: ['Venus', 'Merkur', 'Mars', 'Erde'], correct: 1 },
  { q: 'Wie viele Minuten dauert ein Eishockey-Drittel?', options: ['15', '20', '25', '30'], correct: 1 },
  { q: 'Woraus wird Tequila gemacht?', options: ['Agave', 'Zuckerrohr', 'Kaktus', 'Mais'], correct: 0 },
  { q: 'Welche Farbe entsteht aus Blau und Gelb?', options: ['Grün', 'Lila', 'Braun', 'Orange'], correct: 0 },
  { q: 'Wie viele Saiten hat eine Standard-Gitarre?', options: ['4', '5', '6', '7'], correct: 2 },
  { q: 'Was misst die Richterskala?', options: ['Windstärke', 'Erdbeben', 'Lautstärke', 'Höhe'], correct: 1 },
  { q: 'Wie heißt der längste Fluss der Welt?', options: ['Amazonas', 'Nil', 'Jangtse', 'Mississippi'], correct: 1 },
  { q: 'Wie viele Felder hat ein Schachbrett?', options: ['36', '49', '64', '81'], correct: 2 },
  { q: 'Welches Gas atmen Pflanzen zum Wachsen ein?', options: ['Sauerstoff', 'Stickstoff', 'CO₂', 'Helium'], correct: 2 },
  { q: 'Wie viele Spieler hat eine Volleyball-Mannschaft auf dem Feld?', options: ['5', '6', '7', '8'], correct: 1 },
  { q: 'Was ist ein Sudoku?', options: ['Zahlenrätsel', 'Kampfsport', 'Kartenspiel', 'Gericht'], correct: 0 },
  { q: 'Welches Metall ist bei Zimmertemperatur flüssig?', options: ['Blei', 'Quecksilber', 'Zinn', 'Zink'], correct: 1 },
  { q: 'Wie oft findet die Fußball-WM statt?', options: ['jährlich', 'alle 2 Jahre', 'alle 3 Jahre', 'alle 4 Jahre'], correct: 3 },
  { q: 'Wie viele Buchstaben hat das deutsche Alphabet (ohne Umlaute)?', options: ['24', '25', '26', '28'], correct: 2 },
  { q: 'Welches Organ produziert Insulin?', options: ['Leber', 'Niere', 'Bauchspeicheldrüse', 'Milz'], correct: 2 },
  { q: 'Was bedeutet die Abkürzung "PS" beim Auto?', options: ['Pferdestärke', 'Power System', 'Primärschub', 'Kolbenstärke'], correct: 0 },
  { q: 'Wie hoch ist ein Basketballkorb?', options: ['2,75 m', '3,05 m', '3,25 m', '3,50 m'], correct: 1 },
  { q: 'Welches Getreide steckt in klassischem Weißbier?', options: ['Roggen', 'Hafer', 'Weizen', 'Dinkel'], correct: 2 },
  { q: 'Wie viele Augen hat eine Spielwürfel-Seite maximal?', options: ['5', '6', '8', '9'], correct: 1 },
  { q: 'Wer malte die Mona Lisa?', options: ['Michelangelo', 'da Vinci', 'Raffael', 'Rembrandt'], correct: 1 },
  { q: 'Wie viele Kammern hat ein menschliches Herz?', options: ['2', '3', '4', '5'], correct: 2 },
  { q: 'Was ist die Hauptstadt von Australien?', options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], correct: 2 },
  { q: 'Wie lange dauert ein Boxkampf-Round bei den Profis?', options: ['2 Min', '3 Min', '4 Min', '5 Min'], correct: 1 },
  { q: 'Welches Tier wird auch "Wüstenschiff" genannt?', options: ['Kamel', 'Esel', 'Lama', 'Antilope'], correct: 0 }
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
// Jede geschaffte Aufgabe bringt POINTS.taskSuccess – bewusst für alle gleich.
export const BACHELOR_TASKS = [
  { icon: '🍹', task: 'Lass dir von einem/einer Fremden einen Drink ausgeben (oder zumindest anstoßen).' },
  { icon: '🎶', task: 'Bring eine fremde Gruppe dazu, mit dir anzustoßen und "Prost auf den Bräutigam!" zu rufen.' },
  { icon: '🇬🇧', task: 'Bestell die nächste Runde komplett auf Englisch – mit dem schlechtesten Akzent, den du drauf hast.' },
  { icon: '🎤', task: 'Halte eine 60-Sekunden-Lobrede auf deine Verlobte – auf einem Stuhl stehend.' },
  { icon: '🕵️', task: 'Finde heraus: Vorname + Sternzeichen eines Fremden – nur durch Smalltalk.' },
  { icon: '🍋', task: 'Iss eine Zitronenscheibe ohne das Gesicht zu verziehen.' },
  { icon: '📞', task: 'Ruf deine Verlobte an und sing ihr 30 Sekunden ein Ständchen – auf Lautsprecher.' }
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
