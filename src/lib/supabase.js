import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigured = Boolean(url && anon)

// Wenn keine Keys gesetzt sind, läuft die App im Demo-/Offline-Modus weiter,
// statt beim Start zu crashen.
export const supabase = supabaseConfigured
  ? createClient(url, anon, { realtime: { params: { eventsPerSecond: 10 } } })
  : null

export const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || '1909'
