import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import { createSession, getSessionByCode, joinSession } from '../lib/api'
import { saveLocal } from '../lib/storage'
import { supabaseConfigured } from '../lib/supabase'

export default function Home() {
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const handleJoin = async () => {
    setErr('')
    if (!name.trim()) return setErr('Bitte Namen eingeben.')
    if (!code.trim()) return setErr('Bitte Join-Code eingeben.')
    setBusy(true)
    try {
      const session = await getSessionByCode(code.trim())
      if (!session) { setErr('Keine Session mit diesem Code gefunden.'); setBusy(false); return }
      const player = await joinSession(session.id, name.trim())
      saveLocal({ playerId: player.id, sessionId: session.id, name: player.name })
      nav(`/play/${session.id}`)
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  const handleCreate = async () => {
    setErr('')
    if (!name.trim()) return setErr('Bitte Namen eingeben (du bist der Organisator).')
    setBusy(true)
    try {
      const session = await createSession()
      const player = await joinSession(session.id, name.trim())
      saveLocal({ playerId: player.id, sessionId: session.id, name: player.name, isAdmin: true })
      nav(`/play/${session.id}`)
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Layout subtitle="8.–9. August 2026" title="JGA Chrise 🍻">
      <div className="card p-5 text-center">
        <div className="text-6xl mb-2">🥊👑🍺</div>
        <p className="text-white/70">
          <b className="text-white">CREW vs. BRÄUTIGAM.</b><br />
          6 Männer. 1 Wochenende. Jeder duelliert den Bräutigam –
          die anderen wetten. Wer nicht liefert, trinkt.
        </p>
      </div>

      <div className="card p-4 space-y-3">
        <label className="block">
          <span className="text-sm text-white/60">Dein Name</span>
          <input className="input mt-1" value={name} maxLength={20}
                 onChange={(e) => setName(e.target.value)} placeholder="z.B. Tobi" />
        </label>

        <label className="block">
          <span className="text-sm text-white/60">Join-Code (von der Gruppe)</span>
          <input className="input mt-1 uppercase tracking-widest" value={code} maxLength={8}
                 onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="z.B. BIER42" />
        </label>

        {err && <p className="text-brand text-sm">{err}</p>}

        <button className="btn-primary w-full text-lg" disabled={busy || !supabaseConfigured} onClick={handleJoin}>
          {busy ? '…' : 'Beitreten'}
        </button>
      </div>

      <div className="text-center text-white/40 text-sm">— oder —</div>

      <button className="btn-gold w-full" disabled={busy || !supabaseConfigured} onClick={handleCreate}>
        Neue Runde erstellen (Organisator)
      </button>

      <p className="text-white/30 text-xs text-center">
        Kein Login nötig. Dein Name bleibt auf diesem Handy gespeichert.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Link to="/plan" className="btn-gold">🗺️ Der Plan</Link>
        <Link to="/training" className="btn-ghost">🏋️ Üben</Link>
      </div>
    </Layout>
  )
}
