import type { VocabularyItem } from '../types'
import { isSupabaseConfigured, supabase } from './supabase'

const mapRow = (row: Record<string, unknown>, canEdit = false): VocabularyItem => ({
  id: String(row.id),
  english: String(row.english ?? ''),
  arabic: String(row.arabic ?? ''),
  example: String(row.example_sentence ?? row.example ?? ''),
  pronunciation: String(row.pronunciation ?? '/ˈpræktɪs/'),
  unit: String(row.unit ?? 'New words'),
  week: String(row.week ?? 'Added words'),
  difficulty: (String(row.difficulty ?? 'Easy') as VocabularyItem['difficulty']),
  category: String(row.category ?? 'General'),
  image: typeof row.image === 'string' ? row.image : '📖',
  canEdit,
})

export async function loadVocabulary(userId?: string): Promise<VocabularyItem[]> {
  if (!isSupabaseConfigured || !supabase) {
    return []
  }

  const fields = 'id,english,arabic,example_sentence,pronunciation,unit,week,difficulty,category,image'
  const [vocabularyResult, ownedResult] = await Promise.all([
    supabase.from('vocabulary').select(fields).order('created_at', { ascending: false }),
    userId ? supabase.from('vocabulary').select('id').eq('owner_id', userId) : Promise.resolve({ data: [], error: null }),
  ])

  if (vocabularyResult.error) {
    throw new Error(`Could not load vocabulary: ${vocabularyResult.error.message}`)
  }

  if (ownedResult.error) {
    throw new Error(`Could not load your editable vocabulary: ${ownedResult.error.message}`)
  }

  const ownedIds = new Set((ownedResult.data ?? []).map((row) => row.id))
  return (vocabularyResult.data ?? []).map((row) => mapRow(row, ownedIds.has(row.id)))
}

export async function addVocabularyItem(
  item: VocabularyItem,
  options: { childContribution?: boolean } = {},
): Promise<VocabularyItem> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Cannot save vocabulary.')
  }

  const columns = 'id,english,arabic,example_sentence,pronunciation,unit,week,difficulty,category,image'
  const result = options.childContribution
    ? await supabase
      .from('vocabulary')
      .insert({ english: item.english, arabic: item.arabic })
      .select(columns)
      .single()
    : await supabase
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
      .select(columns)
      .single()
  const { data, error } = result

  if (error) {
    throw new Error(`Could not add vocabulary: ${error.message}`)
  }

  return mapRow(data, true)
}

export async function updateVocabularyItem(id: string, item: VocabularyItem): Promise<VocabularyItem> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Cannot save vocabulary.')
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
    throw new Error(`Could not update vocabulary: ${error.message}`)
  }

  return mapRow(data, true)
}

export async function deleteVocabularyItem(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Cannot delete vocabulary.')
  }

  const { error } = await supabase.from('vocabulary').delete().eq('id', id).select('id').single()

  if (error) {
    throw new Error(`Could not delete vocabulary: ${error.message}`)
  }
}
