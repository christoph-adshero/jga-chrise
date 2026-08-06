import { supabase, supabaseConfigured } from './supabase'
import { defaultConfig } from './gameData'
import { avatarForName, avatarUrl, CREW_ORDER, CREW_LABELS } from './avatars'

function genCode() {
  // Keine Orts-Hinweise – der Bräutigam soll das Ziel nicht erraten
  const words = ['BIER', 'JGA', 'STAG', 'PROST', 'SAUF', 'GAUDI', 'HOPFN', 'RAUSCH']
  return words[Math.floor(Math.random() * words.length)] +
    Math.floor(10 + Math.random() * 89)
}

function ensure() {
  if (!supabaseConfigured) {
    throw new Error('Supabase ist nicht konfiguriert. Bitte .env mit VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY ausfüllen.')
  }
}

// ---------- Session ----------
export async function createSession(name = 'JGA Chrise') {
  ensure()
  // Code-Kollisionen (unique constraint) → bis zu 3 Versuche mit neuem Code
  let lastError = null
  for (let i = 0; i < 3; i++) {
    const { data, error } = await supabase
      .from('sessions')
      .insert({ code: genCode(), name, config: defaultConfig })
      .select()
      .single()
    if (!error) return data
    lastError = error
    if (error.code !== '23505') break // nur bei Duplicate-Key erneut versuchen
  }
  throw lastError
}

export async function getSessionByCode(code) {
  ensure()
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('code', code.toUpperCase())
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getSession(id) {
  ensure()
  const { data, error } = await supabase.from('sessions').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function updateSession(id, patch) {
  ensure()
  const { error } = await supabase.from('sessions').update(patch).eq('id', id)
  if (error) throw error
}

// ---------- Players ----------
export async function joinSession(sessionId, name) {
  ensure()
  // Bekannte Crew-Mitglieder bekommen ihre Cartoon-Figur sofort zugewiesen
  const imageUrl = avatarForName(name)
  const { data, error } = await supabase
    .from('players')
    .insert({ session_id: sessionId, name, avatar: imageUrl ? { imageUrl } : {} })
    .select()
    .single()
  if (error) throw error
  return data
}

// Test-Crew: füllt die Runde mit Bot-Spielern auf, damit man allein alles
// durchspielen kann. Bots sind über avatar.bot markiert und handeln automatisch.
export async function addTestPlayers(sessionId, existing = []) {
  ensure()
  const have = new Set(existing.map((p) => String(p.name).toLowerCase()))
  const rows = CREW_ORDER
    .filter((file) => !have.has(CREW_LABELS[file].toLowerCase()))
    .map((file) => ({
      session_id: sessionId,
      name: CREW_LABELS[file],
      is_ready: true,
      avatar: { imageUrl: avatarUrl(file), bot: true }
    }))
  if (!rows.length) return []
  const { data, error } = await supabase.from('players').insert(rows).select()
  if (error) throw error
  return data || []
}

// Alle Bots wieder entfernen (echte Spieler bleiben)
export async function removeTestPlayers(sessionId) {
  ensure()
  const { error } = await supabase
    .from('players').delete()
    .eq('session_id', sessionId)
    .filter('avatar->>bot', 'eq', 'true')
  if (error) throw error
}

export async function listPlayers(sessionId) {
  ensure()
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function getPlayer(id) {
  ensure()
  const { data, error } = await supabase
    .from('players').select('id,name,is_groom').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function updatePlayer(id, patch) {
  ensure()
  const { error } = await supabase.from('players').update(patch).eq('id', id)
  if (error) throw error
}

export async function setGroom(sessionId, playerId) {
  ensure()
  await supabase.from('players').update({ is_groom: false }).eq('session_id', sessionId)
  await supabase.from('players').update({ is_groom: true }).eq('id', playerId)
}

export async function addPoints(playerId, delta) {
  ensure()
  const { error } = await supabase.rpc('add_points', { p_player: playerId, p_delta: delta })
  if (error) throw error
}

// Bierzähler: atomar, geht nie unter 0
export async function addBeer(playerId, delta = 1) {
  ensure()
  const { data, error } = await supabase.rpc('add_beer', { p_player: playerId, p_delta: delta })
  if (error) throw error
  return data
}

// ---------- Answers ----------
export async function submitAnswer({ sessionId, playerId, game, roundIndex, value, isCorrect, responseMs, points }) {
  ensure()
  const { error } = await supabase
    .from('answers')
    .upsert(
      {
        session_id: sessionId,
        player_id: playerId,
        game,
        round_index: roundIndex,
        value: value != null ? String(value) : null,
        is_correct: isCorrect ?? null,
        response_ms: responseMs ?? null,
        points: points ?? 0
      },
      { onConflict: 'session_id,player_id,game,round_index' }
    )
  if (error) throw error
}

export async function listAnswers(sessionId, game, roundIndex) {
  ensure()
  let q = supabase.from('answers').select('*').eq('session_id', sessionId).eq('game', game)
  if (roundIndex != null) q = q.eq('round_index', roundIndex)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

// ---------- Duell-Arena ----------

// Setzt den kompletten Duell-Zustand (nur Admin ruft das auf → kein Race)
export async function setDuelState(sessionId, prevState, duelPatch) {
  ensure()
  const state = { ...(prevState || {}), duel: duelPatch }
  const { error } = await supabase.from('sessions').update({ state }).eq('id', sessionId)
  if (error) throw error
}

// Duell atomar auflösen: Claim-Guard + Punkte + Wett-Auszahlung laufen
// serverseitig in EINER Transaktion (resolve_duel in schema.sql).
// Rückgabe true = dieser Aufruf hat den Zuschlag bekommen.
export async function resolveDuelRpc(sessionId, duelId, winnerId, detail = '') {
  ensure()
  const { data, error } = await supabase.rpc('resolve_duel', {
    p_session: sessionId, p_duel_id: String(duelId), p_winner: winnerId, p_detail: String(detail)
  })
  if (error) throw error
  return data === true
}

// Bräutigam-Aufgabe atomar auflösen (resolve_task in schema.sql)
export async function resolveTaskRpc(sessionId, taskId, result) {
  ensure()
  const { data, error } = await supabase.rpc('resolve_task', {
    p_session: sessionId, p_task_id: String(taskId), p_result: result
  })
  if (error) throw error
  return data === true
}

// Historie fortschreiben + aktiven Zustand räumen (nur Admin)
export async function appendHistory(sessionId, prevState, entry, clearKey = 'duel') {
  ensure()
  const history = [...(prevState?.history || []), entry]
  const state = { ...(prevState || {}), history, [clearKey]: null }
  const { error } = await supabase.from('sessions').update({ state }).eq('id', sessionId)
  if (error) throw error
}

// ---------- Wetten & Votes (laufen über die answers-Tabelle) ----------
// Wette: value = JSON {on: <playerId|'ja'|'nein'>, stake: <Einsatz>}
export async function placeBet(sessionId, playerId, game, roundIndex, on, stake) {
  return submitAnswer({
    sessionId, playerId, game, roundIndex,
    value: JSON.stringify({ on, stake })
  })
}

export async function castVote(sessionId, playerId, game, roundIndex, forValue) {
  return submitAnswer({ sessionId, playerId, game, roundIndex, value: forValue })
}
