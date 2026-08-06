// Kleiner localStorage-Helfer, damit ein Spieler nach Reload in seiner
// Session + Identität bleibt (kein Login nötig).

const KEY = 'jga-crew'

export function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

export function saveLocal(patch) {
  const next = { ...loadLocal(), ...patch }
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function clearLocal() {
  localStorage.removeItem(KEY)
}
