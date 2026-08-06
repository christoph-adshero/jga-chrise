// Mini-Sound-Engine ohne Audio-Dateien: alles per WebAudio-Oszillator.
// Browser erlauben Ton erst nach der ersten Nutzer-Interaktion – vorher
// schlagen die Aufrufe still fehl (try/catch), nichts blockiert.

let ctx = null
const ac = () => {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

function tone(freq, start, dur, type = 'triangle', vol = 0.12) {
  const a = ac()
  const o = a.createOscillator()
  const g = a.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.setValueAtTime(0, a.currentTime + start)
  g.gain.linearRampToValueAtTime(vol, a.currentTime + start + 0.02)
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + start + dur)
  o.connect(g).connect(a.destination)
  o.start(a.currentTime + start)
  o.stop(a.currentTime + start + dur + 0.05)
}

export const sounds = {
  // Duell-Start: kurzes „Kampfansage"-Riff
  vs() {
    try {
      tone(196, 0, 0.12, 'sawtooth', 0.08)
      tone(196, 0.14, 0.12, 'sawtooth', 0.08)
      tone(392, 0.3, 0.3, 'sawtooth', 0.1)
    } catch {}
  },
  // Sieg: kleine Fanfare
  win() {
    try {
      tone(523, 0, 0.12)      // C
      tone(659, 0.12, 0.12)   // E
      tone(784, 0.24, 0.12)   // G
      tone(1047, 0.36, 0.4)   // C hoch
    } catch {}
  },
  // Wette verloren: trauriges Wah-wah
  lose() {
    try {
      tone(330, 0, 0.2, 'sine', 0.1)
      tone(294, 0.2, 0.2, 'sine', 0.1)
      tone(262, 0.4, 0.45, 'sine', 0.1)
    } catch {}
  },
  // Bier: kurzes „Pling-Gluck"
  beer() {
    try {
      tone(880, 0, 0.08, 'sine', 0.1)
      tone(660, 0.08, 0.1, 'sine', 0.08)
      tone(440, 0.18, 0.14, 'sine', 0.08)
    } catch {}
  }
}
