import type { VocabularyItem } from '../types'

interface WordCardProps {
  item: VocabularyItem
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  compact?: boolean
}

export function WordCard({ item, onEdit, onDelete, compact = false }: WordCardProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100 transition-transform duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-200 to-orange-200 text-2xl shadow-inner shadow-white/60">
            {item.image ?? '📖'}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">{item.english}</h3>
            <p className="text-sm text-slate-500">{item.arabic}</p>
          </div>
        </div>

        {onEdit || onDelete ? (
          <div className="flex gap-2">
            {onEdit ? (
              <button
                type="button"
                onClick={() => onEdit(item.id)}
                className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700 transition hover:bg-sky-200"
              >
                Edit
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-200"
              >
                Delete
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
        <span className="rounded-full bg-sky-100 px-2 py-1 text-sky-700">{item.unit}</span>
        <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">{item.week}</span>
        <span className="rounded-full bg-purple-100 px-2 py-1 text-purple-700">{item.difficulty}</span>
      </div>

      <p className="mt-4 text-sm text-slate-600">{compact ? item.example : `Example: “${item.example}”`}</p>
      <p className="mt-2 text-xs text-slate-500">Pronunciation: {item.pronunciation}</p>
    </article>
  )
}
