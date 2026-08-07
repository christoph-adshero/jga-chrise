import { useEffect, useState } from 'react'

// ============================================================
//  Merkt, wenn eine neuere Version deployed wurde.
//
//  Wichtig, weil Spielinhalte (Fotos, Fragen, Disziplinen) im JS-Bundle
//  stecken: Hätten zwei Duellanten unterschiedliche Stände, bekämen sie
//  unterschiedliche Fotos zu sehen – und die Auswertung wäre Unsinn.
//
//  Erkennung ohne Extra-Datei: Der Dateiname des Bundles enthält einen Hash.
//  Wir holen die index.html frisch und vergleichen den Namen darin mit dem
//  Skript, das gerade läuft.
// ============================================================

const ASSET = /assets\/index-[A-Za-z0-9_-]+\.js/

function laufendesBundle() {
  const s = [...document.querySelectorAll('script[type="module"][src]')]
    .map((el) => el.getAttribute('src'))
    .find((src) => ASSET.test(src))
  return s ? s.match(ASSET)[0] : null
}

export default function UpdateBanner() {
  const [neu, setNeu] = useState(false)

  useEffect(() => {
    const laufend = laufendesBundle()
    if (!laufend) return // Dev-Server: kein gehashtes Bundle, nichts zu prüfen

    let gestoppt = false
    const pruefen = async () => {
      if (gestoppt) return
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}index.html?_=${Date.now()}`, { cache: 'no-store' })
        const treffer = (await res.text()).match(ASSET)
        if (treffer && treffer[0] !== laufend) setNeu(true)
      } catch {
        // offline oder Funkloch – beim nächsten Durchlauf wieder
      }
    }

    pruefen()
    const iv = setInterval(pruefen, 60_000)
    document.addEventListener('visibilitychange', pruefen)
    return () => {
      gestoppt = true
      clearInterval(iv)
      document.removeEventListener('visibilitychange', pruefen)
    }
  }, [])

  if (!neu) return null

  return (
    <button onClick={() => window.location.reload()}
            className="w-full bg-brand text-white text-sm font-semibold px-4 py-2.5 text-center
                       sticky top-0 z-50 active:brightness-90">
      🔄 Neue Version verfügbar – hier tippen zum Aktualisieren
    </button>
  )
}
