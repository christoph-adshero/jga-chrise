import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { getSession, listPlayers, listAnswers } from '../lib/api'

// Lädt Session + Spieler und hält beides via Supabase-Realtime live.
// Jede Hook-Instanz braucht einen eigenen Kanalnamen. Supabase liefert für
// denselben Topic dieselbe Channel-Instanz zurück und wirft beim zweiten
// .on() nach dem .subscribe() – das hat vorher die ganze Seite gekillt,
// sobald zwei Komponenten dieselben Daten abonniert haben.
const uniq = () => Math.random().toString(36).slice(2, 9)

export function useSession(sessionId) {
  const [session, setSession] = useState(null)
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const cid = useRef(uniq()).current

  const refresh = useCallback(async () => {
    if (!sessionId || !supabaseConfigured) return
    const [s, p] = await Promise.all([getSession(sessionId), listPlayers(sessionId)])
    setSession(s)
    setPlayers(p)
    setLoading(false)
  }, [sessionId])

  useEffect(() => {
    // Ohne Supabase-Keys: kein Crash, sondern "Session nicht gefunden"-Zustand
    if (!supabaseConfigured) { setLoading(false); return }
    if (!sessionId) return
    refresh()

    const channel = supabase
      .channel(`session-${sessionId}-${cid}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
        (payload) => { if (payload.new?.id) setSession(payload.new) }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `session_id=eq.${sessionId}` },
        () => listPlayers(sessionId).then(setPlayers)
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [sessionId, refresh])

  return { session, players, loading, refresh, setSession }
}

// Live-Liste der Antworten für eine bestimmte Runde/Spiel
export function useAnswers(sessionId, game, roundIndex) {
  const [answers, setAnswers] = useState([])
  const cid = useRef(uniq()).current

  const refresh = useCallback(() => {
    if (!sessionId || game == null || !supabaseConfigured) return
    listAnswers(sessionId, game, roundIndex).then(setAnswers).catch(() => {})
  }, [sessionId, game, roundIndex])

  useEffect(() => {
    if (!sessionId || !supabaseConfigured) return
    refresh()
    const channel = supabase
      .channel(`answers-${sessionId}-${game}-${roundIndex}-${cid}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'answers', filter: `session_id=eq.${sessionId}` },
        () => refresh()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [sessionId, game, roundIndex, refresh])

  return { answers, refresh }
}

