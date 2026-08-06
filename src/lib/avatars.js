// ============================================================
//  Avatar-System: gelayerte SVG-Cartoon-Avatare, komplett lokal
//  (kein externer Dienst, funktioniert offline).
// ============================================================

export const SKIN_TONES = ['#f2c9a1', '#e0ac69', '#c68642', '#8d5524', '#ffdbac']

export const HAIR_COLORS = ['#2d1b0e', '#6b4423', '#b8860b', '#d3d3d3', '#e8483f']

export const SHIRT_COLORS = ['#e11d48', '#2563eb', '#059669', '#f59e0b', '#7c3aed', '#0a0a0a']

export const HAIR_STYLES = [
  { id: 'kurz',    label: 'Kurz' },
  { id: 'tolle',   label: 'Tolle' },
  { id: 'locken',  label: 'Locken' },
  { id: 'glatze',  label: 'Glatze' },
  { id: 'iro',     label: 'Iro' }
]

export const BEARDS = [
  { id: 'keiner',  label: 'Rasiert' },
  { id: 'drei',    label: '3-Tage' },
  { id: 'voll',    label: 'Vollbart' },
  { id: 'schnauz', label: 'Schnauzer' }
]

export const EXTRAS = [
  { id: 'keins',   label: 'Nix' },
  { id: 'brille',  label: 'Brille' },
  { id: 'sonnen',  label: 'Sonnenbrille' },
  { id: 'cap',     label: 'Cap' }
]

export const DEFAULT_AVATAR = { skin: 0, hair: 0, hairColor: 0, beard: 0, extra: 0, shirt: 0 }

// Fertige Cartoon-Figuren der Crew (liegen in public/avatars/).
// Wer sich mit seinem Spitznamen einträgt, bekommt seine Figur automatisch.
export const CREW_AVATARS = {
  chrise: ['chrise', 'chris', 'christian'],
  christoph: ['christoph', 'christof', 'chrisi'],
  magge: ['magge', 'maggi', 'magnus'],
  moali: ['moali', 'moli'],
  poldi: ['poldi'],
  dominik: ['dominik', 'dominic', 'domi', 'dome']
}

// Reihenfolge für die Auswahl in der Lobby
export const CREW_ORDER = ['chrise', 'christoph', 'magge', 'moali', 'poldi', 'dominik']
export const CREW_LABELS = {
  chrise: 'Chrise', christoph: 'Christoph', magge: 'Magge',
  moali: 'Moali', poldi: 'Poldi', dominik: 'Dominik'
}

// Wie viele fahren mit (Bräutigam eingerechnet)
export const CREW_SIZE = CREW_ORDER.length

// Hochzählen, wenn die Bilddateien ersetzt werden – sonst zeigen Handys
// mit gecachter Version noch das alte Bild.
const AVATAR_VERSION = 2

export function avatarUrl(file) {
  return `${import.meta.env.BASE_URL}avatars/${file}.jpg?v=${AVATAR_VERSION}`
}

// Sucht die passende Figur zu einem Namen.
// WICHTIG: längste Aliasse zuerst prüfen – sonst landet "Christoph"
// über das Kurz-Alias "chris" versehentlich bei Chrise.
export function avatarForName(name) {
  const n = String(name || '').trim().toLowerCase().replace(/[^a-zäöüß]/g, '')
  if (!n) return null
  const all = Object.entries(CREW_AVATARS)
    .flatMap(([file, aliases]) => aliases.map((alias) => ({ file, alias })))
    .sort((a, b) => b.alias.length - a.alias.length)

  const exact = all.find(({ alias }) => n === alias)
  if (exact) return avatarUrl(exact.file)
  // "Christoph B." o.ä. – nur bei ausreichend langen Aliassen, sonst zu unscharf
  const prefix = all.find(({ alias }) => alias.length >= 5 && n.startsWith(alias))
  return prefix ? avatarUrl(prefix.file) : null
}

export function randomAvatar() {
  const r = (n) => Math.floor(Math.random() * n)
  return {
    skin: r(SKIN_TONES.length),
    hair: r(HAIR_STYLES.length),
    hairColor: r(HAIR_COLORS.length),
    beard: r(BEARDS.length),
    extra: r(EXTRAS.length),
    shirt: r(SHIRT_COLORS.length)
  }
}

// Liefert die SVG-Innereien (ohne <svg>-Wrapper) für einen Avatar.
// viewBox: 0 0 100 100
export function avatarLayers(a = DEFAULT_AVATAR, { crown = false } = {}) {
  const skin = SKIN_TONES[a.skin ?? 0] || SKIN_TONES[0]
  const hairC = HAIR_COLORS[a.hairColor ?? 0] || HAIR_COLORS[0]
  const shirt = SHIRT_COLORS[a.shirt ?? 0] || SHIRT_COLORS[0]
  const hair = HAIR_STYLES[a.hair ?? 0]?.id || 'kurz'
  const beard = BEARDS[a.beard ?? 0]?.id || 'keiner'
  const extra = EXTRAS[a.extra ?? 0]?.id || 'keins'

  const parts = []

  // Shirt / Schultern
  parts.push(`<path d="M18 100 Q18 76 50 74 Q82 76 82 100 Z" fill="${shirt}"/>`)
  // Hals
  parts.push(`<rect x="43" y="62" width="14" height="14" rx="5" fill="${skin}"/>`)
  // Kopf
  parts.push(`<ellipse cx="50" cy="44" rx="21" ry="24" fill="${skin}"/>`)
  // Ohren
  parts.push(`<circle cx="29" cy="46" r="4" fill="${skin}"/><circle cx="71" cy="46" r="4" fill="${skin}"/>`)

  // Haare
  if (hair === 'kurz') {
    parts.push(`<path d="M29 40 Q30 18 50 18 Q70 18 71 40 Q66 26 50 26 Q34 26 29 40 Z" fill="${hairC}"/>`)
  } else if (hair === 'tolle') {
    parts.push(`<path d="M28 42 Q26 16 52 15 Q76 15 72 40 Q70 24 54 24 Q60 18 48 20 Q32 24 28 42 Z" fill="${hairC}"/>`)
  } else if (hair === 'locken') {
    parts.push(`<circle cx="35" cy="26" r="8" fill="${hairC}"/><circle cx="50" cy="21" r="9" fill="${hairC}"/><circle cx="65" cy="26" r="8" fill="${hairC}"/><path d="M29 40 Q30 24 50 24 Q70 24 71 40 Q66 28 50 28 Q34 28 29 40 Z" fill="${hairC}"/>`)
  } else if (hair === 'iro') {
    parts.push(`<path d="M44 22 Q50 8 56 22 L54 30 Q50 26 46 30 Z" fill="${hairC}"/>`)
  }
  // glatze: nichts

  // Augen
  if (extra === 'sonnen') {
    parts.push(`<rect x="33" y="40" width="14" height="9" rx="3" fill="#111"/><rect x="53" y="40" width="14" height="9" rx="3" fill="#111"/><rect x="46" y="42" width="8" height="3" fill="#111"/>`)
  } else {
    parts.push(`<circle cx="41" cy="44" r="2.6" fill="#1a1a1a"/><circle cx="59" cy="44" r="2.6" fill="#1a1a1a"/>`)
    if (extra === 'brille') {
      parts.push(`<circle cx="41" cy="44" r="7" fill="none" stroke="#111" stroke-width="2"/><circle cx="59" cy="44" r="7" fill="none" stroke="#111" stroke-width="2"/><line x1="48" y1="44" x2="52" y2="44" stroke="#111" stroke-width="2"/>`)
    }
  }

  // Nase + Mund
  parts.push(`<path d="M49 49 Q47 53 50 54" fill="none" stroke="#00000033" stroke-width="2" stroke-linecap="round"/>`)
  parts.push(`<path d="M43 59 Q50 64 57 59" fill="none" stroke="#7a3b2e" stroke-width="2.4" stroke-linecap="round"/>`)

  // Bart
  if (beard === 'drei') {
    parts.push(`<path d="M31 48 Q33 66 50 67 Q67 66 69 48 Q66 62 50 63 Q34 62 31 48 Z" fill="${hairC}" opacity="0.45"/>`)
  } else if (beard === 'voll') {
    parts.push(`<path d="M30 46 Q31 70 50 70 Q69 70 70 46 Q68 60 50 61 Q32 60 30 46 Z" fill="${hairC}"/><path d="M43 59 Q50 63 57 59 L57 62 Q50 66 43 62 Z" fill="${hairC}"/>`)
  } else if (beard === 'schnauz') {
    parts.push(`<path d="M41 55 Q50 60 59 55 Q55 59 50 58 Q45 59 41 55 Z" fill="${hairC}"/>`)
  }

  // Cap (über Haaren)
  if (extra === 'cap') {
    parts.push(`<path d="M28 36 Q29 16 50 16 Q71 16 72 36 L72 33 Q71 22 50 22 Q29 22 28 33 Z" fill="#1d4ed8"/><path d="M27 34 Q50 28 73 34 L74 38 Q50 32 26 38 Z" fill="#1d4ed8"/><rect x="66" y="30" width="18" height="6" rx="3" fill="#1e40af"/>`)
  }

  // Krone (Bräutigam)
  if (crown) {
    parts.push(`<path d="M32 18 L38 8 L44 15 L50 5 L56 15 L62 8 L68 18 Q50 13 32 18 Z" fill="#f5b400" stroke="#c99700" stroke-width="1"/><circle cx="38" cy="8" r="2" fill="#e11d48"/><circle cx="50" cy="5" r="2" fill="#e11d48"/><circle cx="62" cy="8" r="2" fill="#e11d48"/>`)
  }

  return parts.join('')
}
