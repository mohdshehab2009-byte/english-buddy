import type { Achievement, ChildProfile, ProgressStat, QuizQuestion, VocabularyItem } from '../types'

export const childProfile: ChildProfile = {
  name: 'Mujtaba',
  avatar: '🧒',
  streak: 0,
  points: 0,
  level: 'Explorer',
}

export const progressStats: ProgressStat[] = [
  { id: 'words', label: 'Words mastered', value: 18, goal: 20, tone: 'sky' },
  { id: 'spelling', label: 'Spelling', value: 82, goal: 100, tone: 'green' },
  { id: 'translation', label: 'Translation', value: 74, goal: 100, tone: 'amber' },
  { id: 'quiz', label: 'Weekly quiz', value: 88, goal: 100, tone: 'rose' },
]

export const achievements: Achievement[] = [
  { id: 'first-steps', title: 'First Steps', description: 'Learn 5 words', unlocked: true, icon: '⭐' },
  { id: 'word-hero', title: 'Word Hero', description: 'Score 80% in a quiz', unlocked: true, icon: '🏆' },
  { id: 'daily-boost', title: 'Daily Boost', description: 'Practice 5 days in a row', unlocked: false, icon: '🔥' },
  { id: 'perfect-speller', title: 'Perfect Speller', description: 'Get 100% spelling score', unlocked: false, icon: '✨' },
]

const shuffle = <T,>(items: T[]): T[] => {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const currentItem = shuffled[index]
    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = currentItem
  }
  return shuffled
}

export function createVocabularyQuestion(item: VocabularyItem, vocabulary: VocabularyItem[]): QuizQuestion {
  const distractors = [...new Set(
    vocabulary.filter((candidate) => candidate.id !== item.id).map((candidate) => candidate.arabic),
  )].filter((meaning) => meaning !== item.arabic)

  const choices = shuffle([item.arabic, ...shuffle(distractors).slice(0, 3)])

  return {
    id: item.id,
    prompt: `What is the Arabic meaning of “${item.english}”?`,
    choices,
    answer: item.arabic,
    explanation: item.example || `${item.english} means ${item.arabic}.`,
  }
}

export function createVocabularyQuiz(vocabulary: VocabularyItem[]): QuizQuestion[] {
  if (!vocabulary.length) return []

  const questions: QuizQuestion[] = []
  while (questions.length < 15) {
    for (const item of shuffle(vocabulary)) {
      questions.push(createVocabularyQuestion(item, vocabulary))
      if (questions.length === 15) break
    }
  }
  return questions
}

export function createWeightedVocabularyQuestion(
  vocabulary: VocabularyItem[],
  incorrectAnswers: Record<string, number>,
): QuizQuestion {
  const totalWeight = vocabulary.reduce(
    (total, item) => total + 1 + (incorrectAnswers[item.id] ?? 0) * 4,
    0,
  )
  let choice = Math.random() * totalWeight

  for (const item of vocabulary) {
    choice -= 1 + (incorrectAnswers[item.id] ?? 0) * 4
    if (choice < 0) return createVocabularyQuestion(item, vocabulary)
  }

  const fallback = vocabulary[vocabulary.length - 1]
  if (!fallback) throw new Error('Cannot create a quiz question without vocabulary.')
  return createVocabularyQuestion(fallback, vocabulary)
}
