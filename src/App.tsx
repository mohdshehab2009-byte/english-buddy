import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { ParentAuth } from './components/ParentAuth'
import { ChildDashboard } from './pages/ChildDashboard'
import { LandingPage } from './pages/LandingPage'
import { ParentDashboard } from './pages/ParentDashboard'
import { addVocabularyItem, deleteVocabularyItem, loadVocabulary, updateVocabularyItem } from './lib/data'
import { ensureChildProfile, loadLearningData, saveQuizResult, saveWordPractice } from './lib/learning'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import type { QuizResult, Role, VocabularyItem, WordProgress } from './types'

function App() {
  const [showLanding, setShowLanding] = useState(true)
  const [role, setRole] = useState<Role>('child')
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([])
  const [session, setSession] = useState<Session | null>(null)
  const sessionRef = useRef<Session | null>(null)
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured)
  const [authError, setAuthError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [reloadCount, setReloadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [wordProgress, setWordProgress] = useState<WordProgress[]>([])
  const [quizResults, setQuizResults] = useState<QuizResult[]>([])
  const [learningError, setLearningError] = useState('')

  useEffect(() => {
    if (!supabase) return

    let active = true
    let receivedAuthEvent = false
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      receivedAuthEvent = true
      const previousUserId = sessionRef.current?.user.id
      sessionRef.current = nextSession
      setSession(nextSession)
      setAuthReady(true)
      setIsLoading(true)
      setAuthError('')
      if (previousUserId !== nextSession?.user.id) {
        setProfileId(null)
        setWordProgress([])
        setQuizResults([])
        setLearningError('')
      }
    })

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active || receivedAuthEvent) return
      if (error) {
        setAuthError(`Could not restore your parent session: ${error.message}`)
      } else {
        sessionRef.current = data.session
        setSession(data.session)
      }
      setAuthReady(true)
    }).catch((error: unknown) => {
      if (!active || receivedAuthEvent) return
      setAuthError(error instanceof Error ? error.message : 'Could not restore your parent session.')
      setAuthReady(true)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let active = true

    if (!session?.user.id || !supabase) {
      return
    }

    void ensureChildProfile(session.user.id, 'Musa').then((id) => {
      if (active) setProfileId(id)
    }).catch((error: unknown) => {
      if (active) {
        setLearningError(error instanceof Error ? error.message : 'Could not prepare the child profile.')
      }
    })

    return () => {
      active = false
    }
  }, [session?.user.id])

  useEffect(() => {
    let active = true

    if (!profileId) return

    void loadLearningData(profileId).then(({ wordProgress: savedProgress, quizResults: savedQuizzes }) => {
      if (!active) return
      setWordProgress(savedProgress)
      setQuizResults(savedQuizzes)
      setLearningError('')
    }).catch((error: unknown) => {
      if (active) {
        setLearningError(error instanceof Error ? error.message : 'Could not load learning progress.')
      }
    })

    return () => {
      active = false
    }
  }, [profileId])

  useEffect(() => {
    let active = true

    if (!authReady) return

    void loadVocabulary(session?.user.id).then((items) => {
      if (!active) return
      setLoadError('')
      setVocabulary(items)
    }).catch((error: unknown) => {
      if (!active) return
      setVocabulary([])
      setLoadError(error instanceof Error ? error.message : 'Could not load vocabulary.')
    }).finally(() => {
      if (active) setIsLoading(false)
    })

    return () => {
      active = false
    }
  }, [authReady, reloadCount, session?.user.id])

  const handleAddWord = async (item: VocabularyItem) => {
    const saved = await addVocabularyItem(item)
    setVocabulary((current) => [saved, ...current.filter((entry) => entry.id !== item.id)])
  }

  const handleDeleteWord = async (id: string) => {
    await deleteVocabularyItem(id)
    setVocabulary((current) => current.filter((item) => item.id !== id))
  }

  const handleUpdateWord = async (id: string, item: VocabularyItem) => {
    const saved = await updateVocabularyItem(id, item)
    setVocabulary((current) => current.map((entry) => (entry.id === id ? saved : entry)))
  }

  const handleSaveQuizResult = async (score: number, totalQuestions: number) => {
    if (!profileId) throw new Error('Sign in as a parent before saving quiz results.')
    const savedResult = await saveQuizResult(profileId, score, totalQuestions)
    setQuizResults((current) => [savedResult, ...current])
    return savedResult
  }

  const handleSaveWordPractice = async (wordId: string, kind: 'spelling' | 'translation', score: number) => {
    if (!profileId) throw new Error('Sign in as a parent before saving word progress.')
    const savedProgress = await saveWordPractice(profileId, wordId, kind, score)
    setWordProgress((current) => [
      savedProgress,
      ...current.filter((record) => record.wordId !== savedProgress.wordId),
    ])
    return savedProgress
  }

  const handleSignOut = async () => {
    if (!supabase) return
    try {
      const { error } = await supabase.auth.signOut()
      if (error) setAuthError(`Could not sign out: ${error.message}`)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Could not sign out.')
    }
  }

  if (showLanding) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe_0%,_#f5f3ff_38%,_#fff7ed_100%)] px-4 py-5 text-slate-800 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-7xl">
          <LandingPage onStart={() => setShowLanding(false)} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7_0%,_#f0f9ff_30%,_#eef2ff_100%)] px-4 py-5 text-slate-800 md:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-[28px] border border-slate-200 bg-white/80 p-4 shadow-lg shadow-slate-200/60 backdrop-blur-sm md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <button type="button" onClick={() => setShowLanding(true)} className="text-left">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-600">Home learning companion</p>
              <span className="mt-2 block text-2xl font-black text-slate-900 md:text-3xl">English Buddy</span>
            </button>

            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-2xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setRole('child')}
                  aria-pressed={role === 'child'}
                  className={[
                    'rounded-xl px-4 py-2 text-sm font-bold transition',
                    role === 'child' ? 'bg-white text-sky-700 shadow-md' : 'text-slate-600',
                  ].join(' ')}
                >
                  Child view
                </button>
                <button
                  type="button"
                  onClick={() => setRole('parent')}
                  aria-pressed={role === 'parent'}
                  className={[
                    'rounded-xl px-4 py-2 text-sm font-bold transition',
                    role === 'parent' ? 'bg-white text-indigo-700 shadow-md' : 'text-slate-600',
                  ].join(' ')}
                >
                  Parent view
                </button>
              </div>

              {isSupabaseConfigured ? (
                <>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
                    Supabase
                  </span>
                  {role === 'parent' && session?.user.email ? (
                    <>
                      <span className="hidden text-xs text-slate-500 sm:inline">{session.user.email}</span>
                      <button
                        type="button"
                        onClick={() => void handleSignOut()}
                        className="min-h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50"
                      >
                        Sign out
                      </button>
                    </>
                  ) : null}
                </>
              ) : (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">
                  Demo mode
                </span>
              )}
            </div>
          </div>
        </header>

        {authError ? (
          <p role="alert" className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {authError}
          </p>
        ) : null}

        {learningError ? (
          <p role="alert" className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {learningError}
          </p>
        ) : null}

        {loadError ? (
          <div role="alert" className="mb-4 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between">
            <span>{loadError}</span>
            <button
              type="button"
              onClick={() => {
                setIsLoading(true)
                setLoadError('')
                setReloadCount((count) => count + 1)
              }}
              className="min-h-10 rounded-xl bg-white px-3 font-bold text-rose-700 shadow-sm"
            >
              Retry
            </button>
          </div>
        ) : null}

        {role === 'child' ? (
          isLoading ? (
            <p role="status" className="rounded-2xl bg-white/80 p-5 text-sm font-semibold text-slate-600">Loading vocabulary…</p>
          ) : (
            <ChildDashboard
              vocabulary={vocabulary}
              profileId={profileId}
              canSaveProgress={Boolean(profileId)}
              wordProgress={wordProgress}
              quizResults={quizResults}
              onSaveWordPractice={handleSaveWordPractice}
              onSaveQuizResult={handleSaveQuizResult}
            />
          )
        ) : isSupabaseConfigured && !authReady ? (
          <p role="status" className="rounded-2xl bg-white/80 p-5 text-sm font-semibold text-slate-600">Restoring parent session…</p>
        ) : isSupabaseConfigured && !session ? (
          <ParentAuth onAuthenticated={() => setAuthError('')} />
        ) : (
          <ParentDashboard
            vocabulary={vocabulary}
            onAddWord={handleAddWord}
            onDeleteWord={handleDeleteWord}
            onUpdateWord={handleUpdateWord}
            canManageAllWords={!isSupabaseConfigured}
            wordProgress={wordProgress}
            quizResults={quizResults}
          />
        )}
      </div>
    </div>
  )
}

export default App
