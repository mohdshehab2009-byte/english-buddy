import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface ParentAuthProps {
  onAuthenticated: () => void
}

export function ParentAuth({ onAuthenticated }: ParentAuthProps) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) return

    setBusy(true)
    setError('')
    setMessage('')

    try {
      if (mode === 'sign-in') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
        onAuthenticated()
        return
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: new URL(import.meta.env.BASE_URL, window.location.origin).toString(),
        },
      })

      if (signUpError) throw signUpError

      if (data.session) {
        onAuthenticated()
      } else {
        setMessage('Check your email to confirm your account, then return here to sign in.')
        setMode('sign-in')
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Authentication failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-2xl">🔐</div>
      <p className="mt-4 text-center text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-600">Parent access</p>
      <h2 className="mt-2 text-center text-2xl font-black text-slate-900">
        {mode === 'sign-in' ? 'Sign in to manage words' : 'Create a parent account'}
      </h2>
      <p className="mt-2 text-center text-sm leading-6 text-slate-600">
        Vocabulary is public to read. A parent account is required to add, change, or remove words.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold text-slate-700">
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1.5 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base outline-none transition focus:border-indigo-400 focus:bg-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Password
          <input
            type="password"
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1.5 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base outline-none transition focus:border-indigo-400 focus:bg-white"
          />
          {mode === 'sign-up' ? <span className="mt-1 block text-xs font-normal text-slate-500">Use at least 8 characters.</span> : null}
        </label>

        {error ? <p role="alert" className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
        {message ? <p role="status" className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="min-h-12 w-full rounded-2xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
        >
          {busy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-600">
        {mode === 'sign-in' ? 'New parent?' : 'Already registered?'}{' '}
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')
            setError('')
            setMessage('')
          }}
          className="font-bold text-indigo-700 underline decoration-indigo-300 underline-offset-4"
        >
          {mode === 'sign-in' ? 'Create an account' : 'Sign in instead'}
        </button>
      </p>
    </section>
  )
}
