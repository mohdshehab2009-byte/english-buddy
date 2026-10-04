import type { Achievement, ChildProfile, ProgressStat, QuizQuestion, VocabularyItem } from '../types'

export const childProfile: ChildProfile = {
  name: 'Musa',
  avatar: '🧒',
  streak: 9,
  points: 1260,
  level: 'Explorer',
}

export const initialVocabulary: VocabularyItem[] = [
  {
    id: 'garden',
    english: 'garden',
    arabic: 'حديقة',
    example: 'We played in the garden after school.',
    pronunciation: '/ˈɡɑːrdn/',
    unit: 'Nature',
    week: 'Week 1',
    difficulty: 'Easy',
    category: 'Places',
    image: '🌼',
  },
  {
    id: 'library',
    english: 'library',
    arabic: 'مكتبة',
    example: 'The library is full of interesting books.',
    pronunciation: '/ˈlaɪbreri/',
    unit: 'School',
    week: 'Week 1',
    difficulty: 'Easy',
    category: 'Places',
    image: '📚',
  },
  {
    id: 'brave',
    english: 'brave',
    arabic: 'شجاع',
    example: 'He was brave and spoke in front of the class.',
    pronunciation: '/breɪv/',
    unit: 'Character',
    week: 'Week 2',
    difficulty: 'Medium',
    category: 'Feelings',
    image: '🦁',
  },
  {
    id: 'healthy',
    english: 'healthy',
    arabic: 'صحي',
    example: 'Eating fruit keeps us healthy.',
    pronunciation: '/ˈhɛlθi/',
    unit: 'Health',
    week: 'Week 2',
    difficulty: 'Medium',
    category: 'Body',
    image: '🥗',
  },
  {
    id: 'friendship',
    english: 'friendship',
    arabic: 'صداقة',
    example: 'Friendship is an important part of school life.',
    pronunciation: '/ˈfrendʃɪp/',
    unit: 'Relationships',
    week: 'Week 3',
    difficulty: 'Medium',
    category: 'People',
    image: '🤝',
  },
  {
    id: 'science',
    english: 'science',
    arabic: 'علوم',
    example: 'Science helps us learn how the world works.',
    pronunciation: '/ˈsaɪəns/',
    unit: 'School',
    week: 'Week 3',
    difficulty: 'Medium',
    category: 'Subjects',
    image: '🔬',
  },
  {
    id: 'forest',
    english: 'forest',
    arabic: 'غابة',
    example: 'The fox hid in the forest.',
    pronunciation: '/ˈfɒrɪst/',
    unit: 'Nature',
    week: 'Week 4',
    difficulty: 'Hard',
    category: 'Places',
    image: '🌲',
  },
  {
    id: 'practice',
    english: 'practice',
    arabic: 'ممارسة',
    example: 'You need practice to improve your spelling.',
    pronunciation: '/ˈpræktɪs/',
    unit: 'Learning',
    week: 'Week 4',
    difficulty: 'Hard',
    category: 'Skills',
    image: '🎯',
  },
]

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

  const fallbackMeanings = initialVocabulary.map((item) => item.arabic)

  return candidates.map((item) => {
    const distractors = [...new Set([
      ...candidates.filter((candidate) => candidate.id !== item.id).map((candidate) => candidate.arabic),
      ...fallbackMeanings,
    ])].filter((meaning) => meaning !== item.arabic).slice(0, 3)

    const choices = [item.arabic, ...distractors]
    for (const meaning of fallbackMeanings) {
      if (choices.length === 4) break
      if (!choices.includes(meaning)) choices.push(meaning)
    }
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
