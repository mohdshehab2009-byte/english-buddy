export type Role = 'child' | 'parent'

export type WordDifficulty = 'Easy' | 'Medium' | 'Hard'

export interface VocabularyItem {
  id: string
  english: string
  arabic: string
  example: string
  pronunciation: string
  unit: string
  week: string
  difficulty: WordDifficulty
  category: string
  image?: string
  canEdit?: boolean
}

export interface ProgressStat {
  id: string
  label: string
  value: number
  goal: number
  tone: 'sky' | 'green' | 'amber' | 'rose'
}

export interface Achievement {
  id: string
  title: string
  description: string
  unlocked: boolean
  icon: string
}

export interface QuizQuestion {
  id: string
  prompt: string
  choices: string[]
  answer: string
  explanation: string
}

export interface ChildProfile {
  name: string
  avatar: string
  streak: number
  points: number
  level: string
}
