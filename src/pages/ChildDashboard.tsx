import { useMemo, useState } from 'react'
import { Sidebar } from '../components/Sidebar'
import { StatCard } from '../components/StatCard'
import { WordCard } from '../components/WordCard'
import { translateEnglishToArabic } from '../lib/translation'
import { achievements, childProfile, createVocabularyQuiz } from '../data/mockData'
import type { QuizResult, VocabularyItem, WordProgress } from '../types'

const createChildWord = (): VocabularyItem => ({
  id: '',
  english: '',
  arabic: '',
  example: '',
  pronunciation: '',
  unit: '',
  week: '',
  difficulty: 'Easy',
  category: 'Child added',
  image: '🌟',
})

interface ChildDashboardProps {
  page: string
  onNavigate: (page: string) => void
  vocabulary: VocabularyItem[]
  profileId: string | null
  supabaseConfigured: boolean
  isParentSignedIn: boolean
  canSaveProgress: boolean
  wordProgress: WordProgress[]
  quizResults: QuizResult[]
  onAddVocabulary: (item: VocabularyItem) => Promise<VocabularyItem>
  onSaveWordPractice: (wordId: string, kind: 'spelling' | 'translation', score: number) => Promise<WordProgress>
  onSaveQuizResult: (score: number, totalQuestions: number) => Promise<QuizResult>
}

const childNav = [
  { label: 'Home', value: 'home', icon: '🏠' },
  { label: 'My Words', value: 'words', icon: '📝' },
  { label: 'Practice', value: 'practice', icon: '🎧' },
  { label: 'Weekly Quiz', value: 'quiz', icon: '✅' },
  { label: 'Progress', value: 'progress', icon: '📊' },
  { label: 'Achievements', value: 'achievements', icon: '🏅' },
]

const normalizeAnswer = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/\s+/g, ' ')

export function ChildDashboard({
  page,
  onNavigate,
  vocabulary,
  profileId,
  supabaseConfigured,
  isParentSignedIn,
  canSaveProgress,
  wordProgress,
  quizResults,
  onAddVocabulary,
  onSaveWordPractice,
  onSaveQuizResult,
}: ChildDashboardProps) {
  const [selectedWord, setSelectedWord] = useState(vocabulary[0] ?? null)
  const [showAddWord, setShowAddWord] = useState(false)
  const [newWord, setNewWord] = useState<VocabularyItem>(createChildWord())
  const [addingWord, setAddingWord] = useState(false)
  const [translatingWord, setTranslatingWord] = useState(false)
  const [translationError, setTranslationError] = useState('')
  const [addWordError, setAddWordError] = useState('')
  const [addWordMessage, setAddWordMessage] = useState('')
  const [score, setScore] = useState(0)
  const [quizIndex, setQuizIndex] = useState(0)
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [quizFinished, setQuizFinished] = useState(false)
  const [quizFinalScore, setQuizFinalScore] = useState<number | null>(null)
  const [quizSaving, setQuizSaving] = useState(false)
  const [quizSaved, setQuizSaved] = useState(false)
  const [quizStatus, setQuizStatus] = useState('')
  const [practiceKind, setPracticeKind] = useState<'spelling' | 'translation' | null>(null)
  const [practiceAnswer, setPracticeAnswer] = useState('')
  const [practiceSaving, setPracticeSaving] = useState(false)
  const [practiceStatus, setPracticeStatus] = useState('')

  const quizQuestions = useMemo(() => createVocabularyQuiz(vocabulary), [vocabulary])
  const quizQuestion = quizQuestions[quizIndex]
  const progressByWord = useMemo(() => new Map(wordProgress.map((item) => [item.wordId, item])), [wordProgress])

  const averageMastery = useMemo(() => {
    if (!wordProgress.length) {
      return 0
    }
    return Math.round(wordProgress.reduce((sum, item) => sum + item.mastery, 0) / wordProgress.length)
  }, [wordProgress])

  const persistQuizResult = async (finalScore: number) => {
    setQuizSaved(false)
    if (!canSaveProgress || !profileId) {
      setQuizStatus(
        !supabaseConfigured
          ? 'Quiz complete. Supabase is not configured, so results cannot be saved in demo mode.'
          : !isParentSignedIn
            ? 'Quiz complete. Sign in as a parent on this device to save results.'
            : 'Quiz complete. Your parent profile is still loading; retry saving in a moment.',
      )
      return
    }

    setQuizSaving(true)
    setQuizStatus('Saving quiz result…')
    try {
      await onSaveQuizResult(finalScore, quizQuestions.length)
      setQuizSaved(true)
      setQuizStatus('Quiz result saved to your progress!')
    } catch (error) {
      setQuizStatus(error instanceof Error ? error.message : 'Could not save the quiz result.')
    } finally {
      setQuizSaving(false)
    }
  }

  const handleQuizAnswer = (choice: string) => {
    if (selectedChoice || quizFinished) return
    setSelectedChoice(choice)
    setQuizStatus('')
  }

  const handleQuizContinue = async () => {
    if (!selectedChoice || quizFinished) return
    const nextScore = score + Number(selectedChoice === quizQuestion.answer)

    if (quizIndex < quizQuestions.length - 1) {
      setScore(nextScore)
      setQuizIndex((current) => current + 1)
      setSelectedChoice(null)
      return
    }

    setScore(nextScore)
    setQuizFinished(true)
    setQuizFinalScore(nextScore)
    void persistQuizResult(nextScore)
  }

  const handlePracticeCheck = async () => {
    if (!selectedWord || !practiceKind || practiceSaving) return
    const expected = practiceKind === 'spelling' ? selectedWord.english : selectedWord.arabic
    const correct = normalizeAnswer(practiceAnswer) === normalizeAnswer(expected)
    const points = correct ? 100 : 0
    setPracticeSaving(true)
    setPracticeStatus(correct ? 'Correct! Great work.' : `Not quite—try again. The answer is ${expected}.`)

    if (canSaveProgress && profileId) {
      try {
        await onSaveWordPractice(selectedWord.id, practiceKind, points)
        setPracticeStatus(`${correct ? 'Correct!' : 'Practice saved.'} Your ${practiceKind} progress is saved.`)
      } catch (error) {
        setPracticeStatus(error instanceof Error ? error.message : 'Could not save your practice result.')
      }
    } else {
      setPracticeStatus(`${correct ? 'Correct!' : 'Practice complete.'} Sign in as a parent on this device to save progress.`)
    }
    setPracticeSaving(false)
  }

  const startPractice = (kind: 'spelling' | 'translation') => {
    setPracticeKind(kind)
    setPracticeAnswer('')
    setPracticeStatus('')
  }

  const handleAddWord = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAddWordError('')
    setAddWordMessage('')

    setAddingWord(true)
    try {
      const saved = await onAddVocabulary({
        ...newWord,
        english: newWord.english.trim(),
        arabic: newWord.arabic.trim(),
        example: '',
      })
      setNewWord(createChildWord())
      setShowAddWord(false)
      setAddWordMessage(`“${saved.english}” was added to My Words!`)
    } catch (error) {
      setAddWordError(error instanceof Error ? error.message : 'Could not add this word. Please try again.')
    } finally {
      setAddingWord(false)
    }
  }

  const handleTranslateWord = async () => {
    setTranslatingWord(true)
    setTranslationError('')
    try {
      const arabic = await translateEnglishToArabic(newWord.english)
      setNewWord((current) => ({ ...current, arabic }))
    } catch (error) {
      setTranslationError(error instanceof Error ? error.message : 'Could not translate this word.')
    } finally {
      setTranslatingWord(false)
    }
  }

  const renderPage = () => {
    switch (page) {
      case 'words':
        return (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-2xl font-black text-slate-800">My Words</h3>
                <p className="mt-1 text-sm text-slate-500">Add new words you discover and practice them here.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddWord((current) => !current)
                  setAddWordError('')
                  setAddWordMessage('')
                }}
                className="min-h-12 rounded-2xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
              >
                {showAddWord ? 'Close form' : '+ Add a word'}
              </button>
            </div>

            {addWordMessage ? <p role="status" className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{addWordMessage}</p> : null}

            {showAddWord ? (
              <form onSubmit={(event) => void handleAddWord(event)} className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4">
                  <h4 className="text-lg font-bold text-slate-800">What new word did you learn?</h4>
                  <p className="mt-1 text-sm text-slate-500">Just add the English word and its Arabic meaning. You can practice it in a quiz later.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-slate-700">
                    English word
                    <input
                      required
                      maxLength={100}
                      value={newWord.english}
                      onChange={(event) => setNewWord((current) => ({ ...current, english: event.target.value }))}
                      placeholder="butterfly"
                      className="mt-1.5 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base outline-none focus:border-indigo-400 focus:bg-white"
                    />
                  </label>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">
                      Arabic meaning
                      <input
                        required
                        maxLength={100}
                        dir="rtl"
                        value={newWord.arabic}
                        onChange={(event) => setNewWord((current) => ({ ...current, arabic: event.target.value }))}
                        placeholder="فراشة"
                        className="mt-1.5 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base outline-none focus:border-indigo-400 focus:bg-white"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => void handleTranslateWord()}
                      disabled={translatingWord || !newWord.english.trim()}
                      className="mt-2 min-h-10 rounded-xl border border-indigo-200 px-3 text-sm font-bold text-indigo-700 disabled:opacity-50"
                    >
                      {translatingWord ? 'Translating…' : 'Translate to Arabic'}
                    </button>
                  </div>
                </div>
                {translationError ? <p role="alert" className="mt-3 text-sm text-rose-700">{translationError}</p> : null}
                {addWordError ? (
                  <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                    <p role="alert">{addWordError}</p>
                  </div>
                ) : null}
                <button
                  type="submit"
                  disabled={addingWord}
                  className="mt-5 min-h-12 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {addingWord ? 'Adding word…' : 'Add to My Words'}
                </button>
              </form>
            ) : null}

            {vocabulary.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {vocabulary.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedWord(item)}
                    className="text-left"
                  >
                    <WordCard item={item} compact />
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
                Your word list is empty. Add your first word above!
              </p>
            )}
          </div>
        )

      case 'practice':
        return (
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Practice word</p>
              <h3 className="mt-3 text-3xl font-black text-slate-800">{selectedWord?.english ?? 'No word selected'}</h3>
              <p className="mt-1 text-lg text-sky-700">{selectedWord?.arabic ?? '—'}</p>
              <p className="mt-4 text-sm text-slate-600">{selectedWord?.example ?? 'Start with a word and practice listening and spelling.'}</p>
              {selectedWord ? (
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  Best saved scores — spelling {progressByWord.get(selectedWord.id)?.spellingScore ?? 0}% · translation {progressByWord.get(selectedWord.id)?.translationScore ?? 0}%
                </p>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedWord || !('speechSynthesis' in window)) {
                      setPracticeStatus('Audio pronunciation is not available in this browser.')
                      return
                    }
                    window.speechSynthesis.speak(new SpeechSynthesisUtterance(selectedWord.english))
                  }}
                  className="min-h-11 rounded-2xl bg-sky-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-200"
                >
                  🔊 Listen
                </button>
                <button type="button" onClick={() => startPractice('spelling')} className="min-h-11 rounded-2xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-800 shadow-lg shadow-amber-200">✍️ Spell</button>
                <button type="button" onClick={() => startPractice('translation')} className="min-h-11 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200">🌍 Translate</button>
              </div>

              {practiceKind ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    void handlePracticeCheck()
                  }}
                  className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <label className="block text-sm font-bold text-slate-700">
                    {practiceKind === 'spelling'
                      ? `Spell the English word for “${selectedWord?.arabic ?? ''}”`
                      : `Translate “${selectedWord?.english ?? ''}” into Arabic`}
                    <input
                      autoComplete="off"
                      dir={practiceKind === 'translation' ? 'rtl' : 'ltr'}
                      required
                      value={practiceAnswer}
                      onChange={(event) => setPracticeAnswer(event.target.value)}
                      className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base outline-none focus:border-sky-400"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={practiceSaving}
                    className="mt-3 min-h-11 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {practiceSaving ? 'Saving…' : 'Check answer'}
                  </button>
                  {practiceStatus ? <p role="status" className="mt-3 text-sm font-medium text-slate-700">{practiceStatus}</p> : null}
                </form>
              ) : practiceStatus ? (
                <p role="status" className="mt-4 text-sm text-slate-600">{practiceStatus}</p>
              ) : null}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Mini challenge</p>
              <div className="mt-4 space-y-3">
                {['Listen', 'Say it', 'Write it', 'Translate it'].map((task, index) => (
                  <div key={task} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                    <span className="font-medium text-slate-700">{task}</span>
                    <span className="text-sm text-emerald-600">{[3, 4, 2, 5][index]} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'quiz':
        return (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Weekly Quiz</p>
                <h3 className="mt-2 text-2xl font-black text-slate-800">{quizFinished ? 'Quiz complete!' : quizQuestions.length ? `Question ${quizIndex + 1} of ${quizQuestions.length}` : 'No words to quiz yet'}</h3>
              </div>
              {quizQuestions.length ? (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700">Score: {score}/{quizQuestions.length}</span>
              ) : null}
            </div>

            {!quizQuestions.length ? (
              <p className="rounded-2xl bg-sky-50 p-4 text-sm text-sky-800">
                Add a few words in My Words first. The latest words you add will be included in future quizzes.
              </p>
            ) : quizFinished ? (
              <div className="rounded-2xl bg-emerald-50 p-5">
                <p className="text-lg font-bold text-emerald-900">
                  You got {score} out of {quizQuestions.length} correct!
                </p>
                <p role="status" className="mt-2 text-sm text-emerald-800">{quizStatus}</p>
                <button
                  type="button"
                  onClick={() => {
                    setScore(0)
                    setQuizIndex(0)
                    setSelectedChoice(null)
                    setQuizFinished(false)
                    setQuizFinalScore(null)
                    setQuizSaved(false)
                    setQuizStatus('')
                  }}
                  disabled={quizSaving}
                  className="mt-4 block min-h-11 rounded-xl bg-white px-4 text-sm font-bold text-slate-700 shadow-sm"
                >
                  Try again
                </button>
                {canSaveProgress && !quizSaved ? (
                  <button
                    type="button"
                    disabled={quizSaving}
                    onClick={() => void persistQuizResult(quizFinalScore ?? score)}
                    className="mt-4 ml-2 min-h-11 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm disabled:opacity-60"
                  >
                    {quizSaving ? 'Saving…' : 'Retry saving result'}
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xl font-bold text-slate-800">{quizQuestion.prompt}</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {quizQuestion.choices.map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      aria-pressed={selectedChoice === choice}
                      onClick={() => handleQuizAnswer(choice)}
                      className={[
                        'min-h-12 rounded-2xl border px-4 py-3 text-left text-base font-semibold transition',
                        selectedChoice === choice
                          ? 'border-sky-500 bg-sky-100 text-sky-900'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-sky-400 hover:bg-sky-50',
                      ].join(' ')}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
                {selectedChoice ? (
                  <>
                    <p className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">{quizQuestion.explanation}</p>
                    <button
                      type="button"
                      onClick={() => void handleQuizContinue()}
                      disabled={quizSaving}
                      className="min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white disabled:opacity-60"
                    >
                      {quizSaving ? 'Saving…' : quizIndex === quizQuestions.length - 1 ? 'Finish quiz' : 'Next question'}
                    </button>
                  </>
                ) : null}
              </div>
            )}
          </div>
        )

      case 'progress':
        return (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { id: 'mastery', label: 'Average mastery', value: averageMastery },
                { id: 'spelling', label: 'Spelling best', value: wordProgress.length ? Math.round(wordProgress.reduce((sum, item) => sum + item.spellingScore, 0) / wordProgress.length) : 0 },
                { id: 'translation', label: 'Translation best', value: wordProgress.length ? Math.round(wordProgress.reduce((sum, item) => sum + item.translationScore, 0) / wordProgress.length) : 0 },
                { id: 'quiz', label: 'Latest quiz', value: quizResults[0] ? Math.round((quizResults[0].score / quizResults[0].totalQuestions) * 100) : 0 },
              ].map((item) => (
                <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">{item.label}</p>
                    <span className="text-xs font-bold text-slate-700">{item.value}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100">
                    <div className="h-3 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800">Recent quiz results</h3>
              {quizResults.length ? (
                <ul className="mt-3 space-y-2">
                  {quizResults.slice(0, 5).map((result) => (
                    <li key={result.id} className="flex justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                      <span className="text-slate-600">{new Date(result.completedAt).toLocaleDateString()}</span>
                      <span className="font-bold text-slate-800">{result.score}/{result.totalQuestions} correct</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-sm text-slate-500">No saved quiz results yet.</p>}
              {!canSaveProgress ? <p className="mt-3 text-sm text-amber-700">Sign in as a parent on this device to save future progress.</p> : null}
            </section>
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800">Word practice</h3>
              {wordProgress.length ? (
                <ul className="mt-3 space-y-2">
                  {wordProgress.map((record) => {
                    const word = vocabulary.find((item) => item.id === record.wordId)
                    return (
                      <li key={record.wordId} className="flex flex-wrap justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                        <span className="font-semibold text-slate-800">{word?.english ?? 'Vocabulary word'}</span>
                        <span className="text-slate-600">Spelling {record.spellingScore}% · Translation {record.translationScore}%</span>
                      </li>
                    )
                  })}
                </ul>
              ) : <p className="mt-2 text-sm text-slate-500">Practice a word to start tracking progress.</p>}
            </section>
          </div>
        )

      case 'achievements':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={[
                  'rounded-3xl border p-5 shadow-sm',
                  achievement.unlocked ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50' : 'border-slate-200 bg-white',
                ].join(' ')}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">{achievement.icon}</div>
                <p className="text-lg font-bold text-slate-800">{achievement.title}</p>
                <p className="mt-2 text-sm text-slate-600">{achievement.description}</p>
                <span className="mt-4 inline-flex rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700">
                  {achievement.unlocked ? 'Unlocked' : 'Locked'}
                </span>
              </div>
            ))}
          </div>
        )

      default:
        return (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Words practiced" value={`${wordProgress.length}`} subtitle="With saved results" tone="sky" />
              <StatCard title="Reading" value={`${averageMastery}%`} subtitle="Strong progress" tone="green" />
              <StatCard title="Streak" value={`${childProfile.streak} days`} subtitle="No break" tone="amber" />
              <StatCard title="Points" value={`${childProfile.points}`} subtitle="Reward total" tone="rose" />
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl bg-gradient-to-br from-emerald-400 via-sky-500 to-indigo-500 p-6 text-white shadow-xl shadow-sky-200">
                <p className="text-sm uppercase tracking-[0.22em] text-emerald-100">Welcome back</p>
                <h3 className="mt-3 text-3xl font-black">Hello, {childProfile.name}!</h3>
                <p className="mt-3 max-w-md text-sm text-sky-50">Let’s learn something new today. Try the practice cards and complete this week’s quiz.</p>
                <button className="mt-5 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-indigo-600 shadow-lg">Start learning</button>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">This week</p>
                <p className="mt-2 text-3xl font-black text-slate-800">20 words</p>
                <div className="mt-5 rounded-2xl bg-sky-50 p-3 text-sm text-sky-700">
                  {quizResults.length} quiz {quizResults.length === 1 ? 'result saved' : 'results saved'} so far.
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <Sidebar title="Child" items={childNav} active={page} onSelect={onNavigate} />
      <main className="flex-1 rounded-3xl bg-slate-50/80 p-4 shadow-inner shadow-slate-200 md:p-6">{renderPage()}</main>
    </div>
  )
}
