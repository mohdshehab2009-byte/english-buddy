import { bubbleColor, wordEmoji } from '../../lib/games'
import type { VocabularyItem } from '../../types'

export function WordBubble({ item, size = 'md' }: { item: VocabularyItem; size?: 'md' | 'lg' }) {
  const emoji = wordEmoji(item)
  const dimensions = size === 'lg' ? 'h-24 w-24 text-5xl rounded-[2rem]' : 'h-14 w-14 text-2xl rounded-2xl'
  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center bg-gradient-to-br font-black text-white shadow-inner shadow-white/40 ${bubbleColor(item.english)} ${dimensions}`}
    >
      {emoji ?? item.english.trim().charAt(0).toUpperCase()}
    </div>
  )
}

export function Stars({ count, max = 3, className = '' }: { count: number; max?: number; className?: string }) {
  return (
    <span className={`tracking-tight ${className}`} aria-label={`${count} of ${max} stars`}>
      {Array.from({ length: max }, (_, index) => (
        <span key={index} className={index < count ? '' : 'opacity-25 grayscale'}>⭐</span>
      ))}
    </span>
  )
}
