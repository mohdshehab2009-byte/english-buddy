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

export function createVocabularyQuiz(vocabulary: VocabularyItem[]): QuizQuestion[] {
  const candidates = vocabulary.slice(0, 10)
  if (!candidates.length) return []

  return candidates.map((item) => {
    const distractors = [...new Set([
      ...candidates.filter((candidate) => candidate.id !== item.id).map((candidate) => candidate.arabic),
    ])].filter((meaning) => meaning !== item.arabic).slice(0, 3)

    const choices = [item.arabic, ...distractors]
    for (let index = choices.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1))
      const currentChoice = choices[index]
      choices[index] = choices[swapIndex]
      choices[swapIndex] = currentChoice
    }

    return {
      id: item.id,
      prompt: `What is the Arabic meaning of “${item.english}”?`,
      choices,
      answer: item.arabic,
      explanation: item.example || `${item.english} means ${item.arabic}.`,
    }
  })
}
