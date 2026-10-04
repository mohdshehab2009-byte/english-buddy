import { initialVocabulary } from '../data/mockData'
import type { VocabularyItem } from '../types'
import { isSupabaseConfigured, supabase } from './supabase'

const mapRow = (row: Record<string, unknown>): VocabularyItem => ({
  id: String(row.id ?? row.english ?? Math.random().toString(36).slice(2)),
  english: String(row.english ?? ''),
  arabic: String(row.arabic ?? ''),
  example: String(row.example_sentence ?? row.example ?? ''),
  pronunciation: String(row.pronunciation ?? '/ˈpræktɪs/'),
  unit: String(row.unit ?? 'Nature'),
  week: String(row.week ?? 'Week 1'),
  difficulty: (String(row.difficulty ?? 'Easy') as VocabularyItem['difficulty']),
  category: String(row.category ?? 'General'),
  image: typeof row.image === 'string' ? row.image : '📖',
})

export async function loadVocabulary(): Promise<VocabularyItem[]> {
  if (!isSupabaseConfigured || !supabase) {
    return initialVocabulary
  }

  const { data, error } = await supabase.from('vocabulary').select('*').order('created_at', { ascending: false })

  if (error) {
    console.error('Vocabulary fetch error:', error)
    return initialVocabulary
  }

  if (!data || !data.length) {
    return initialVocabulary
  }

  return data.map(mapRow)
}

export async function addVocabularyItem(item: VocabularyItem): Promise<VocabularyItem> {
  if (!isSupabaseConfigured || !supabase) {
    return item
  }

  const { data, error } = await supabase
    .from('vocabulary')
    .insert({
      english: item.english,
      arabic: item.arabic,
      example_sentence: item.example,
      pronunciation: item.pronunciation,
      unit: item.unit,
      week: item.week,
      difficulty: item.difficulty,
      category: item.category,
      image: item.image,
    })
    .select()
    .single()

  if (error) {
    console.error('Vocabulary insert error:', error)
    return item
  }

  return mapRow(data)
}

export async function updateVocabularyItem(id: string, item: VocabularyItem): Promise<VocabularyItem> {
  if (!isSupabaseConfigured || !supabase) {
    return item
  }

  const { data, error } = await supabase
    .from('vocabulary')
    .update({
      english: item.english,
      arabic: item.arabic,
      example_sentence: item.example,
      pronunciation: item.pronunciation,
      unit: item.unit,
      week: item.week,
      difficulty: item.difficulty,
      category: item.category,
      image: item.image,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Vocabulary update error:', error)
    return item
  }

  return mapRow(data)
}

export async function deleteVocabularyItem(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    return
  }

  const { error } = await supabase.from('vocabulary').delete().eq('id', id)

  if (error) {
    console.error('Vocabulary delete error:', error)
  }
}
