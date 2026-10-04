import { useMemo, useState } from 'react'
import { Sidebar } from '../components/Sidebar'
import { StatCard } from '../components/StatCard'
import { WordCard } from '../components/WordCard'
import { achievements, childProfile, progressStats, weeklyQuiz } from '../data/mockData'
import type { VocabularyItem } from '../types'

interface ChildDashboardProps {
  vocabulary: VocabularyItem[]
}

const childNav = [
  { label: 'Home', value: 'home', icon: '🏠' },
  { label: 'My Words', value: 'words', icon: '📝' },
  { label: 'Practice', value: 'practice', icon: '🎧' },
  { label: 'Weekly Quiz', value: 'quiz', icon: '✅' },
  { label: 'Progress', value: 'progress', icon: '📊' },
  { label: 'Achievements', value: 'achievements', icon: '🏅' },
]

export function ChildDashboard({ vocabulary }: ChildDashboardProps) {
  const [page, setPage] = useState('home')
  const [selectedWord, setSelectedWord] = useState(vocabulary[0] ?? null)
  const [score, setScore] = useState(0)
  const [quizIndex, setQuizIndex] = useState(0)

  const quizQuestion = weeklyQuiz[quizIndex]

  const averageMastery = useMemo(() => {
    if (!vocabulary.length) {
      return 0
    }

    const scoreByDifficulty: Record<string, number> = {
      Easy: 85,
      Medium: 72,
      Hard: 60,
    }

    const total = vocabulary.reduce((sum, item) => sum + (scoreByDifficulty[item.difficulty] ?? 70), 0)
    return Math.round(total / vocabulary.length)
  }, [vocabulary])

  const handleQuizAnswer = (choice: string) => {
    if (choice === quizQuestion.answer) {
      setScore((current) => current + 1)
    }

    if (quizIndex < weeklyQuiz.length - 1) {
      setQuizIndex((current) => current + 1)
    }
  }

  const renderPage = () => {
    switch (page) {
      case 'words':
        return (
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
        )

      case 'practice':
        return (
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Practice word</p>
              <h3 className="mt-3 text-3xl font-black text-slate-800">{selectedWord?.english ?? 'No word selected'}</h3>
              <p className="mt-1 text-lg text-sky-700">{selectedWord?.arabic ?? '—'}</p>
              <p className="mt-4 text-sm text-slate-600">{selectedWord?.example ?? 'Start with a word and practice listening and spelling.'}</p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button className="rounded-2xl bg-sky-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-200">🔊 Listen</button>
                <button className="rounded-2xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-800 shadow-lg shadow-amber-200">✍️ Spell</button>
                <button className="rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200">🌍 Translate</button>
              </div>
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
                <h3 className="mt-2 text-2xl font-black text-slate-800">Question {Math.min(quizIndex + 1, weeklyQuiz.length)}</h3>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700">Score: {score}/{weeklyQuiz.length}</span>
            </div>

            <div className="space-y-4">
              <p className="text-xl font-bold text-slate-800">{quizQuestion.prompt}</p>
              <div className="grid gap-3 md:grid-cols-2">
                {quizQuestion.choices.map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => handleQuizAnswer(choice)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-base font-semibold text-slate-700 transition hover:border-sky-400 hover:bg-sky-50"
                  >
                    {choice}
                  </button>
                ))}
              </div>
              <p className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">{quizQuestion.explanation}</p>
            </div>
          </div>
        )

      case 'progress':
        return (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {progressStats.map((item) => (
              <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <span className="text-xs font-bold text-slate-700">{item.value}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
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
              <StatCard title="Words mastered" value={`${Math.min(20, vocabulary.length + 10)}`} subtitle="This week" tone="sky" />
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
                  10 new words and 10 review words planned.
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <Sidebar title="Child" items={childNav} active={page} onSelect={setPage} />
      <main className="flex-1 rounded-3xl bg-slate-50/80 p-4 shadow-inner shadow-slate-200 md:p-6">{renderPage()}</main>
    </div>
  )
}
