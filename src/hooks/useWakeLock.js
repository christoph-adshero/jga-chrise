import { useEffect } from 'react'

// Hält den Bildschirm während aktiver Mini-Games wach (Wake Lock API).
// Fällt still zurück, wenn der Browser es nicht unterstützt.
export function useWakeLock(active = true) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let lock = null
    let released = false

    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request('screen')
      } catch {}
    }
    acquire()

    const onVisible = () => {
      if (document.visibilityState === 'visible' && !released) acquire()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      released = true
      document.removeEventListener('visibilitychange', onVisible)
      try { lock && lock.release() } catch {}
    }
  }, [active])
}
