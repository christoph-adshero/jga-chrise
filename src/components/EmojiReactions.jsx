import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'

const EMOJIS = ['🔥', '😂', '💀', '🍺', '👑', '💪']

// Live-Emoji-Reaktionen via Supabase Broadcast – fliegen auf allen Handys hoch.
export default function EmojiReactions({ sessionId }) {
  const [flying, setFlying] = useState([])
  const channelRef = useRef(null)
  const idRef = useRef(0)

  const spawn = useCallback((emoji) => {
    const id = ++idRef.current
    const left = 10 + Math.random() * 80
    setFlying((f) => [...f.slice(-14), { id, emoji, left }])
    setTimeout(() => setFlying((f) => f.filter((x) => x.id !== id)), 2400)
  }, [])

  useEffect(() => {
    if (!supabaseConfigured || !sessionId) return
    const channel = supabase.channel(`fx-${sessionId}`)
    channel.on('broadcast', { event: 'emoji' }, ({ payload }) => spawn(payload.e)).subscribe()
    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [sessionId, spawn])

  const send = (e) => {
    spawn(e) // sofort lokal
    channelRef.current?.send({ type: 'broadcast', event: 'emoji', payload: { e } })
  }

  return (
    <>
      {/* fliegende Emojis */}
      <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
        {flying.map((f) => (
          <span key={f.id} className="absolute bottom-24 text-3xl animate-flyUp" style={{ left: `${f.left}%` }}>
            {f.emoji}
          </span>
        ))}
      </div>
      {/* Reaktions-Leiste */}
      <div className="flex justify-center gap-1.5">
        {EMOJIS.map((e) => (
          <button key={e} onClick={() => send(e)}
            className="w-10 h-10 grid place-items-center text-xl bg-panel2 border border-line rounded-full active:scale-90 transition">
            {e}
          </button>
        ))}
      </div>
    </>
  )
}
