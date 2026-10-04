import type { QuizResult, WordProgress } from '../types'
import { isSupabaseConfigured, supabase } from './supabase'

interface LearningData {
  wordProgress: WordProgress[]
  quizResults: QuizResult[]
}

export async function ensureChildProfile(parentId: string, childName: string): Promise<string> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Learning progress cannot be saved.')
  }

  const { data: existing, error: lookupError } = await supabase
    .from('profiles')
    .select('id,name')
    .eq('parent_id', parentId)
    .maybeSingle()

  if (lookupError) {
    throw new Error(`Could not load the child profile: ${lookupError.message}`)
  }
  if (existing) {
    if (existing.name !== childName) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ name: childName })
        .eq('id', existing.id)

      if (updateError) {
        throw new Error(`Could not update the child profile name: ${updateError.message}`)
      }
    }
    return existing.id
  }

  const { data: created, error: createError } = await supabase
    .from('profiles')
    .insert({ parent_id: parentId, name: childName })
    .select('id')
    .single()

  if (createError) {
    throw new Error(`Could not create the child profile: ${createError.message}`)
  }
  return created.id
}

export async function loadLearningData(profileId: string): Promise<LearningData> {
  if (!supabase) {
    return { wordProgress: [], quizResults: [] }
  }

  const [progressResponse, quizResponse] = await Promise.all([
    supabase
      .from('progress')
      .select('word_id,mastery,spelling_score,translation_score,last_reviewed')
      .eq('profile_id', profileId)
      .order('last_reviewed', { ascending: false }),
    supabase
      .from('quiz_results')
      .select('id,score,total_questions,completed_at')
      .eq('profile_id', profileId)
      .order('completed_at', { ascending: false }),
  ])

  if (progressResponse.error) {
    throw new Error(`Could not load word progress: ${progressResponse.error.message}`)
  }
  if (quizResponse.error) {
    throw new Error(`Could not load quiz history: ${quizResponse.error.message}`)
  }

  return {
    wordProgress: (progressResponse.data ?? []).map((row) => ({
      wordId: row.word_id,
      mastery: row.mastery,
      spellingScore: row.spelling_score,
      translationScore: row.translation_score,
      lastReviewed: row.last_reviewed,
    })),
    quizResults: (quizResponse.data ?? []).map((row) => ({
      id: row.id,
      score: row.score,
      totalQuestions: row.total_questions,
      completedAt: row.completed_at,
    })),
  }
}

export async function saveQuizResult(profileId: string, score: number, totalQuestions: number): Promise<QuizResult> {
  if (!supabase) {
    throw new Error('Supabase is not configured. Quiz results cannot be saved.')
  }

  const { data, error } = await supabase
    .from('quiz_results')
    .insert({ profile_id: profileId, score, total_questions: totalQuestions })
    .select('id,score,total_questions,completed_at')
    .single()

  if (error) {
    throw new Error(`Could not save quiz result: ${error.message}`)
  }

  return {
    id: data.id,
    score: data.score,
    totalQuestions: data.total_questions,
    completedAt: data.completed_at,
  }
}

export async function saveWordPractice(
  profileId: string,
  wordId: string,
  kind: 'spelling' | 'translation',
  score: number,
): Promise<WordProgress> {
  if (!supabase) {
    throw new Error('Supabase is not configured. Word progress cannot be saved.')
  }

  const { data: previous, error: lookupError } = await supabase
    .from('progress')
    .select('mastery,spelling_score,translation_score')
    .eq('profile_id', profileId)
    .eq('word_id', wordId)
    .maybeSingle()

  if (lookupError) {
    throw new Error(`Could not load existing word progress: ${lookupError.message}`)
  }

  const spellingScore = Math.max(previous?.spelling_score ?? 0, kind === 'spelling' ? score : 0)
  const translationScore = Math.max(previous?.translation_score ?? 0, kind === 'translation' ? score : 0)
  const mastery = Math.round((spellingScore + translationScore) / 2)
  const lastReviewed = new Date().toISOString()

  const { data, error } = await supabase
    .from('progress')
    .upsert({
      profile_id: profileId,
      word_id: wordId,
      mastery,
      spelling_score: spellingScore,
      translation_score: translationScore,
      last_reviewed: lastReviewed,
    }, { onConflict: 'profile_id,word_id' })
    .select('word_id,mastery,spelling_score,translation_score,last_reviewed')
    .single()

  if (error) {
    throw new Error(`Could not save word progress: ${error.message}`)
  }

  return {
    wordId: data.word_id,
    mastery: data.mastery,
    spellingScore: data.spelling_score,
    translationScore: data.translation_score,
    lastReviewed: data.last_reviewed,
  }
}
