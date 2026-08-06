// ============================================================
//  Plan-Lader
//
//  Der INHALT des Plans (Adressen, Zeiten, Safe-Code) steht bewusst nicht in
//  diesem öffentlichen Repo. Er lebt in plan.local.js (gitignored) und wird
//  per `npm run plan` base64-kodiert nach VITE_PLAN geschrieben – lokal in
//  .env, für den Deploy als GitHub-Secret. Ohne dieses Secret baut die App
//  ganz normal, der Plan bleibt dann einfach leer.
// ============================================================

const EMPTY = {
  BASECAMP: null,
  KEYSAFE_CODE: '',
  DAYS: [],
  PACKLISTE: [],
  OFFENE_BUCHUNGEN: [],
  GEBUCHT: []
}

function decodePlan() {
  const raw = import.meta.env.VITE_PLAN
  if (!raw) return EMPTY
  try {
    const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0))
    return { ...EMPTY, ...JSON.parse(new TextDecoder().decode(bytes)) }
  } catch {
    return EMPTY
  }
}

const PLAN = decodePlan()

export const planLoaded = PLAN.DAYS.length > 0
export const BASECAMP = PLAN.BASECAMP
export const KEYSAFE_CODE = PLAN.KEYSAFE_CODE
export const DAYS = PLAN.DAYS
export const PACKLISTE = PLAN.PACKLISTE
export const OFFENE_BUCHUNGEN = PLAN.OFFENE_BUCHUNGEN
export const GEBUCHT = PLAN.GEBUCHT
