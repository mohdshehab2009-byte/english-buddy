import { useCallback, useMemo, useState } from 'react'
import { Confetti, StarPop } from '../components/Celebration'
import { PracticeGames } from '../components/child/PracticeGames'
import { QuizGame } from '../components/child/QuizGame'
import { BuddyIdCard } from '../components/child/BuddyIdCard'
import { Stars, WordBubble } from '../components/child/WordBubble'
import { Sidebar } from '../components/Sidebar'
import { childProfile } from '../data/mockData'
import { isSoundOn, setSoundOn, sounds, speak } from '../lib/feedback'
import { wordStars } from '../lib/games'
import { applyEvent, computeAchievements, DAILY_PRACTICE_GOAL, levelFor, useRewards, type RewardEvent } from '../lib/rewards'
import { canSyncRewards } from '../lib/childSync'
import { translateEnglishToArabic } from '../lib/translation'
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
  { label: 'My Words', value: 'words', icon: '📚' },
  { label: 'Games', value: 'practice', icon: '🎮' },
  { label: 'Quiz', value: 'quiz', icon: '🏆' },
  { label: 'My Journey', value: 'progress', icon: '🚀' },
  { label: 'Badges', value: 'achievements', icon: '🏅' },
]

const dayIndex = (length: number) => {
  const today = new Date()
  const seed = today.getFullYear() * 400 + today.getMonth() * 31 + today.getDate()
  return length ? seed % length : 0
}

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
  const { rewards, record, childId, isNewDevice, syncStatus, linkChildId } = useRewards()
  const [hideNewDevice, setHideNewDevice] = useState(false)
  const [starPop, setStarPop] = useState({ key: 0, amount: 0 })
  const [confettiKey, setConfettiKey] = useState(0)
  const [soundOn, setSoundOnState] = useState(isSoundOn)
  const [practiceWordId, setPracticeWordId] = useState<string | null>(null)

  const [showAddWord, setShowAddWord] = useState(false)
  const [newWord, setNewWord] = useState<VocabularyItem>(createChildWord())
  const [addingWord, setAddingWord] = useState(false)
  const [translatingWord, setTranslatingWord] = useState(false)
  const [addWordError, setAddWordError] = useState('')
  const [search, setSearch] = useState('')

  const progressByWord = useMemo(() => new Map(wordProgress.map((item) => [item.wordId, item])), [wordProgress])
  const level = levelFor(rewards.stars)
  const achievements = useMemo(() => computeAchievements(rewards, vocabulary.length), [rewards, vocabulary.length])
  const unlockedCount = achievements.filter((item) => item.progress >= item.goal).length
  const wordOfDay = vocabulary[dayIndex(vocabulary.length)] ?? null
  const masteredCount = wordProgress.filter((item) => item.mastery >= 100).length

  const saveHint = !supabaseConfigured
    ? 'Practice mode: stars are kept on this device.'
    : !isParentSignedIn
      ? 'Grown-ups: sign in on Parent view to save detailed progress.'
      : ''

  const reward = useCallback((event: RewardEvent, big = false) => {
    const before = computeAchievements(rewards, vocabulary.length).filter((item) => item.progress >= item.goal).length
    const amount = record(event)
    if (amount > 0) setStarPop((current) => ({ key: current.key + 1, amount }))
    // Celebrate a big moment or a newly unlocked badge.
    const after = computeAchievements(applyEvent(rewards, event), vocabulary.length).filter((item) => item.progress >= item.goal).length
    if (big || after > before) {
      setConfettiKey((key) => key + 1)
      if (!big) sounds.fanfare()
    }
  }, [record, rewards, vocabulary.length])

  const savePractice = (wordId: string, kind: 'spelling' | 'translation', score: number) => {
    if (!canSaveProgress || !profileId) return
    // Saving keeps the best score, so a slip never lowers it.
    void onSaveWordPractice(wordId, kind, score).catch(() => undefined)
  }

  const saveQuiz = async (score: number, total: number): Promise<string> => {
    if (!canSaveProgress || !profileId) return saveHint || 'Grown-ups: sign in on Parent view to save quiz results.'
    try {
      await onSaveQuizResult(score, total)
      return 'Saved for your grown-up to see ✔'
    } catch {
      return 'Could not save this result. Ask a grown-up to check the connection.'
    }
  }

  const handleAddWord = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAddWordError('')
    setAddingWord(true)
    try {
      const saved = await onAddVocabulary({ ...newWord, english: newWord.english.trim(), arabic: newWord.arabic.trim(), example: '' })
      setNewWord(createChildWord())
      setShowAddWord(false)
      sounds.correct()
      speak(saved.english)
      reward({ kind: 'word-added' })
    } catch (error) {
      setAddWordError(error instanceof Error ? error.message : 'Could not add this word. Please try again.')
      sounds.wrong()
    } finally {
      setAddingWord(false)
    }
  }

  const handleTranslateWord = async () => {
    setTranslatingWord(true)
    setAddWordError('')
    try {
      const arabic = await translateEnglishToArabic(newWord.english)
      setNewWord((current) => ({ ...current, arabic }))
    } catch {
      setAddWordError('The magic helper could not find it. Ask a grown-up to type the Arabic meaning.')
    } finally {
      setTranslatingWord(false)
    }
  }

  const playWord = (id: string) => {
    setPracticeWordId(id)
    onNavigate('practice')
  }

  const renderHome = () => {
    const missions = [
      { id: 'practice', icon: '🎮', label: `Play ${DAILY_PRACTICE_GOAL} word games`, done: rewards.today.practiced >= DAILY_PRACTICE_GOAL, detail: `${Math.min(rewards.today.practiced, DAILY_PRACTICE_GOAL)}/${DAILY_PRACTICE_GOAL}`, go: 'practice' },
      { id: 'quiz', icon: '🏆', label: 'Finish a quiz', done: rewards.today.quizDone, detail: rewards.today.quizDone ? 'Done' : 'Go!', go: 'quiz' },
      { id: 'word', icon: '➕', label: 'Add a new word', done: rewards.today.wordAdded, detail: rewards.today.wordAdded ? 'Done' : 'Go!', go: 'words' },
    ]
    const missionsDone = missions.filter((item) => item.done).length

    return (
      <div className="space-y-5">
        {canSyncRewards && isNewDevice && rewards.stars === 0 && !hideNewDevice ? (
          <BuddyIdCard childId={childId} syncStatus={syncStatus} onLink={linkChildId} compact onDismiss={() => setHideNewDevice(true)} />
        ) : null}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-500 via-sky-500 to-emerald-400 p-6 text-white shadow-xl shadow-sky-200 sm:p-8">
          <span aria-hidden="true" className="float absolute -right-2 -top-2 text-8xl opacity-30 sm:text-9xl">{level.icon}</span>
          <p className="text-lg font-bold text-white/90">Hi there 👋</p>
          <h3 className="mt-1 text-4xl font-black sm:text-5xl">Hello, {childProfile.name}!</h3>
          <p className="mt-3 max-w-md text-lg font-semibold text-white/90">Ready to learn some new words today?</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => onNavigate('practice')} className="kid-button bg-white text-indigo-600 shadow-indigo-900/20">🎮 Play games</button>
            <button type="button" onClick={() => onNavigate('quiz')} className="kid-button bg-amber-300 text-amber-900 shadow-amber-900/20">🏆 Take the quiz</button>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { icon: '⭐', value: rewards.stars, label: 'Stars', color: 'bg-amber-100 text-amber-700' },
            { icon: '🔥', value: rewards.streak, label: rewards.streak === 1 ? 'Day streak' : 'Days streak', color: 'bg-rose-100 text-rose-700' },
            { icon: '📚', value: vocabulary.length, label: 'My words', color: 'bg-sky-100 text-sky-700' },
            { icon: '🏅', value: unlockedCount, label: 'Badges', color: 'bg-emerald-100 text-emerald-700' },
          ].map((item) => (
            <div key={item.label} className={`rounded-3xl p-4 ${item.color}`}>
              <p className="text-3xl">{item.icon}</p>
              <p className="mt-1 text-3xl font-black">{item.value}</p>
              <p className="text-sm font-bold opacity-80">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-[2rem] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800">🎯 Today’s mission</h3>
              <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-black text-violet-700">{missionsDone}/3</span>
            </div>
            <ul className="mt-4 space-y-3">
              {missions.map((mission) => (
                <li key={mission.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(mission.go)}
                    className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${mission.done ? 'bg-emerald-50' : 'bg-slate-50 hover:bg-sky-50'}`}
                  >
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full text-xl ${mission.done ? 'bg-emerald-400 text-white' : 'bg-white shadow-sm'}`}>
                      {mission.done ? '✓' : mission.icon}
                    </span>
                    <span className={`flex-1 font-bold ${mission.done ? 'text-emerald-700 line-through decoration-2' : 'text-slate-700'}`}>{mission.label}</span>
                    <span className="text-sm font-black text-slate-500">{mission.detail}</span>
                  </button>
                </li>
              ))}
            </ul>
            {missionsDone === 3 ? <p className="bounce-in mt-4 text-center text-lg font-black text-emerald-600">🎉 Mission complete! You’re a star!</p> : null}
          </section>

          <section className="rounded-[2rem] bg-white p-5 shadow-sm">
            <h3 className="text-xl font-black text-slate-800">🌞 Word of the day</h3>
            {wordOfDay ? (
              <div className="mt-4 flex items-center gap-4">
                <WordBubble item={wordOfDay} size="lg" />
                <div className="min-w-0">
                  <p className="break-words text-3xl font-black text-slate-800 sm:text-4xl">{wordOfDay.english}</p>
                  <p dir="rtl" className="text-2xl font-bold text-sky-700">{wordOfDay.arabic}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => speak(wordOfDay.english)} className="rounded-full bg-sky-100 px-4 py-2 text-sm font-bold text-sky-700 hover:bg-sky-200">🔊 Listen</button>
                    <button type="button" onClick={() => playWord(wordOfDay.id)} className="rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-700 hover:bg-amber-200">🧩 Practice</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl bg-sky-50 p-4 text-center">
                <p className="font-bold text-sky-800">No words yet!</p>
                <button type="button" onClick={() => { setShowAddWord(true); onNavigate('words') }} className="kid-button mt-3 bg-indigo-500 text-white shadow-indigo-200">➕ Add my first word</button>
              </div>
            )}
          </section>
        </div>
      </div>
    )
  }

  const renderWords = () => {
    const query = search.trim().toLowerCase()
    const shown = query ? vocabulary.filter((item) => item.english.toLowerCase().includes(query) || item.arabic.includes(query)) : vocabulary
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-3xl font-black text-slate-800">📚 My Words</h3>
            <p className="mt-1 font-semibold text-slate-500">Tap a word to hear it. Play games to earn ⭐!</p>
          </div>
          <button
            type="button"
            onClick={() => { setShowAddWord((current) => !current); setAddWordError('') }}
            className="kid-button bg-indigo-500 text-white shadow-indigo-200"
          >
            {showAddWord ? '✖ Close' : '➕ Add a word'}
          </button>
        </div>

        {showAddWord ? (
          <form onSubmit={(event) => void handleAddWord(event)} className="bounce-in rounded-[2rem] border-4 border-indigo-100 bg-white p-5 sm:p-6">
            <h4 className="text-xl font-black text-slate-800">✨ What new word did you learn?</h4>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-base font-bold text-slate-700">
                English word
                <div className="mt-1.5 flex gap-2">
                  <input
                    required
                    maxLength={100}
                    value={newWord.english}
                    onChange={(event) => setNewWord((current) => ({ ...current, english: event.target.value }))}
                    placeholder="butterfly"
                    className="kid-input"
                  />
                  <button type="button" aria-label="Hear the word" disabled={!newWord.english.trim()} onClick={() => speak(newWord.english)} className="rounded-2xl bg-sky-100 px-4 text-xl disabled:opacity-40">🔊</button>
                </div>
              </label>
              <div>
                <label className="text-base font-bold text-slate-700">
                  Arabic meaning
                  <input
                    required
                    maxLength={100}
                    dir="rtl"
                    value={newWord.arabic}
                    onChange={(event) => setNewWord((current) => ({ ...current, arabic: event.target.value }))}
                    placeholder="فراشة"
                    className="kid-input mt-1.5"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void handleTranslateWord()}
                  disabled={translatingWord || !newWord.english.trim()}
                  className="mt-2 rounded-full bg-violet-100 px-4 py-2 text-sm font-bold text-violet-700 disabled:opacity-50"
                >
                  {translatingWord ? '🪄 Thinking…' : '🪄 Magic translate'}
                </button>
              </div>
            </div>
            {addWordError ? <p role="alert" className="mt-4 rounded-2xl bg-amber-50 p-3 font-semibold text-amber-900">{addWordError}</p> : null}
            <button type="submit" disabled={addingWord} className="kid-button mt-5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-sky-200">
              {addingWord ? 'Adding…' : '✅ Add to My Words (+2 ⭐)'}
            </button>
          </form>
        ) : null}

        {vocabulary.length > 8 ? (
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="🔍 Find a word…"
            className="kid-input max-w-sm"
          />
        ) : null}

        {vocabulary.length ? (
          <>
            <p className="inline-flex rounded-full bg-indigo-50 px-4 py-1.5 font-black text-indigo-700">
              {vocabulary.length} {vocabulary.length === 1 ? 'word' : 'words'} collected
            </p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((item) => (
                <article key={item.id} className="flex items-center gap-3 rounded-3xl bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <button type="button" onClick={() => speak(item.english)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`Hear ${item.english}`}>
                    <WordBubble item={item} />
                    <span className="min-w-0">
                      <span className="block truncate text-xl font-black text-slate-800">{item.english} <span className="text-base">🔊</span></span>
                      <span dir="rtl" className="block truncate text-lg font-semibold text-sky-700">{item.arabic}</span>
                      <Stars count={wordStars(progressByWord.get(item.id)?.mastery ?? 0)} className="text-sm" />
                    </span>
                  </button>
                  <button type="button" onClick={() => playWord(item.id)} className="rounded-2xl bg-amber-100 px-3 py-3 text-sm font-black text-amber-700 hover:bg-amber-200" aria-label={`Practice ${item.english}`}>
                    🧩
                  </button>
                </article>
              ))}
            </div>
            {!shown.length ? <p className="text-center font-semibold text-slate-500">No words match “{search}”.</p> : null}
          </>
        ) : (
          <div className="rounded-[2rem] border-4 border-dashed border-slate-200 bg-white p-8 text-center">
            <p className="text-5xl">🌱</p>
            <p className="mt-3 text-xl font-black text-slate-700">Your word garden is empty</p>
            <p className="mt-1 text-slate-500">Tap “Add a word” to plant your first one!</p>
          </div>
        )}
      </div>
    )
  }

  const renderProgress = () => {
    const recent = quizResults.slice(0, 5)
    return (
      <div className="space-y-5">
        <section className="rounded-[2rem] bg-gradient-to-br from-indigo-500 to-violet-500 p-6 text-white shadow-xl shadow-indigo-200">
          <div className="flex items-center gap-4">
            <span className="float text-6xl">{level.icon}</span>
            <div className="flex-1">
              <p className="font-bold text-white/80">My level</p>
              <p className="text-3xl font-black">{level.name}</p>
              <div className="mt-3 h-4 overflow-hidden rounded-full bg-white/25">
                <div className="h-full rounded-full bg-amber-300 transition-all" style={{ width: `${level.progress}%` }} />
              </div>
              <p className="mt-2 text-sm font-semibold text-white/90">
                {level.next ? `${level.next.min - rewards.stars} more ⭐ to become ${level.next.icon} ${level.next.name}` : 'You reached the top level! 🎉'}
              </p>
            </div>
          </div>
        </section>

        <BuddyIdCard childId={childId} syncStatus={syncStatus} onLink={linkChildId} />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { icon: '⭐', value: rewards.stars, label: 'Stars collected' },
            { icon: '🔥', value: rewards.bestStreak, label: 'Best streak (days)' },
            { icon: '🧠', value: masteredCount, label: 'Words mastered' },
            { icon: '🏆', value: `${rewards.bestQuizPercent}%`, label: 'Best quiz' },
          ].map((item) => (
            <div key={item.label} className="rounded-3xl bg-white p-4 shadow-sm">
              <p className="text-3xl">{item.icon}</p>
              <p className="mt-1 text-3xl font-black text-slate-800">{item.value}</p>
              <p className="text-sm font-bold text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black text-slate-800">🌟 My word stars</h3>
          {vocabulary.length ? (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {vocabulary.slice(0, 30).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-2">
                  <span className="truncate font-bold text-slate-700">{item.english}</span>
                  <Stars count={wordStars(progressByWord.get(item.id)?.mastery ?? 0)} />
                </li>
              ))}
            </ul>
          ) : <p className="mt-2 text-slate-500">Add words to start collecting stars.</p>}
          {canSaveProgress ? null : <p className="mt-3 text-xs text-slate-400">Word stars are saved when a grown-up is signed in on Parent view.</p>}
        </section>

        {recent.length ? (
          <section className="rounded-[2rem] bg-white p-5 shadow-sm">
            <h3 className="text-xl font-black text-slate-800">🏆 My recent quizzes</h3>
            <ul className="mt-3 space-y-2">
              {recent.map((result) => {
                const percent = Math.round((result.score / result.totalQuestions) * 100)
                return (
                  <li key={result.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-2">
                    <span className="font-semibold text-slate-600">{new Date(result.completedAt).toLocaleDateString()}</span>
                    <span className="font-black text-slate-800">{result.score}/{result.totalQuestions} {percent === 100 ? '🥇' : percent >= 70 ? '🥈' : '🥉'}</span>
                  </li>
                )
              })}
            </ul>
          </section>
        ) : null}
      </div>
    )
  }

  const renderAchievements = () => (
    <div className="space-y-5">
      <div>
        <h3 className="text-3xl font-black text-slate-800">🏅 My Badges</h3>
        <p className="mt-1 font-semibold text-slate-500">You have unlocked {unlockedCount} of {achievements.length} badges!</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {achievements.map((badge) => {
          const unlocked = badge.progress >= badge.goal
          const percent = Math.min(100, Math.round((badge.progress / badge.goal) * 100))
          return (
            <div
              key={badge.id}
              className={`rounded-3xl p-4 text-center transition ${unlocked ? 'bg-gradient-to-br from-amber-100 to-orange-100 shadow-md shadow-amber-100' : 'bg-white shadow-sm'}`}
            >
              <p className={`text-5xl ${unlocked ? 'float' : 'opacity-30 grayscale'}`}>{unlocked ? badge.icon : '🔒'}</p>
              <p className="mt-2 font-black text-slate-800">{badge.title}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{badge.description}</p>
              {unlocked ? (
                <span className="mt-3 inline-block rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-white">Unlocked!</span>
              ) : (
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-violet-500" style={{ width: `${percent}%` }} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderPage = () => {
    switch (page) {
      case 'words':
        return renderWords()
      case 'practice':
        return (
          <PracticeGames
            vocabulary={vocabulary}
            progressByWord={progressByWord}
            initialWordId={practiceWordId}
            onReward={(event) => reward(event)}
            onSavePractice={savePractice}
            onAddWords={() => { setShowAddWord(true); onNavigate('words') }}
          />
        )
      case 'quiz':
        return (
          <QuizGame
            vocabulary={vocabulary}
            onReward={reward}
            onSaveResult={saveQuiz}
            onAddWords={() => { setShowAddWord(true); onNavigate('words') }}
          />
        )
      case 'progress':
        return renderProgress()
      case 'achievements':
        return renderAchievements()
      default:
        return renderHome()
    }
  }

  return (
    <div className="flex flex-col gap-5 md:flex-row">
      {confettiKey ? <Confetti key={confettiKey} /> : null}
      {starPop.amount ? <StarPop key={starPop.key} amount={starPop.amount} /> : null}
      <Sidebar
        title={`${level.icon} ${childProfile.name}`}
        subtitle={`⭐ ${rewards.stars} · ${level.name}`}
        items={childNav}
        active={page}
        onSelect={(value) => { sounds.tap(); onNavigate(value) }}
        footer={
          <button
            type="button"
            onClick={() => { setSoundOn(!soundOn); setSoundOnState(!soundOn) }}
            className="w-full rounded-2xl bg-white/10 px-3 py-2 text-sm font-bold text-white hover:bg-white/20"
          >
            {soundOn ? '🔔 Sounds on' : '🔕 Sounds off'}
          </button>
        }
      />
      <main className="min-w-0 flex-1">{renderPage()}</main>
    </div>
  )
}
