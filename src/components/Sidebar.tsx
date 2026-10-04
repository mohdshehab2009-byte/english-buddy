type SidebarItem = {
  label: string
  value: string
  icon: string
}

interface SidebarProps {
  title: string
  items: SidebarItem[]
  active: string
  onSelect: (value: string) => void
}

export function Sidebar({ title, items, active, onSelect }: SidebarProps) {
  return (
    <aside className="w-full rounded-3xl bg-slate-900 p-4 text-white shadow-xl shadow-sky-200 md:w-72 md:p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 text-xl shadow-lg shadow-sky-500/30">
          📘
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-sky-200">English Buddy</p>
          <h2 className="text-lg font-bold text-white">{title}</h2>
        </div>
      </div>

      <nav className="flex flex-col gap-2">
        {items.map((item) => {
          const isActive = item.value === active

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onSelect(item.value)}
              className={[
                'flex items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition-all duration-200',
                isActive
                  ? 'border-sky-300 bg-sky-500/20 text-sky-50 shadow-lg shadow-sky-500/10'
                  : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10',
              ].join(' ')}
            >
              <span className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </span>
              <span className="text-slate-300">→</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
