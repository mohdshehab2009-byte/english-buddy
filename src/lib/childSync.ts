import { supabase } from './supabase'

// A child's "Buddy ID" (e.g. STAR-7K3Q) links their stars and missions across devices.

const ID_KEY = 'english-buddy:child-id'
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // no 0/O, 1/I/L so it's easy to read aloud
export const CHILD_ID_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/

export const normalizeChildId = (value: string) => {
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return cleaned.length === 8 ? `${cleaned.slice(0, 4)}-${cleaned.slice(4)}` : value.trim().toUpperCase()
}

function generateChildId(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  const chars = Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join('')
  return `${chars.slice(0, 4)}-${chars.slice(4)}`
}

/** The Buddy ID saved on this device, creating one the first time. */
export function getOrCreateChildId(): { id: string; isNew: boolean } {
  try {
    const saved = localStorage.getItem(ID_KEY)
    if (saved && CHILD_ID_PATTERN.test(saved)) return { id: saved, isNew: false }
    const id = generateChildId()
    localStorage.setItem(ID_KEY, id)
    return { id, isNew: true }
  } catch {
    return { id: generateChildId(), isNew: true }
  }
}

export function storeChildId(id: string) {
  try {
    localStorage.setItem(ID_KEY, id)
  } catch {
    // Storage unavailable: the ID lasts for this visit only.
  }
}

export const canSyncRewards = Boolean(supabase)

export async function fetchRemoteRewards(id: string): Promise<Record<string, unknown> | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('get_child_rewards', { p_code: id })
  if (error) throw new Error(error.message)
  return data && typeof data === 'object' ? (data as Record<string, unknown>) : null
}

export async function saveRemoteRewards(id: string, rewards: object): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.rpc('save_child_rewards', { p_code: id, p_data: rewards })
  if (error) throw new Error(error.message)
}
