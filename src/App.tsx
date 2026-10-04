import { useEffect, useState } from 'react'
import { ChildDashboard } from './pages/ChildDashboard'
import { LandingPage } from './pages/LandingPage'
import { ParentDashboard } from './pages/ParentDashboard'
import { addVocabularyItem, deleteVocabularyItem, loadVocabulary, updateVocabularyItem } from './lib/data'
import { isSupabaseConfigured } from './lib/supabase'
import type { Role, VocabularyItem } from './types'

function App() {
  const [showLanding, setShowLanding] = useState(true)
  const [role, setRole] = useState<Role>('child')
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([])

  useEffect(() => {
    let active = true

    loadVocabulary().then((items) => {
      if (active) {
        setVocabulary(items)
      }
    })

    return () => {
      active = false
    }
  }, [])

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
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
                  Live data
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">
                  Demo mode
                </span>
              )}
            </div>
          </div>
        </header>

        {role === 'child' ? (
          <ChildDashboard vocabulary={vocabulary} />
        ) : (
          <ParentDashboard
            vocabulary={vocabulary}
            onAddWord={handleAddWord}
            onDeleteWord={handleDeleteWord}
            onUpdateWord={handleUpdateWord}
          />
        )}
      </div>
    </div>
  )
}

export default App
