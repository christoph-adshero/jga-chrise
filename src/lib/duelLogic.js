import { seedFrom, DUEL_QUIZ, ESTIMATE_QUESTIONS, STROOP_COLORS, TYPING_PHRASES } from './gameData'

// Deterministischer RNG (mulberry32) – gleiche Fragen auf beiden Handys
export function rng(seed) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export function seededPick(seedStr, arr, count) {
  const random = rng(seedFrom(seedStr))
  const idx = arr.map((_, i) => i)
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  return idx.slice(0, count).map((i) => arr[i])
}

export const duelQuizFor = (duelId) => seededPick(`q-${duelId}`, DUEL_QUIZ, 5)
export const estimatesFor = (duelId) => seededPick(`e-${duelId}`, ESTIMATE_QUESTIONS, 3)
export const memoryDigitsFor = (duelId, level) => {
  const random = rng(seedFrom(`m-${duelId}-${level}`))
  return Array.from({ length: level + 2 }, () => Math.floor(random() * 10)).join('')
}

// Farben-Falle: Wort und Schriftfarbe sind absichtlich verschieden
export function stroopSequenceFor(duelId, count = 60) {
  const random = rng(seedFrom(`s-${duelId}`))
  const n = STROOP_COLORS.length
  return Array.from({ length: count }, () => {
    const word = Math.floor(random() * n)
    let ink = Math.floor(random() * (n - 1))
    if (ink >= word) ink++ // nie dieselbe Farbe wie das Wort
    return { word, ink }
  })
}

export const typingPhraseFor = (duelId) => seededPick(`t-${duelId}`, TYPING_PHRASES, 1)[0]

// Kopfrechnen: gemischte Aufgaben, gleiche Reihenfolge auf beiden Handys
export function mathProblemsFor(duelId, count = 40) {
  const random = rng(seedFrom(`k-${duelId}`))
  return Array.from({ length: count }, () => {
    const op = Math.floor(random() * 3)
    if (op === 0) {
      const a = 12 + Math.floor(random() * 78), b = 12 + Math.floor(random() * 78)
      return { q: `${a} + ${b}`, a: a + b }
    }
    if (op === 1) {
      const a = 40 + Math.floor(random() * 60), b = 5 + Math.floor(random() * 35)
      return { q: `${a} − ${b}`, a: a - b }
    }
    const a = 3 + Math.floor(random() * 10), b = 3 + Math.floor(random() * 10)
    return { q: `${a} × ${b}`, a: a * b }
  })
}

// ---------- Duell-Auswertung ----------
// a/b = answers-Zeilen der beiden Duellanten. Rückgabe: { winnerId, detail }
// Tie-Break: wer zuerst abgegeben hat, gewinnt ("Zeitvorteil").
export function computeDuelWinner(discipline, a, b) {
  const first = new Date(a.created_at) <= new Date(b.created_at) ? a : b
  const num = (x) => Number(x.value)

  switch (discipline) {
    case 'reaction': { // niedrigere Ø-Reaktionszeit gewinnt
      if (a.response_ms === b.response_ms) return tie(first, 'Gleich schnell – Zeitvorteil entscheidet')
      const w = a.response_ms < b.response_ms ? a : b
      return { winnerId: w.player_id, detail: `${a.response_ms} ms vs. ${b.response_ms} ms (Ø best of 3)` }
    }
    case 'tap': { // mehr Taps gewinnen
      if (num(a) === num(b)) return tie(first, `Beide ${num(a)} Taps – Zeitvorteil entscheidet`)
      const w = num(a) > num(b) ? a : b
      return { winnerId: w.player_id, detail: `${num(a)} vs. ${num(b)} Taps` }
    }
    case 'quizduel': { // mehr Quiz-Punkte gewinnen
      if (num(a) === num(b)) return tie(first, `Beide ${num(a)} Punkte – Zeitvorteil entscheidet`)
      const w = num(a) > num(b) ? a : b
      return { winnerId: w.player_id, detail: `${num(a)} vs. ${num(b)} Quiz-Punkte` }
    }
    case 'memory': { // höheres Level gewinnt
      if (num(a) === num(b)) return tie(first, `Beide Level ${num(a)} – Zeitvorteil entscheidet`)
      const w = num(a) > num(b) ? a : b
      return { winnerId: w.player_id, detail: `Level ${num(a)} vs. Level ${num(b)}` }
    }
    case 'timing': { // geringere Abweichung von 10,00s gewinnt (value = Abweichung in ms)
      if (num(a) === num(b)) return tie(first, 'Gleich präzise – Zeitvorteil entscheidet')
      const w = num(a) < num(b) ? a : b
      const fmt = (x) => (Number(x.value) / 1000).toFixed(2)
      return { winnerId: w.player_id, detail: `±${fmt(a)}s vs. ±${fmt(b)}s daneben` }
    }
    case 'steady': { // länger ruhig gehalten gewinnt (value = ms)
      if (num(a) === num(b)) return tie(first, 'Beide gleich ruhig – Zeitvorteil entscheidet')
      const w = num(a) > num(b) ? a : b
      const fmt = (x) => (Number(x.value) / 1000).toFixed(1)
      return { winnerId: w.player_id, detail: `${fmt(a)}s vs. ${fmt(b)}s ruhig gehalten` }
    }
    case 'stroop': { // mehr richtige Farben gewinnt
      if (num(a) === num(b)) return tie(first, `Beide ${num(a)} Treffer – Zeitvorteil entscheidet`)
      const w = num(a) > num(b) ? a : b
      return { winnerId: w.player_id, detail: `${num(a)} vs. ${num(b)} Treffer` }
    }
    case 'typing': { // schneller fehlerfrei getippt gewinnt (value = ms)
      if (num(a) === num(b)) return tie(first, 'Gleich schnell – Zeitvorteil entscheidet')
      const w = num(a) < num(b) ? a : b
      const fmt = (x) => (Number(x.value) / 1000).toFixed(1)
      return { winnerId: w.player_id, detail: `${fmt(a)}s vs. ${fmt(b)}s` }
    }
    case 'math': { // mehr richtig gerechnet gewinnt
      if (num(a) === num(b)) return tie(first, `Beide ${num(a)} richtig – Zeitvorteil entscheidet`)
      const w = num(a) > num(b) ? a : b
      return { winnerId: w.player_id, detail: `${num(a)} vs. ${num(b)} richtig` }
    }
    case 'aim': { // geringere Gesamt-Abweichung gewinnt (value = Summe in %)
      if (num(a) === num(b)) return tie(first, 'Gleich präzise – Zeitvorteil entscheidet')
      const w = num(a) < num(b) ? a : b
      return { winnerId: w.player_id, detail: `${num(a)} vs. ${num(b)} Abweichung (kleiner ist besser)` }
    }
    case 'estimate':
      return null // braucht die duelId → computeEstimateWinner nutzen
    default:
      return null
  }
}

export function computeEstimateWinner(duelId, a, b) {
  const qs = estimatesFor(duelId)
  const ga = JSON.parse(a.value || '[]')
  const gb = JSON.parse(b.value || '[]')
  let sa = 0, sb = 0
  qs.forEach((q, i) => {
    const da = Math.abs((ga[i] ?? Infinity) - q.answer)
    const db = Math.abs((gb[i] ?? Infinity) - q.answer)
    if (da < db) sa++
    else if (db < da) sb++
  })
  const first = new Date(a.created_at) <= new Date(b.created_at) ? a : b
  if (sa === sb) return tie(first, `${sa}:${sb} – Zeitvorteil entscheidet`)
  return { winnerId: sa > sb ? a.player_id : b.player_id, detail: `Schätz-Punkte ${sa}:${sb}` }
}

function tie(firstAnswer, msg) {
  return { winnerId: firstAnswer.player_id, detail: msg }
}

// ---------- Statistiken aus der Duell-Historie ----------
export function statsFromHistory(history = []) {
  const stats = {}
  const bump = (id, key) => {
    if (!id) return
    stats[id] = stats[id] || { wins: 0, losses: 0 }
    stats[id][key]++
  }
  history.forEach((h) => {
    if (h.type !== 'duel' || !h.winner) return
    bump(h.winner, 'wins')
    const loser = h.winner === h.groomId ? h.challengerId : h.groomId
    bump(loser, 'losses')
  })
  return stats
}

// ---------- Mehrheitsentscheid ----------
// Entscheidet, sobald eine Mehrheit uneinholbar ist – sonst erst, wenn alle
// abgestimmt haben. Gleichstand → null (dann entscheidet der Organisator).
export function majorityWinner(votes, voterCount) {
  if (!voterCount) return null
  const counts = {}
  votes.forEach((v) => { counts[v.value] = (counts[v.value] || 0) + 1 })
  const [top, second] = Object.entries(counts).sort((a, b) => b[1] - a[1])
  if (!top) return null
  const uneinholbar = top[1] > voterCount / 2
  const alleDa = votes.length >= voterCount
  if (!uneinholbar && !alleDa) return null
  if (!uneinholbar && second && top[1] === second[1]) return null
  return { value: top[0], count: top[1], total: votes.length }
}

// ---------- Auslosung ----------
// Faire Rotation: Wer bisher am seltensten dran war, kommt als Nächstes.
// Bei Gleichstand entscheidet der Zufall.
export function drawChallenger(crew, history = []) {
  if (!crew.length) return null
  const counts = Object.fromEntries(crew.map((p) => [p.id, 0]))
  history.forEach((h) => {
    if (h.type === 'duel' && counts[h.challengerId] != null) counts[h.challengerId]++
  })
  const min = Math.min(...Object.values(counts))
  const pool = crew.filter((p) => counts[p.id] === min)
  return pool[Math.floor(Math.random() * pool.length)]
}

// Zufällige Disziplin, die zur aktuellen Situation passt.
// Schon gespielte kommen erst wieder dran, wenn alle durch sind.
export function drawDiscipline(disciplines, context, history = [], fits) {
  const used = new Set(history.filter((h) => h.type === 'duel').map((h) => h.discipline))
  const fit = disciplines.filter((d) => fits(d, context))
  if (!fit.length) return null
  const fresh = fit.filter((d) => !used.has(d.id))
  const pool = fresh.length ? fresh : fit
  return pool[Math.floor(Math.random() * pool.length)]
}

// Wie oft war jeder schon dran (für die Anzeige)
export function duelCounts(crew, history = []) {
  const counts = Object.fromEntries(crew.map((p) => [p.id, 0]))
  history.forEach((h) => {
    if (h.type === 'duel' && counts[h.challengerId] != null) counts[h.challengerId]++
  })
  return counts
}

// Crew-Meter: Duell-Siege Crew vs. Bräutigam
export function crewMeter(history = []) {
  let crew = 0, groom = 0
  history.forEach((h) => {
    if (h.type !== 'duel' || !h.winner) return
    if (h.winner === h.groomId) groom++
    else crew++
  })
  return { crew, groom }
}
