import { useState } from 'react'

const colors = ['#f43f5e', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#ec4899', '#facc15']

/** A burst of falling confetti. Re-mount it (change `key`) to play again. */
export function Confetti({ pieces = 70 }: { pieces?: number }) {
  const [items] = useState(
    () =>
      Array.from({ length: pieces }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 1.8 + Math.random() * 1.4,
        size: 6 + Math.random() * 8,
        color: colors[index % colors.length],
        round: Math.random() > 0.5,
        drift: (Math.random() - 0.5) * 160,
      })),
  )

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {items.map((item) => (
        <span
          key={item.id}
          className="confetti-piece"
          style={{
            left: `${item.left}%`,
            width: item.size,
            height: item.round ? item.size : item.size * 0.45,
            background: item.color,
            borderRadius: item.round ? '9999px' : '2px',
            animationDelay: `${item.delay}s`,
            animationDuration: `${item.duration}s`,
            ['--drift' as string]: `${item.drift}px`,
          }}
        />
      ))}
    </div>
  )
}

/** Floating "+3 ⭐" badge shown when stars are earned. */
export function StarPop({ amount }: { amount: number }) {
  if (amount <= 0) return null
  return (
    <div aria-live="polite" className="pointer-events-none fixed left-1/2 top-24 z-50 -translate-x-1/2">
      <div className="star-pop rounded-full bg-amber-400 px-5 py-2 text-xl font-black text-white shadow-xl shadow-amber-300">
        +{amount} ⭐
      </div>
    </div>
  )
}
