import type { VocabularyItem, WordProgress } from '../types'
import { shuffle } from './feedback'

export type GameQuestionKind = 'meaning' | 'listen' | 'english'

export interface GameQuestion {
  key: string
  wordId: string
  kind: GameQuestionKind
  word: VocabularyItem
  prompt: string
  choices: string[]
  answer: string
}

/** Up to `count` distinct wrong answers taken from other words. */
function distractors(word: VocabularyItem, vocabulary: VocabularyItem[], field: 'english' | 'arabic', count = 3) {
  const target = word[field].trim().toLowerCase()
  const options = [...new Set(vocabulary.filter((item) => item.id !== word.id).map((item) => item[field].trim()))]
    .filter((value) => value && value.toLowerCase() !== target)
  return shuffle(options).slice(0, count)
}

export function makeQuestion(word: VocabularyItem, vocabulary: VocabularyItem[], kind: GameQuestionKind): GameQuestion {
  const key = `${word.id}-${kind}-${Math.random().toString(36).slice(2, 8)}`
  if (kind === 'listen') {
    return {
      key,
      wordId: word.id,
      kind,
      word,
      prompt: 'Listen 👂 Which word did you hear?',
      choices: shuffle([word.english, ...distractors(word, vocabulary, 'english')]),
      answer: word.english,
    }
  }
  if (kind === 'english') {
    return {
      key,
      wordId: word.id,
      kind,
      word,
      prompt: `Which English word means “${word.arabic}”?`,
      choices: shuffle([word.english, ...distractors(word, vocabulary, 'english')]),
      answer: word.english,
    }
  }
  return {
    key,
    wordId: word.id,
    kind,
    word,
    prompt: `What does “${word.english}” mean?`,
    choices: shuffle([word.arabic, ...distractors(word, vocabulary, 'arabic')]),
    answer: word.arabic,
  }
}

/** Pick a word, preferring ones with low mastery or recent mistakes. */
export function pickWord(
  vocabulary: VocabularyItem[],
  options: { progress?: Map<string, WordProgress>; mistakes?: Record<string, number>; avoidId?: string } = {},
): VocabularyItem | null {
  if (!vocabulary.length) return null
  const pool = vocabulary.length > 1 && options.avoidId ? vocabulary.filter((item) => item.id !== options.avoidId) : vocabulary
  const weights = pool.map((item) => {
    const mastery = options.progress?.get(item.id)?.mastery ?? 0
    const mistakes = options.mistakes?.[item.id] ?? 0
    return 1 + (100 - mastery) / 50 + mistakes * 4
  })
  let roll = Math.random() * weights.reduce((sum, weight) => sum + weight, 0)
  for (let index = 0; index < pool.length; index += 1) {
    roll -= weights[index]
    if (roll < 0) return pool[index]
  }
  return pool[pool.length - 1]
}

const quizKinds: GameQuestionKind[] = ['meaning', 'listen', 'english']

export const QUIZ_LENGTH = 10

export function randomQuizKind(): GameQuestionKind {
  return quizKinds[Math.floor(Math.random() * quizKinds.length)]
}

export function makeQuizQuestion(
  vocabulary: VocabularyItem[],
  mistakes: Record<string, number>,
  avoidId?: string,
): GameQuestion | null {
  const word = pickWord(vocabulary, { mistakes, avoidId })
  return word ? makeQuestion(word, vocabulary, randomQuizKind()) : null
}

/** Letters for the spelling game: the word's letters plus a few extra, shuffled. */
export function spellingTiles(word: string): { id: number; letter: string }[] {
  const letters = word.toLowerCase().replace(/[^a-z']/g, '').split('')
  const extras = 'aeioustrnl'.split('').filter((letter) => !letters.includes(letter))
  const extraCount = letters.length <= 4 ? 2 : letters.length <= 7 ? 1 : 0
  return shuffle([...letters, ...shuffle(extras).slice(0, extraCount)]).map((letter, id) => ({ id, letter }))
}

export const lettersOnly = (word: string) => word.toLowerCase().replace(/[^a-z']/g, '')

/** 0–3 stars for a word based on saved mastery. */
export const wordStars = (mastery: number) => (mastery >= 100 ? 3 : mastery >= 50 ? 2 : mastery > 0 ? 1 : 0)

const bubbleColors = [
  'from-rose-300 to-pink-400',
  'from-amber-300 to-orange-400',
  'from-lime-300 to-emerald-400',
  'from-sky-300 to-blue-400',
  'from-violet-300 to-purple-400',
  'from-teal-300 to-cyan-400',
]

export function bubbleColor(text: string) {
  let hash = 0
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return bubbleColors[hash % bubbleColors.length]
}

/** Emoji stored with the word, if it's a real one (not the default placeholders). */
export function wordEmoji(item: VocabularyItem): string | null {
  return item.image && !['📖', '🌟', ''].includes(item.image) ? item.image : null
}
