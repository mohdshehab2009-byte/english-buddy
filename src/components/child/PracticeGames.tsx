import { useEffect, useMemo, useState } from 'react'
import { cheer, nudge, sounds, speak } from '../../lib/feedback'
import { lettersOnly, makeQuestion, pickWord, spellingTiles, wordStars, type GameQuestion } from '../../lib/games'
import type { RewardEvent } from '../../lib/rewards'
import type { VocabularyItem, WordProgress } from '../../types'
import { Stars, WordBubble } from './WordBubble'

type GameKind = 'spell' | 'listen' | 'meaning'

interface PracticeGamesProps {
  vocabulary: VocabularyItem[]
  progressByWord: Map<string, WordProgress>
  initialWordId: string | null
  onReward: (event: RewardEvent) => void
  onSavePractice: (wordId: string, kind: 'spelling' | 'translation', score: number) => void
  onAddWords: () => void
}

const games: { kind: GameKind; title: string; icon: string; blurb: string; color: string }[] = [
  { kind: 'spell', title: 'Spell it', icon: '🧩', blurb: 'Tap the letters', color: 'from-amber-300 to-orange-400' },
  { kind: 'listen', title: 'Listen & pick', icon: '👂', blurb: 'Hear it, find it', color: 'from-sky-300 to-indigo-400' },
  { kind: 'meaning', title: 'Meaning match', icon: '🌍', blurb: 'Pick the Arabic', color: 'from-emerald-300 to-teal-400' },
]

export function PracticeGames({ vocabulary, progressByWord, initialWordId, onReward, onSavePractice, onAddWords }: PracticeGamesProps) {
  const [game, setGame] = useState<GameKind>('spell')
  const [wordId, setWordId] = useState<string | null>(
    () => (vocabulary.find((item) => item.id === initialWordId) ?? pickWord(vocabulary, { progress: progressByWord }))?.id ?? null,
  )
  const [round, setRound] = useState(0)
  // Fall back to the first word if the chosen one disappears from the list.
  const word = vocabulary.find((item) => item.id === wordId) ?? vocabulary[0] ?? null

  const nextWord = () => {
    setWordId(pickWord(vocabulary, { progress: progressByWord, avoidId: word?.id })?.id ?? null)
    setRound((value) => value + 1)
  }

  if (!word) {
    return (
      <div className="rounded-[2rem] border-4 border-dashed border-sky-200 bg-white p-8 text-center">
        <p className="text-5xl">🎮</p>
        <h3 className="mt-3 text-2xl font-black text-slate-800">Games need words!</h3>
        <p className="mt-2 text-slate-600">Add a few words to My Words, then come back to play.</p>
        <button type="button" onClick={onAddWords} className="kid-button mt-5 bg-indigo-500 text-white shadow-indigo-200">
          ➕ Add words
        </button>
      </div>
    )
  }

  const stars = wordStars(progressByWord.get(word.id)?.mastery ?? 0)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {games.map((item) => (
          <button
            key={item.kind}
            type="button"
            aria-pressed={game === item.kind}
            onClick={() => {
              sounds.tap()
              setGame(item.kind)
              setRound((value) => value + 1)
            }}
            className={[
              'rounded-3xl bg-gradient-to-br p-3 text-left text-white shadow-lg transition sm:p-4',
              item.color,
              game === item.kind ? 'scale-[1.03] ring-4 ring-white ring-offset-2 ring-offset-sky-200' : 'opacity-80 hover:opacity-100',
            ].join(' ')}
          >
            <span className="block text-3xl sm:text-4xl">{item.icon}</span>
            <span className="mt-1 block text-sm font-black sm:text-lg">{item.title}</span>
            <span className="hidden text-xs font-semibold text-white/90 sm:block">{item.blurb}</span>
          </button>
        ))}
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
            <span>This word:</span>
            <Stars count={stars} />
          </div>
          <button type="button" onClick={nextWord} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200">
            🔀 New word
          </button>
        </div>

        {game === 'spell' ? (
          <SpellGame key={`${word.id}-${round}`} word={word} onDone={(correct) => {
            onReward({ kind: 'spelling', correct })
            onSavePractice(word.id, 'spelling', correct ? 100 : 0)
          }} onNext={nextWord} />
        ) : (
          <ChoiceGame
            key={`${word.id}-${game}-${round}`}
            word={word}
            vocabulary={vocabulary}
            kind={game === 'listen' ? 'listen' : 'meaning'}
            onDone={(correct) => {
              onReward({ kind: game === 'listen' ? 'listening' : 'translation', correct })
              if (game === 'meaning') onSavePractice(word.id, 'translation', correct ? 100 : 0)
            }}
            onNext={nextWord}
          />
        )}
      </div>
    </div>
  )
}

function SpellGame({ word, onDone, onNext }: { word: VocabularyItem; onDone: (correct: boolean) => void; onNext: () => void }) {
  const tiles = useMemo(() => spellingTiles(word.english), [word.english])
  const target = lettersOnly(word.english)
  const [picked, setPicked] = useState<number[]>([])
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const [message, setMessage] = useState('')
  const [tries, setTries] = useState(0)
  const [shake, setShake] = useState(0)

  const typed = picked.map((id) => tiles.find((tile) => tile.id === id)?.letter ?? '').join('')

  const check = () => {
    if (typed === target) {
      sounds.correct()
      speak(word.english)
      setResult('correct')
      setMessage(cheer())
      onDone(true)
    } else {
      sounds.wrong()
      setShake((value) => value + 1)
      const nextTries = tries + 1
      setTries(nextTries)
      if (nextTries >= 3) {
        setResult('wrong')
        setMessage(`It’s spelled “${word.english}”. Let’s try another!`)
        onDone(false)
      } else {
        setMessage(nudge())
        // Keep the letters that are already right.
        let keep = 0
        while (keep < typed.length && typed[keep] === target[keep]) keep += 1
        setPicked((current) => current.slice(0, keep))
      }
    }
  }

  const hint = () => {
    let keep = 0
    while (keep < typed.length && typed[keep] === target[keep]) keep += 1
    const nextLetter = target[keep]
    const base = picked.slice(0, keep)
    const tile = tiles.find((item) => item.letter === nextLetter && !base.includes(item.id))
    if (tile) setPicked([...base, tile.id])
    sounds.tap()
  }

  return (
    <div className="text-center">
      <p aria-hidden="true" className="text-6xl">✏️</p>
      <p className="mt-3 text-sm font-bold uppercase tracking-widest text-slate-400">Spell the English word for</p>
      <p dir="rtl" className="mt-1 text-4xl font-black text-sky-700">{word.arabic}</p>
      <button type="button" onClick={() => speak(word.english)} className="mt-3 rounded-full bg-sky-100 px-4 py-2 text-sm font-bold text-sky-700 hover:bg-sky-200">
        🔊 Hear it
      </button>

      <div key={shake} className={`mx-auto mt-6 flex min-h-16 max-w-xl flex-wrap justify-center gap-2 ${shake ? 'wiggle' : ''}`}>
        {Array.from({ length: target.length }, (_, index) => {
          const letter = typed[index]
          return (
            <button
              key={index}
              type="button"
              disabled={!letter || result !== null}
              onClick={() => setPicked((current) => current.slice(0, index))}
              className={[
                'flex h-14 w-11 items-center justify-center rounded-2xl border-b-4 text-3xl font-black uppercase sm:h-16 sm:w-14',
                result === 'correct' ? 'border-emerald-500 bg-emerald-100 text-emerald-700' : letter ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-slate-50 text-transparent',
              ].join(' ')}
            >
              {letter ?? '_'}
            </button>
          )
        })}
      </div>

      {result === null ? (
        <>
          <div className="mx-auto mt-6 flex max-w-xl flex-wrap justify-center gap-2">
            {tiles.map((tile) => {
              const used = picked.includes(tile.id)
              return (
                <button
                  key={tile.id}
                  type="button"
                  disabled={used || picked.length >= target.length}
                  onClick={() => {
                    sounds.tap()
                    setPicked((current) => [...current, tile.id])
                  }}
                  className={[
                    'h-14 w-14 rounded-2xl border-b-4 text-3xl font-black uppercase transition sm:h-16 sm:w-16',
                    used ? 'scale-90 border-slate-100 bg-slate-100 text-slate-300' : 'border-amber-500 bg-amber-300 text-amber-900 hover:-translate-y-1 active:translate-y-0',
                  ].join(' ')}
                >
                  {tile.letter}
                </button>
              )
            })}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => setPicked((current) => current.slice(0, -1))} disabled={!picked.length} className="kid-button bg-slate-100 text-slate-600 shadow-slate-100">
              ⬅️ Undo
            </button>
            <button type="button" onClick={hint} className="kid-button bg-violet-100 text-violet-700 shadow-violet-100">
              💡 Hint
            </button>
            <button type="button" onClick={check} disabled={typed.length !== target.length} className="kid-button bg-emerald-500 text-white shadow-emerald-200">
              ✅ Check
            </button>
          </div>
        </>
      ) : null}

      {message ? (
        <p role="status" className={`bounce-in mt-5 text-2xl font-black ${result === 'correct' ? 'text-emerald-600' : result === 'wrong' ? 'text-sky-700' : 'text-rose-500'}`}>
          {result === 'correct' ? '🎉 ' : ''}{message}
        </p>
      ) : null}

      {result !== null ? (
        <button type="button" onClick={onNext} className="kid-button mt-5 bg-indigo-500 text-white shadow-indigo-200">
          Next word ▶
        </button>
      ) : null}
    </div>
  )
}

function ChoiceGame({
  word,
  vocabulary,
  kind,
  onDone,
  onNext,
}: {
  word: VocabularyItem
  vocabulary: VocabularyItem[]
  kind: 'listen' | 'meaning'
  onDone: (correct: boolean) => void
  onNext: () => void
}) {
  const [question] = useState<GameQuestion>(() => makeQuestion(word, vocabulary, kind))
  const [chosen, setChosen] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => speak(word.english), 300)
    return () => window.clearTimeout(timer)
  }, [word.english])

  const choose = (choice: string) => {
    if (chosen) return
    setChosen(choice)
    const correct = choice === question.answer
    if (correct) sounds.correct()
    else sounds.wrong()
    if (kind === 'listen' || correct) speak(word.english)
    onDone(correct)
  }

  const correct = chosen === question.answer

  if (question.choices.length < 2) {
    return (
      <p className="rounded-2xl bg-sky-50 p-5 text-center text-lg font-bold text-sky-800">
        Add at least 2 words to play this game! 🙂
      </p>
    )
  }

  return (
    <div className="text-center">
      {kind === 'listen' ? (
        <button
          type="button"
          onClick={() => speak(word.english)}
          className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-6xl text-white shadow-xl shadow-sky-200 transition hover:scale-105 active:scale-95"
          aria-label="Play the word again"
        >
          🔊
        </button>
      ) : (
        <>
          <WordBubbleCentered word={word} />
          <p className="mt-3 text-5xl font-black text-slate-800">{word.english}</p>
          <button type="button" onClick={() => speak(word.english)} className="mt-3 rounded-full bg-sky-100 px-4 py-2 text-sm font-bold text-sky-700 hover:bg-sky-200">
            🔊 Hear it
          </button>
        </>
      )}
      <p className="mt-4 text-xl font-bold text-slate-600">{question.prompt}</p>

      <ChoiceGrid choices={question.choices} answer={question.answer} chosen={chosen} rtl={kind === 'meaning'} onChoose={choose} />

      {chosen ? (
        <div className="bounce-in mt-5">
          <p className={`text-2xl font-black ${correct ? 'text-emerald-600' : 'text-rose-500'}`}>
            {correct ? `🎉 ${cheer()}` : nudge()}
          </p>
          <p className="mt-1 text-lg text-slate-600">
            <b>{word.english}</b> = <span dir="rtl">{word.arabic}</span>
          </p>
          <button type="button" onClick={onNext} className="kid-button mt-4 bg-indigo-500 text-white shadow-indigo-200">
            Next word ▶
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function ChoiceGrid({
  choices,
  answer,
  chosen,
  rtl,
  onChoose,
}: {
  choices: string[]
  answer: string
  chosen: string | null
  rtl?: boolean
  onChoose: (choice: string) => void
}) {
  const palette = ['bg-rose-100 border-rose-300', 'bg-amber-100 border-amber-300', 'bg-sky-100 border-sky-300', 'bg-violet-100 border-violet-300']
  return (
    <div className="mx-auto mt-5 grid max-w-2xl gap-3 sm:grid-cols-2">
      {choices.map((choice, index) => {
        const isAnswer = choice === answer
        const isChosen = choice === chosen
        const state = !chosen
          ? `${palette[index % palette.length]} text-slate-800 hover:-translate-y-1 hover:shadow-lg`
          : isAnswer
            ? 'border-emerald-500 bg-emerald-200 text-emerald-900 scale-[1.02]'
            : isChosen
              ? 'wiggle border-rose-400 bg-rose-200 text-rose-900'
              : 'border-slate-200 bg-slate-50 text-slate-400'
        return (
          <button
            key={choice}
            type="button"
            dir={rtl ? 'rtl' : 'ltr'}
            disabled={chosen !== null}
            onClick={() => onChoose(choice)}
            className={`min-h-16 rounded-3xl border-b-4 px-5 py-3 text-2xl font-black transition ${state}`}
          >
            {chosen && isAnswer ? '✅ ' : chosen && isChosen ? '❌ ' : ''}
            {choice}
          </button>
        )
      })}
    </div>
  )
}

function WordBubbleCentered({ word }: { word: VocabularyItem }) {
  return (
    <div className="flex justify-center">
      <WordBubble item={word} size="lg" />
    </div>
  )
}
