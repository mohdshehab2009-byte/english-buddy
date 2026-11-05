import type { ReactNode } from 'react'

type SidebarItem = {
  label: string
  value: string
  icon: string
}

interface SidebarProps {
  title: string
  subtitle?: string
  items: SidebarItem[]
  active: string
  onSelect: (value: string) => void
  footer?: ReactNode
}

export function Sidebar({ title, subtitle, items, active, onSelect, footer }: SidebarProps) {
  return (
    <aside className="w-full rounded-[2rem] bg-gradient-to-b from-indigo-600 to-violet-700 p-3 text-white shadow-xl shadow-indigo-200 md:sticky md:top-5 md:w-64 md:self-start md:p-4">
      <div className="mb-3 flex items-center gap-3 px-1 md:mb-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-2xl">📘</div>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-black text-white">{title}</h2>
          {subtitle ? <p className="truncate text-xs font-bold text-indigo-100">{subtitle}</p> : <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">English Buddy</p>}
        </div>
      </div>

      <nav className="grid grid-cols-3 gap-2 sm:grid-cols-6 md:grid-cols-1">
        {items.map((item) => {
          const isActive = item.value === active
          return (
            <button
              key={item.value}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSelect(item.value)}
              className={[
                'flex flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-xs font-black transition-all duration-200 md:flex-row md:gap-3 md:px-3 md:py-3 md:text-base',
                isActive ? 'bg-white text-indigo-700 shadow-lg' : 'bg-white/10 text-white hover:bg-white/20',
              ].join(' ')}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-center md:text-left">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {footer ? <div className="mt-3 md:mt-5">{footer}</div> : null}
    </aside>
  )
}
