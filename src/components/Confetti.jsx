// Simples CSS-Konfetti für Sieg-Momente – kein Canvas, keine Lib.
const COLORS = ['#e11d48', '#f5b400', '#34d399', '#2563eb', '#f43f5e', '#7c3aed']

export default function Confetti({ count = 40 }) {
  const pieces = Array.from({ length: count }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 1.8 + Math.random() * 1.4,
    color: COLORS[i % COLORS.length],
    rot: Math.random() * 360,
    size: 6 + Math.random() * 6
  }))
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p, i) => (
        <span key={i}
          className="absolute -top-4 animate-confetti rounded-sm"
          style={{
            left: `${p.left}%`, width: p.size, height: p.size * 0.6,
            background: p.color, transform: `rotate(${p.rot}deg)`,
            animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`
          }} />
      ))}
    </div>
  )
}
