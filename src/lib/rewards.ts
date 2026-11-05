import { useCallback, useEffect, useRef, useState } from 'react'
import { canSyncRewards, CHILD_ID_PATTERN, fetchRemoteRewards, getOrCreateChildId, normalizeChildId, saveRemoteRewards, storeChildId } from './childSync'

// Stars, streaks and daily missions live on this device so they work even without a parent signing in.

export interface RewardState {
  stars: number
  streak: number
  bestStreak: number
  lastActiveDay: string | null
  wordsAdded: number
  correctSpellings: number
  correctTranslations: number
  correctListening: number
  quizzesDone: number
  bestQuizPercent: number
  today: {
    day: string
    practiced: number
    quizDone: boolean
    wordAdded: boolean
  }
}

export type RewardEvent =
  | { kind: 'spelling'; correct: boolean }
  | { kind: 'translation'; correct: boolean }
  | { kind: 'listening'; correct: boolean }
  | { kind: 'quiz-answer'; correct: boolean }
  | { kind: 'quiz-finished'; score: number; total: number }
  | { kind: 'word-added' }

const STORAGE_KEY = 'english-buddy:rewards'
export const DAILY_PRACTICE_GOAL = 5

const dayKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const yesterdayKey = () => {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return dayKey(date)
}

const emptyToday = () => ({ day: dayKey(), practiced: 0, quizDone: false, wordAdded: false })

const initialState = (): RewardState => ({
  stars: 0,
  streak: 0,
  bestStreak: 0,
  lastActiveDay: null,
  wordsAdded: 0,
  correctSpellings: 0,
  correctTranslations: 0,
  correctListening: 0,
  quizzesDone: 0,
  bestQuizPercent: 0,
  today: emptyToday(),
})

/** Fill in missing fields, start a fresh day and break the streak if a day was missed. */
function normalize(raw: Partial<RewardState> | null | undefined): RewardState {
  const base = initialState()
  const saved: RewardState = { ...base, ...(raw ?? {}), today: { ...base.today, ...(raw?.today ?? {}) } }
  for (const key of ['stars', 'streak', 'bestStreak', 'wordsAdded', 'correctSpellings', 'correctTranslations', 'correctListening', 'quizzesDone', 'bestQuizPercent'] as const) {
    saved[key] = Math.max(0, Math.floor(Number(saved[key]) || 0))
  }
  if (saved.today.day !== dayKey()) saved.today = emptyToday()
  if (saved.lastActiveDay && saved.lastActiveDay !== dayKey() && saved.lastActiveDay !== yesterdayKey()) {
    saved.streak = 0
  }
  return saved
}

/** Combine two copies (this device + the cloud) without losing progress from either. */
export function mergeRewards(a: RewardState, b: RewardState): RewardState {
  const later = (a.lastActiveDay ?? '') >= (b.lastActiveDay ?? '') ? a : b
  const sameDay = a.lastActiveDay === b.lastActiveDay
  const todayA = a.today.day === dayKey() ? a.today : emptyToday()
  const todayB = b.today.day === dayKey() ? b.today : emptyToday()
  return normalize({
    stars: Math.max(a.stars, b.stars),
    streak: sameDay ? Math.max(a.streak, b.streak) : later.streak,
    bestStreak: Math.max(a.bestStreak, b.bestStreak),
    lastActiveDay: later.lastActiveDay,
    wordsAdded: Math.max(a.wordsAdded, b.wordsAdded),
    correctSpellings: Math.max(a.correctSpellings, b.correctSpellings),
    correctTranslations: Math.max(a.correctTranslations, b.correctTranslations),
    correctListening: Math.max(a.correctListening, b.correctListening),
    quizzesDone: Math.max(a.quizzesDone, b.quizzesDone),
    bestQuizPercent: Math.max(a.bestQuizPercent, b.bestQuizPercent),
    today: {
      day: dayKey(),
      practiced: Math.max(todayA.practiced, todayB.practiced),
      quizDone: todayA.quizDone || todayB.quizDone,
      wordAdded: todayA.wordAdded || todayB.wordAdded,
    },
  })
}

function load(): RewardState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return normalize(raw ? (JSON.parse(raw) as Partial<RewardState>) : null)
  } catch {
    return initialState()
  }
}

function save(state: RewardState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Without storage, rewards last only for this visit.
  }
}

/** Stars earned for each event. */
export function starsFor(event: RewardEvent): number {
  switch (event.kind) {
    case 'spelling':
      return event.correct ? 3 : 0
    case 'translation':
    case 'listening':
    case 'quiz-answer':
      return event.correct ? 1 : 0
    case 'quiz-finished':
      return event.total && event.score === event.total ? 10 : event.total && event.score / event.total >= 0.8 ? 5 : 2
    case 'word-added':
      return 2
  }
}

export function applyEvent(previous: RewardState, event: RewardEvent): RewardState {
  const today = dayKey()
  const state: RewardState = { ...previous, today: previous.today.day === today ? { ...previous.today } : emptyToday() }

  if (state.lastActiveDay !== today) {
    state.streak = state.lastActiveDay === yesterdayKey() ? state.streak + 1 : 1
    state.bestStreak = Math.max(state.bestStreak, state.streak)
    state.lastActiveDay = today
  }

  state.stars += starsFor(event)

  switch (event.kind) {
    case 'spelling':
      state.today.practiced += 1
      if (event.correct) state.correctSpellings += 1
      break
    case 'translation':
      state.today.practiced += 1
      if (event.correct) state.correctTranslations += 1
      break
    case 'listening':
      state.today.practiced += 1
      if (event.correct) state.correctListening += 1
      break
    case 'quiz-answer':
      break
    case 'quiz-finished':
      state.quizzesDone += 1
      state.today.quizDone = true
      if (event.total) state.bestQuizPercent = Math.max(state.bestQuizPercent, Math.round((event.score / event.total) * 100))
      break
    case 'word-added':
      state.wordsAdded += 1
      state.today.wordAdded = true
      break
  }
  return state
}

export type SyncStatus = 'local' | 'syncing' | 'synced' | 'offline'

export function useRewards() {
  const [rewards, setRewards] = useState<RewardState>(load)
  const [child] = useState(getOrCreateChildId)
  const [childId, setChildId] = useState(child.id)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(canSyncRewards ? 'syncing' : 'local')
  const [loadedFromCloud, setLoadedFromCloud] = useState(false)
  const rewardsRef = useRef(rewards)

  useEffect(() => {
    rewardsRef.current = rewards
    save(rewards)
  }, [rewards])

  /** Fetch the cloud copy, merge it with this device and save the result back. */
  const syncNow = useCallback(async (id: string) => {
    if (!canSyncRewards) return
    try {
      const remote = await fetchRemoteRewards(id)
      const merged = remote ? mergeRewards(rewardsRef.current, normalize(remote as Partial<RewardState>)) : rewardsRef.current
      rewardsRef.current = merged
      setRewards(merged)
      await saveRemoteRewards(id, merged)
      setLoadedFromCloud(true)
      setSyncStatus('synced')
    } catch {
      setSyncStatus('offline')
    }
  }, [])

  // Sync when the app opens and whenever the child comes back to this tab.
  useEffect(() => {
    if (!canSyncRewards) return
    void syncNow(childId)
    const onFocus = () => {
      if (document.visibilityState === 'visible') void syncNow(childId)
    }
    document.addEventListener('visibilitychange', onFocus)
    window.addEventListener('focus', onFocus)
    return () => {
      document.removeEventListener('visibilitychange', onFocus)
      window.removeEventListener('focus', onFocus)
    }
  }, [childId, syncNow])

  // Save changes to the cloud shortly after they happen.
  useEffect(() => {
    if (!canSyncRewards || !loadedFromCloud) return
    const timer = window.setTimeout(() => {
      void saveRemoteRewards(childId, rewards)
        .then(() => setSyncStatus('synced'))
        .catch(() => setSyncStatus('offline'))
    }, 800)
    return () => window.clearTimeout(timer)
  }, [rewards, childId, loadedFromCloud])

  const record = useCallback((event: RewardEvent) => {
    setRewards((current) => applyEvent(current, event))
    return starsFor(event)
  }, [])

  /** Use a Buddy ID from another device. Progress from both devices is combined. */
  const linkChildId = useCallback(async (value: string): Promise<string | null> => {
    const id = normalizeChildId(value)
    if (!CHILD_ID_PATTERN.test(id)) return 'A Buddy ID looks like STAR-7K3Q (4 letters/numbers, a dash, 4 more).'
    if (id === childId) return 'This device already uses that Buddy ID.'
    if (!canSyncRewards) return 'Syncing needs the online database. Ask a grown-up to set up Supabase.'
    try {
      const remote = await fetchRemoteRewards(id)
      if (!remote) return 'We couldn’t find that Buddy ID. Check the letters and try again.'
      const merged = mergeRewards(rewardsRef.current, normalize(remote as Partial<RewardState>))
      rewardsRef.current = merged
      setRewards(merged)
      await saveRemoteRewards(id, merged)
      storeChildId(id)
      setChildId(id)
      setLoadedFromCloud(true)
      setSyncStatus('synced')
      return null
    } catch {
      return 'Could not connect right now. Please try again in a moment.'
    }
  }, [childId])

  return { rewards, record, childId, isNewDevice: child.isNew && childId === child.id, syncStatus, linkChildId }
}

export interface KidAchievement {
  id: string
  title: string
  description: string
  icon: string
  progress: number
  goal: number
}

export function computeAchievements(rewards: RewardState, wordCount: number): KidAchievement[] {
  return [
    { id: 'first-word', title: 'Word Collector', description: 'Have 5 words in My Words', icon: '📚', progress: wordCount, goal: 5 },
    { id: 'big-list', title: 'Word Treasure', description: 'Have 25 words in My Words', icon: '💎', progress: wordCount, goal: 25 },
    { id: 'first-quiz', title: 'Quiz Explorer', description: 'Finish your first quiz', icon: '🧭', progress: rewards.quizzesDone, goal: 1 },
    { id: 'word-hero', title: 'Word Hero', description: 'Score 80% or more in a quiz', icon: '🏆', progress: rewards.bestQuizPercent, goal: 80 },
    { id: 'perfect-quiz', title: 'Perfect Score', description: 'Get every quiz question right', icon: '🌈', progress: rewards.bestQuizPercent, goal: 100 },
    { id: 'speller', title: 'Super Speller', description: 'Spell 10 words correctly', icon: '✨', progress: rewards.correctSpellings, goal: 10 },
    { id: 'listener', title: 'Super Ears', description: 'Win 10 listening games', icon: '👂', progress: rewards.correctListening, goal: 10 },
    { id: 'streak-3', title: 'On Fire', description: 'Learn 3 days in a row', icon: '🔥', progress: rewards.bestStreak, goal: 3 },
    { id: 'streak-7', title: 'Week Champion', description: 'Learn 7 days in a row', icon: '👑', progress: rewards.bestStreak, goal: 7 },
    { id: 'stars-100', title: 'Star Catcher', description: 'Collect 100 stars', icon: '⭐', progress: rewards.stars, goal: 100 },
  ]
}

export const levelFor = (stars: number) => {
  const levels = [
    { name: 'Little Explorer', icon: '🐣', min: 0 },
    { name: 'Word Sprout', icon: '🌱', min: 25 },
    { name: 'Bright Reader', icon: '🦊', min: 75 },
    { name: 'Word Wizard', icon: '🧙', min: 150 },
    { name: 'English Hero', icon: '🦸', min: 300 },
    { name: 'Language Legend', icon: '🐉', min: 600 },
  ]
  const index = levels.findLastIndex((level) => stars >= level.min)
  const current = levels[index]
  const next = levels[index + 1]
  return {
    ...current,
    next: next ?? null,
    progress: next ? Math.round(((stars - current.min) / (next.min - current.min)) * 100) : 100,
  }
}
