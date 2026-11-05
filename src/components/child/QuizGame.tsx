import { useEffect, useState } from 'react'
import { cheer, nudge, sounds, speak } from '../../lib/feedback'
import { makeQuizQuestion, QUIZ_LENGTH, type GameQuestion } from '../../lib/games'
import type { RewardEvent } from '../../lib/rewards'
import type { VocabularyItem } from '../../types'
import { ChoiceGrid } from './PracticeGames'
import { Stars } from './WordBubble'

interface QuizGameProps {
  vocabulary: VocabularyItem[]
  onReward: (event: RewardEvent, big?: boolean) => void
  onSaveResult: (score: number, total: number) => Promise<string>
  onAddWords: () => void
}

type Phase = 'start' | 'playing' | 'done'

export function QuizGame({ vocabulary, onReward, onSaveResult, onAddWords }: QuizGameProps) {
  const [phase, setPhase] = useState<Phase>('start')
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [mistakes, setMistakes] = useState<Record<string, number>>({})
  const [question, setQuestion] = useState<GameQuestion | null>(null)
  const [chosen, setChosen] = useState<string | null>(null)
  const [saveNote, setSaveNote] = useState('')

  useEffect(() => {
    // Read the word aloud, except when the English word is the answer being asked for.
    if (phase !== 'playing' || !question || question.kind === 'english') return
    const timer = window.setTimeout(() => speak(question.word.english), 350)
    return () => window.clearTimeout(timer)
  }, [phase, question])

  if (vocabulary.length < 2) {
    return (
      <div className="rounded-[2rem] border-4 border-dashed border-amber-200 bg-white p-8 text-center">
        <p className="text-5xl">🏁</p>
        <h3 className="mt-3 text-2xl font-black text-slate-800">The quiz needs at least 2 words</h3>
        <p className="mt-2 text-slate-600">Add some words to My Words and the quiz will be ready!</p>
        <button type="button" onClick={onAddWords} className="kid-button mt-5 bg-indigo-500 text-white shadow-indigo-200">
          ➕ Add words
        </button>
      </div>
    )
  }

  const start = () => {
    sounds.tap()
    setIndex(0)
    setScore(0)
    setMistakes({})
    setChosen(null)
    setSaveNote('')
    setQuestion(makeQuizQuestion(vocabulary, {}))
    setPhase('playing')
  }

  const choose = (choice: string) => {
    if (!question || chosen) return
    setChosen(choice)
    const correct = choice === question.answer
    if (correct) {
      sounds.correct()
      setScore((value) => value + 1)
    } else {
      sounds.wrong()
      setMistakes((current) => ({ ...current, [question.wordId]: (current[question.wordId] ?? 0) + 1 }))
    }
    onReward({ kind: 'quiz-answer', correct })
  }

  const next = () => {
    if (!question) return
    if (index + 1 >= QUIZ_LENGTH) {
      setPhase('done')
      const perfect = score === QUIZ_LENGTH
      sounds.fanfare()
      onReward({ kind: 'quiz-finished', score, total: QUIZ_LENGTH }, true)
      if (perfect) speak('Perfect score! Amazing!')
      void onSaveResult(score, QUIZ_LENGTH).then(setSaveNote)
      return
    }
    setIndex((value) => value + 1)
    setChosen(null)
    setQuestion(makeQuizQuestion(vocabulary, mistakes, question.wordId))
  }

  if (phase === 'start') {
    return (
      <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-amber-300 via-orange-400 to-rose-400 p-8 text-center text-white shadow-xl shadow-orange-200">
        <p className="float text-7xl">🏆</p>
        <h3 className="mt-4 text-4xl font-black">Quiz Time!</h3>
        <p className="mx-auto mt-3 max-w-md text-lg font-semibold text-white/90">
          {QUIZ_LENGTH} quick questions. Listen, read and pick the right answer to win stars!
        </p>
        <button type="button" onClick={start} className="kid-button mt-6 bg-white text-xl text-orange-600 shadow-orange-300">
          ▶ Let’s go!
        </button>
      </div>
    )
  }

  if (phase === 'done') {
    const percent = Math.round((score / QUIZ_LENGTH) * 100)
    const trophy = percent === 100 ? 3 : percent >= 70 ? 2 : 1
    return (
      <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm">
        <p className="bounce-in text-7xl">{trophy === 3 ? '🥇' : trophy === 2 ? '🥈' : '🥉'}</p>
        <h3 className="mt-3 text-4xl font-black text-slate-800">
          {trophy === 3 ? 'Perfect!' : trophy === 2 ? 'Great work!' : 'Good effort!'}
        </h3>
        <Stars count={trophy} className="mt-3 block text-5xl" />
        <p className="mt-4 text-2xl font-bold text-slate-700">
          You got <span className="text-emerald-600">{score}</span> out of {QUIZ_LENGTH} right!
        </p>
        {trophy < 3 ? <p className="mt-2 text-slate-500">Words you missed will come back more often so you can learn them.</p> : null}
        <button type="button" onClick={start} className="kid-button mt-6 bg-orange-500 text-white shadow-orange-200">
          🔁 Play again
        </button>
        {saveNote ? <p className="mt-5 text-xs text-slate-400">{saveNote}</p> : null}
      </div>
    )
  }

  if (!question) return null
  const correct = chosen === question.answer

  return (
    <div className="rounded-[2rem] bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-black text-slate-500">Question {index + 1} of {QUIZ_LENGTH}</span>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-black text-amber-700">⭐ {score}</span>
      </div>
      <div className="mt-3 flex gap-1.5">
        {Array.from({ length: QUIZ_LENGTH }, (_, step) => (
          <span
            key={step}
            className={`h-3 flex-1 rounded-full transition ${step < index ? 'bg-emerald-400' : step === index ? 'bg-amber-400' : 'bg-slate-100'}`}
          />
        ))}
      </div>

      <div className="mt-6 text-center">
        {question.kind === 'listen' ? (
          <button
            type="button"
            onClick={() => speak(question.word.english)}
            aria-label="Play the word again"
            className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-5xl text-white shadow-xl shadow-sky-200 transition hover:scale-105 active:scale-95"
          >
            🔊
          </button>
        ) : null}
        {question.kind === 'meaning' ? (
          <button type="button" onClick={() => speak(question.word.english)} className="text-5xl font-black text-slate-800 hover:text-sky-700">
            {question.word.english} <span className="text-3xl">🔊</span>
          </button>
        ) : null}
        {question.kind === 'english' ? (
          <p dir="rtl" className="text-5xl font-black text-sky-700">{question.word.arabic}</p>
        ) : null}
        <p className="mt-4 text-xl font-bold text-slate-600">{question.prompt}</p>
      </div>

      <ChoiceGrid choices={question.choices} answer={question.answer} chosen={chosen} rtl={question.kind === 'meaning'} onChoose={choose} />

      {chosen ? (
        <div className="bounce-in mt-5 text-center">
          <p className={`text-2xl font-black ${correct ? 'text-emerald-600' : 'text-rose-500'}`}>{correct ? `🎉 ${cheer()}` : nudge()}</p>
          <p className="mt-1 text-lg text-slate-600">
            <b>{question.word.english}</b> = <span dir="rtl">{question.word.arabic}</span>
          </p>
          <button type="button" onClick={next} className="kid-button mt-4 bg-indigo-500 text-white shadow-indigo-200">
            {index + 1 >= QUIZ_LENGTH ? '🏁 See my score' : 'Next ▶'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
