interface LandingPageProps {
  onStart: () => void
}

const features = [
  {
    icon: '🧠',
    title: 'Words that stick',
    description: 'Learn useful school vocabulary with clear Arabic meanings and friendly examples.',
    color: 'bg-sky-100',
  },
  {
    icon: '🎧',
    title: 'Learn by doing',
    description: 'Practice spelling, translation, and pronunciation in short, simple sessions.',
    color: 'bg-amber-100',
  },
  {
    icon: '⭐',
    title: 'Celebrate progress',
    description: 'Build a learning streak, earn points, and unlock achievements along the way.',
    color: 'bg-emerald-100',
  },
]

export function LandingPage({ onStart }: LandingPageProps) {
  return (
    <main className="overflow-hidden rounded-[32px] border border-white/80 bg-white shadow-2xl shadow-indigo-200/50">
      <section className="relative isolate overflow-hidden bg-[#f5f5ff] px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
        <div aria-hidden="true" className="absolute -right-20 -top-24 -z-10 h-80 w-80 rounded-full bg-sky-200/60 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-28 left-1/3 -z-10 h-72 w-72 rounded-full bg-amber-200/60 blur-3xl" />

        <nav className="flex items-center justify-between">
          <a href="#top" className="flex items-center gap-3" aria-label="English Buddy home">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-2xl shadow-lg">📘</span>
            <span className="text-lg font-black tracking-tight text-slate-900">English Buddy</span>
          </a>
          <button
            type="button"
            onClick={onStart}
            className="min-h-11 rounded-full border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Open the app <span aria-hidden="true">→</span>
          </button>
        </nav>

        <div id="top" className="grid items-center gap-12 pt-14 lg:grid-cols-[1fr_0.9fr] lg:gap-16 lg:pt-20">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-sky-800 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Little lessons, big confidence
            </span>
            <h1 className="mt-6 text-5xl font-black leading-[1.04] tracking-[-0.05em] text-slate-950 sm:text-6xl lg:text-7xl">
              English practice
              <span className="block bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-600 bg-clip-text pb-2 text-transparent">
                made joyful.
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
              A cheerful learning space to help children grow their vocabulary, practice spelling, and feel proud of every new word.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onStart}
                className="min-h-14 rounded-2xl bg-slate-900 px-7 text-base font-bold text-white shadow-xl shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-indigo-700 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
              >
                Start learning <span className="ml-2" aria-hidden="true">→</span>
              </button>
              <a
                href="#how-it-works"
                className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-7 text-base font-bold text-slate-700 transition hover:bg-white"
              >
                See how it works
              </a>
            </div>
            <div className="mt-8 flex items-center gap-3 text-sm font-medium text-slate-600">
              <span className="flex -space-x-2" aria-hidden="true">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#f5f5ff] bg-amber-200">🌟</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#f5f5ff] bg-sky-200">📚</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#f5f5ff] bg-emerald-200">🎉</span>
              </span>
              Made for curious young learners
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -left-5 top-12 z-10 hidden -rotate-6 rounded-2xl border border-white bg-white px-4 py-3 shadow-xl sm:block">
              <span className="text-xl">🔥</span>
              <span className="ml-2 text-sm font-extrabold text-slate-800">9 day streak!</span>
            </div>
            <div className="absolute -right-4 bottom-16 z-10 hidden rotate-3 rounded-2xl border border-white bg-white px-4 py-3 shadow-xl sm:block">
              <span className="text-xl">⭐</span>
              <span className="ml-2 text-sm font-extrabold text-slate-800">You earned 20 points</span>
            </div>

            <div className="rounded-[32px] border border-white bg-white/75 p-4 shadow-2xl shadow-indigo-200/70 backdrop-blur">
              <div className="rounded-[26px] bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-600 p-6 text-white sm:p-8">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-100">Your learning space</p>
                    <p className="mt-2 text-2xl font-black">Hello, Mujtaba! 👋</p>
                  </div>
                  <span className="rounded-2xl bg-white/15 px-3 py-2 text-sm font-bold">Level 3</span>
                </div>
                <div className="mt-7 rounded-3xl bg-white p-5 text-slate-800 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Your word list</p>
                      <p className="mt-2 text-2xl font-black">Ready to begin?</p>
                      <p className="text-sm font-medium text-sky-700">Add your first word</p>
                    </div>
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-4xl">🌼</div>
                  </div>
                  <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">Build a personal vocabulary list one word at a time.</p>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-slate-100">
                      <div className="h-2 w-2/3 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500" />
                    </div>
                    <span className="text-xs font-bold text-slate-500">3 / 5</span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  {[
                    ['📝', 'Words'],
                    ['🎧', 'Practice'],
                    ['🏆', 'Rewards'],
                  ].map(([icon, title]) => (
                    <div key={title} className="rounded-2xl bg-white/15 px-2 py-3">
                      <span className="text-xl">{icon}</span>
                      <p className="mt-1 text-xs font-bold text-white">{title}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-6 py-14 sm:px-10 sm:py-16 lg:px-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-indigo-600">A little learning goes a long way</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Practice that feels like progress</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">Short, friendly activities make it easier to build a happy English-learning habit together.</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {features.map((feature, index) => (
            <article key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60">
              <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${feature.color} text-2xl`}>{feature.icon}</span>
              <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">0{index + 1}</p>
              <h3 className="mt-1 text-xl font-black text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50 px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-16">
        <div>
          <p className="font-black text-slate-900">English Buddy <span aria-hidden="true">📘</span></p>
          <p className="mt-1 text-sm text-slate-500">A little practice. A lot of confidence.</p>
        </div>
        <button
          type="button"
          onClick={onStart}
          className="min-h-12 rounded-2xl bg-indigo-600 px-5 text-sm font-bold text-white transition hover:bg-indigo-700"
        >
          Explore the learning app <span className="ml-1" aria-hidden="true">→</span>
        </button>
      </footer>
    </main>
  )
}
