import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export default function QRShare({ url, code }) {
  const [img, setImg] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    QRCode.toDataURL(url, { width: 360, margin: 1, color: { dark: '#0b0b10', light: '#ffffff' } })
      .then(setImg)
      .catch(() => {})
  }, [url])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'JGA Chrise – mitspielen', text: `Join-Code: ${code}`, url }) } catch {}
    } else {
      copy()
    }
  }

  return (
    <div className="card p-4 text-center">
      <p className="text-white/60 text-sm mb-3">Mit der Crew teilen – Handy scannen oder Link öffnen:</p>
      {img && <img src={img} alt="QR-Code" className="mx-auto rounded-xl w-52 h-52" />}
      <div className="mt-3 flex items-center justify-center gap-2">
        <span className="text-white/50 text-sm">Code</span>
        <span className="h-display text-3xl tracking-widest text-gold">{code}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={copy} className="btn-ghost">{copied ? 'Kopiert ✓' : 'Link kopieren'}</button>
        <button onClick={share} className="btn-primary">Teilen</button>
      </div>
    </div>
  )
}
