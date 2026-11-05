// Kid-friendly feedback helpers: read-aloud, little sound effects and cheerful messages.

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  audioContext ??= new Ctor()
  if (audioContext.state === 'suspended') void audioContext.resume()
  return audioContext
}

const SOUND_KEY = 'english-buddy:sound'

export function isSoundOn(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off'
  } catch {
    return true
  }
}

export function setSoundOn(on: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, on ? 'on' : 'off')
  } catch {
    // Storage may be unavailable (private mode); sound simply stays on for this visit.
  }
}

function playNotes(notes: { freq: number; start: number; length: number }[], type: OscillatorType = 'sine') {
  if (!isSoundOn()) return
  const ctx = getAudioContext()
  if (!ctx) return
  const now = ctx.currentTime
  for (const note of notes) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = note.freq
    gain.gain.setValueAtTime(0.0001, now + note.start)
    gain.gain.exponentialRampToValueAtTime(0.18, now + note.start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + note.start + note.length)
    osc.connect(gain).connect(ctx.destination)
    osc.start(now + note.start)
    osc.stop(now + note.start + note.length + 0.05)
  }
}

export const sounds = {
  correct: () => playNotes([
    { freq: 660, start: 0, length: 0.15 },
    { freq: 880, start: 0.12, length: 0.25 },
  ], 'triangle'),
  wrong: () => playNotes([
    { freq: 330, start: 0, length: 0.18 },
    { freq: 262, start: 0.15, length: 0.3 },
  ], 'sine'),
  tap: () => playNotes([{ freq: 520, start: 0, length: 0.08 }], 'triangle'),
  fanfare: () => playNotes([
    { freq: 523, start: 0, length: 0.15 },
    { freq: 659, start: 0.15, length: 0.15 },
    { freq: 784, start: 0.3, length: 0.15 },
    { freq: 1047, start: 0.45, length: 0.45 },
  ], 'triangle'),
}

export function speak(text: string, lang: 'en-US' | 'ar-SA' = 'en-US'): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text.trim()) return false
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  utterance.rate = 0.85
  utterance.pitch = 1.1
  const voice = window.speechSynthesis.getVoices().find((item) => item.lang.startsWith(lang.slice(0, 2)))
  if (voice) utterance.voice = voice
  window.speechSynthesis.speak(utterance)
  return true
}

const cheers = ['Awesome!', 'Super star!', 'You did it!', 'Brilliant!', 'Great job!', 'Fantastic!', 'Wow, amazing!', 'High five! ✋']
const nudges = ['Almost! Try again.', 'Good try! Let’s look again.', 'Oops! You can do it.', 'Nice try! Keep going.']

const pick = (items: string[]) => items[Math.floor(Math.random() * items.length)]

export const cheer = () => pick(cheers)
export const nudge = () => pick(nudges)

export function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[swap]] = [result[swap], result[index]]
  }
  return result
}
