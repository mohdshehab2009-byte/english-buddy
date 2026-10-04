interface StatCardProps {
  title: string
  value: string
  subtitle: string
  tone: 'sky' | 'green' | 'amber' | 'rose'
}

const toneMap = {
  sky: 'from-sky-400 to-blue-500',
  green: 'from-emerald-400 to-green-500',
  amber: 'from-amber-400 to-orange-500',
  rose: 'from-pink-400 to-rose-500',
}

export function StatCard({ title, value, subtitle, tone }: StatCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200">
      <div className={`mb-3 h-2 w-16 rounded-full bg-gradient-to-r ${toneMap[tone]}`} />
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
      <p className="mt-2 text-xs font-medium text-slate-500">{subtitle}</p>
    </div>
  )
}
