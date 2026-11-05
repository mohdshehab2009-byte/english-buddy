import { useState } from 'react'
import { sounds } from '../../lib/feedback'
import type { SyncStatus } from '../../lib/rewards'

const statusText: Record<SyncStatus, string> = {
  synced: '☁️ Saved online — works on every device',
  syncing: '🔄 Saving…',
  offline: '⚠️ Couldn’t save online right now — saved on this device for now',
  local: '📱 Saved on this device only',
}

interface BuddyIdCardProps {
  childId: string
  syncStatus: SyncStatus
  onLink: (id: string) => Promise<string | null>
  compact?: boolean
  onDismiss?: () => void
}

export function BuddyIdCard({ childId, syncStatus, onLink, compact = false, onDismiss }: BuddyIdCardProps) {
  const [showLink, setShowLink] = useState(compact)
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [copied, setCopied] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    const problem = await onLink(value)
    setBusy(false)
    if (problem) {
      setError(problem)
      sounds.wrong()
    } else {
      setDone(true)
      setValue('')
      setShowLink(false)
      sounds.fanfare()
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(childId)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard not available; the ID is still visible to write down.
    }
  }

  const linkForm = (
    <form onSubmit={(event) => void submit(event)} className="mt-3 flex flex-wrap gap-2">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="STAR-7K3Q"
        aria-label="Buddy ID from your other device"
        autoCapitalize="characters"
        autoComplete="off"
        maxLength={12}
        className="kid-input max-w-[12rem] uppercase tracking-widest"
      />
      <button type="submit" disabled={busy || value.trim().length < 8} className="kid-button bg-indigo-500 text-white shadow-indigo-200">
        {busy ? 'Looking…' : '🔗 Bring my stars'}
      </button>
      {error ? <p role="alert" className="w-full text-sm font-bold text-rose-600">{error}</p> : null}
    </form>
  )

  if (compact) {
    return (
      <section className="bounce-in rounded-[2rem] border-4 border-dashed border-indigo-200 bg-indigo-50 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-indigo-800">📱 Playing on a new device?</h3>
            <p className="mt-1 font-semibold text-indigo-700">
              Type the <b>Buddy ID</b> from your other device to bring your stars, streak and badges here.
              (Find it on <b>My Journey</b>.)
            </p>
          </div>
          {onDismiss ? (
            <button type="button" onClick={onDismiss} aria-label="Hide this message" className="rounded-full bg-white px-3 py-1 text-sm font-black text-indigo-500">
              ✖
            </button>
          ) : null}
        </div>
        {linkForm}
      </section>
    )
  }

  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-sm">
      <h3 className="text-xl font-black text-slate-800">🪪 My Buddy ID</h3>
      <p className="mt-1 text-sm font-semibold text-slate-500">Use this ID on any phone, tablet or computer to keep your stars.</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="rounded-2xl bg-gradient-to-r from-amber-200 to-orange-200 px-5 py-3 font-mono text-3xl font-black tracking-[0.2em] text-orange-900">
          {childId}
        </span>
        <button type="button" onClick={() => void copy()} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200">
          {copied ? '✅ Copied' : '📋 Copy'}
        </button>
      </div>
      <p className="mt-3 text-xs font-bold text-slate-400">{statusText[syncStatus]}</p>
      {done ? <p className="bounce-in mt-2 font-black text-emerald-600">🎉 Linked! Your stars are together now.</p> : null}
      {showLink ? linkForm : (
        <button type="button" onClick={() => setShowLink(true)} className="mt-3 text-sm font-black text-indigo-600 underline underline-offset-4">
          I already have a Buddy ID from another device
        </button>
      )}
    </section>
  )
}
