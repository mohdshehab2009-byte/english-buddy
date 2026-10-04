import { useMemo, useState } from 'react'
import { Sidebar } from '../components/Sidebar'
import { StatCard } from '../components/StatCard'
import { WordCard } from '../components/WordCard'
import type { QuizResult, VocabularyItem, WordProgress } from '../types'

interface ParentDashboardProps {
  vocabulary: VocabularyItem[]
  onAddWord: (item: VocabularyItem) => Promise<unknown>
  onDeleteWord: (id: string) => Promise<void>
  onUpdateWord: (id: string, item: VocabularyItem) => Promise<void>
  canManageAllWords?: boolean
  wordProgress: WordProgress[]
  quizResults: QuizResult[]
}

const createEmptyWord = (): VocabularyItem => ({
  id: '',
  english: '',
  arabic: '',
  example: '',
  pronunciation: '',
  unit: 'Nature',
  week: 'Week 1',
  difficulty: 'Easy',
  category: 'Places',
  image: '🌟',
})

const parentNav = [
  { label: 'Dashboard', value: 'dashboard', icon: '📊' },
  { label: 'Vocabulary', value: 'vocabulary', icon: '🗂️' },
  { label: 'Units & Weeks', value: 'units', icon: '🧭' },
  { label: 'Quizzes', value: 'quizzes', icon: '🎯' },
  { label: 'Child Progress', value: 'progress', icon: '📈' },
  { label: 'Reports', value: 'reports', icon: '📋' },
  { label: 'Settings', value: 'settings', icon: '⚙️' },
]

export function ParentDashboard({
  vocabulary,
  onAddWord,
  onDeleteWord,
  onUpdateWord,
  canManageAllWords = false,
  wordProgress,
  quizResults,
}: ParentDashboardProps) {
  const [page, setPage] = useState('dashboard')
  const [draft, setDraft] = useState<VocabularyItem>(createEmptyWord())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState('')
  const [saving, setSaving] = useState(false)

  const unitSummary = useMemo(
    () =>
      [{ label: 'Nature', count: 2 }, { label: 'School', count: 2 }, { label: 'Character', count: 1 }, { label: 'Health', count: 1 }],
    [],
  )

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!draft.english.trim() || !draft.arabic.trim()) {
      return
    }

    setSaving(true)
    setMutationError('')
    const normalized = {
      ...draft,
      id: draft.id || `${draft.english.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    }

    try {
      if (editingId) {
        await onUpdateWord(editingId, normalized)
      } else {
        await onAddWord(normalized)
      }
      setDraft(createEmptyWord())
      setEditingId(null)
      setPage('vocabulary')
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'Could not save this word.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setMutationError('')
    try {
      await onDeleteWord(id)
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'Could not delete this word.')
    }
  }

  const handleEdit = (id: string) => {
    const selected = vocabulary.find((item) => item.id === id)
    if (!selected) {
      return
    }

    setEditingId(id)
    setDraft(selected)
    setPage('vocabulary')
  }

  const stats = [
    { title: 'Words', value: `${vocabulary.length}`, subtitle: 'in the library', tone: 'sky' as const },
    {
      title: 'Avg mastery',
      value: `${wordProgress.length ? Math.round(wordProgress.reduce((sum, item) => sum + item.mastery, 0) / wordProgress.length) : 0}%`,
      subtitle: `${wordProgress.length} words practiced`,
      tone: 'green' as const,
    },
    { title: 'Quiz attempts', value: `${quizResults.length}`, subtitle: 'saved results', tone: 'amber' as const },
    {
      title: 'Latest quiz',
      value: quizResults[0] ? `${Math.round((quizResults[0].score / quizResults[0].totalQuestions) * 100)}%` : '—',
      subtitle: quizResults[0] ? `${quizResults[0].score}/${quizResults[0].totalQuestions} correct` : 'no results yet',
      tone: 'rose' as const,
    },
  ]

  const renderPage = () => {
    switch (page) {
      case 'vocabulary':
        return (
          <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
            <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">{editingId ? 'Edit word' : 'Add a new word'}</h3>
                {editingId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null)
                      setDraft(createEmptyWord())
                    }}
                    className="text-sm font-semibold text-slate-500"
                  >
                    Reset
                  </button>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-600">
                  English
                  <input
                    required
                    value={draft.english}
                    onChange={(event) => setDraft((current) => ({ ...current, english: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-sky-400 focus:bg-white"
                    placeholder="butterfly"
                  />
                </label>
                <label className="text-sm font-medium text-slate-600">
                  Arabic
                  <input
                    required
                    value={draft.arabic}
                    onChange={(event) => setDraft((current) => ({ ...current, arabic: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-sky-400 focus:bg-white"
                    placeholder="حديقة"
                  />
                </label>
                <label className="text-sm font-medium text-slate-600">
                  Unit
                  <input
                    value={draft.unit}
                    onChange={(event) => setDraft((current) => ({ ...current, unit: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-sky-400 focus:bg-white"
                  />
                </label>
                <label className="text-sm font-medium text-slate-600">
                  Week
                  <input
                    value={draft.week}
                    onChange={(event) => setDraft((current) => ({ ...current, week: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-sky-400 focus:bg-white"
                  />
                </label>
                <label className="text-sm font-medium text-slate-600 sm:col-span-2">
                  Example sentence
                  <input
                    value={draft.example}
                    onChange={(event) => setDraft((current) => ({ ...current, example: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-sky-400 focus:bg-white"
                    placeholder="A butterfly has colorful wings."
                  />
                </label>
                <label className="text-sm font-medium text-slate-600">
                  Pronunciation
                  <input
                    value={draft.pronunciation}
                    onChange={(event) => setDraft((current) => ({ ...current, pronunciation: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-sky-400 focus:bg-white"
                    placeholder="/ˈɡɑːrdn/"
                  />
                </label>
                <label className="text-sm font-medium text-slate-600">
                  Difficulty
                  <select
                    value={draft.difficulty}
                    onChange={(event) => setDraft((current) => ({ ...current, difficulty: event.target.value as VocabularyItem['difficulty'] }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-sky-400 focus:bg-white"
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </label>
              </div>

              {mutationError ? (
                <p role="alert" className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{mutationError}</p>
              ) : null}

              <button
                type="submit"
                disabled={saving}
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-sky-300/40 transition hover:translate-y-[-1px] disabled:cursor-wait disabled:opacity-60"
              >
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add word'}
              </button>
            </form>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Vocabulary library</h3>
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">{vocabulary.length} words</span>
              </div>
              {!canManageAllWords && vocabulary.some((item) => !item.canEdit) ? (
                <p className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
                  Shared vocabulary is read-only. You can edit or delete words that you add with this account.
                </p>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2">
                {vocabulary.map((item) => (
                  <WordCard
                    key={item.id}
                    item={item}
                    onEdit={canManageAllWords || item.canEdit ? handleEdit : undefined}
                    onDelete={canManageAllWords || item.canEdit ? handleDelete : undefined}
                    compact={false}
                  />
                ))}
              </div>
            </div>
          </div>
        )

      case 'units':
        return (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {unitSummary.map((item) => (
              <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl">📚</div>
                <p className="text-lg font-bold text-slate-800">{item.label}</p>
                <p className="mt-2 text-sm text-slate-500">{item.count} words in this unit</p>
              </div>
            ))}
          </div>
        )

      case 'quizzes':
        return (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800">Quiz schedule</h3>
            <div className="mt-5 space-y-3">
              {['Weekly review', 'Spelling challenge', 'Translation check', 'Unit recap'].map((label, index) => (
                <div key={label} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                  <div>
                    <p className="font-semibold text-slate-800">{label}</p>
                    <p className="text-sm text-slate-500">{['Monday', 'Wednesday', 'Friday', 'Sunday'][index]} · 10 minutes</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">Ready</span>
                </div>
              ))}
            </div>
          </div>
        )

      case 'progress':
        return (
          <div className="space-y-5">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800">Word practice scores</h3>
              {wordProgress.length ? (
                <div className="mt-4 space-y-3">
                  {wordProgress.map((record) => {
                    const word = vocabulary.find((item) => item.id === record.wordId)
                    return (
                      <div key={record.wordId} className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-bold text-slate-800">{word?.english ?? 'Vocabulary word'}</p>
                          <span className="text-xs text-slate-500">Mastery {record.mastery}%</span>
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {[
                            ['Spelling', record.spellingScore],
                            ['Translation', record.translationScore],
                          ].map(([label, value]) => (
                            <div key={label}>
                              <div className="mb-1 flex justify-between text-xs text-slate-500">
                                <span>{label}</span><span>{value}%</span>
                              </div>
                              <div className="h-2 rounded-full bg-slate-200">
                                <div className="h-2 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500" style={{ width: `${value}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : <p className="mt-2 text-sm text-slate-500">No word practice has been saved yet.</p>}
            </section>
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800">Quiz history</h3>
              {quizResults.length ? (
                <ul className="mt-3 space-y-2">
                  {quizResults.slice(0, 10).map((result) => (
                    <li key={result.id} className="flex justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                      <span className="text-slate-600">{new Date(result.completedAt).toLocaleDateString()}</span>
                      <span className="font-bold text-slate-800">{result.score}/{result.totalQuestions} correct</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-sm text-slate-500">No quiz attempts have been saved yet.</p>}
            </section>
          </div>
        )

      case 'reports':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-lg font-bold text-slate-800">Difficult words</p>
              {wordProgress.length ? (
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {[...wordProgress]
                    .sort((left, right) => left.mastery - right.mastery)
                    .slice(0, 5)
                    .map((record) => (
                      <li key={record.wordId}>
                        • {vocabulary.find((item) => item.id === record.wordId)?.english ?? 'Vocabulary word'} — {record.mastery}% mastery
                      </li>
                    ))}
                </ul>
              ) : <p className="mt-2 text-sm text-slate-500">No practice data yet.</p>}
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-lg font-bold text-slate-800">Focus plan</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li>• 10 minutes daily review</li>
                <li>• 3 words from current unit</li>
                <li>• 1 audio pronunciation round</li>
              </ul>
            </div>
          </div>
        )

      case 'settings':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ['Child profile', 'Mujtaba is in Grade 2'],
              ['Notification reminders', 'Enabled'],
              ['Parent notes', '3 active lesson hints'],
              ['Supabase sync', 'Connected'],
            ].map(([title, value]) => (
              <div key={title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">{title}</p>
                <p className="mt-2 text-lg font-bold text-slate-800">{value}</p>
              </div>
            ))}
          </div>
        )

      default:
        return (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <StatCard key={stat.title} title={stat.title} value={stat.value} subtitle={stat.subtitle} tone={stat.tone} />
              ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 p-6 text-white shadow-xl shadow-sky-200">
                <p className="text-sm uppercase tracking-[0.22em] text-sky-100">This week</p>
                <h3 className="mt-3 text-3xl font-black">20 words to master</h3>
                <p className="mt-3 max-w-md text-sm text-sky-50">Keep the weekly rhythm strong with a mix of reading, spelling, and listening practice.</p>
                <button className="mt-5 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-indigo-600 shadow-lg">View lesson plan</button>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Child overview</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-200 to-orange-200 text-3xl">🧒</div>
                  <div>
                    <p className="text-xl font-bold text-slate-800">Mujtaba</p>
                    <p className="text-sm text-slate-500">Level: Explorer</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p>🔥 9-day streak</p>
                  <p>⭐ 1,260 points earned</p>
                  <p>📘 3 achievements unlocked</p>
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <Sidebar title="Parent" items={parentNav} active={page} onSelect={setPage} />
      <main className="flex-1 rounded-3xl bg-slate-50/80 p-4 shadow-inner shadow-slate-200 md:p-6">{renderPage()}</main>
    </div>
  )
}
