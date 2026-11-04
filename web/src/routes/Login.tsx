import { ArrowRightIcon } from '@phosphor-icons/react'
import { useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { ThemeToggle, Wordmark } from '../components/Shell'
import { Spinner } from '../components/ui'
import { api, ApiError } from '../lib/api'
import { qk } from '../lib/queries'

type Mode = 'login' | 'signup'
type Field = 'username' | 'password' | 'confirm' | 'form'

export default function Login() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const remembered = (() => {
    try {
      return localStorage.getItem('kaagada-user') ?? ''
    } catch {
      return ''
    }
  })()
  const [mode, setMode] = useState<Mode>(remembered ? 'login' : 'signup')
  const [username, setUsername] = useState(remembered)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<{ field: Field; msg: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const signup = mode === 'signup'

  const switchMode = (m: Mode) => {
    setMode(m)
    setError(null)
    setPassword('')
    setConfirm('')
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (username.trim().length < 2) return setError({ field: 'username', msg: 'Enter your name (at least 2 letters).' })
    if (signup && password.length < 6) return setError({ field: 'password', msg: 'Use at least 6 characters.' })
    if (!password) return setError({ field: 'password', msg: 'Enter your password.' })
    if (signup && confirm !== password) return setError({ field: 'confirm', msg: 'The two passwords don’t match.' })
    setBusy(true)
    setError(null)
    try {
      const user = signup ? await api.signup(username.trim(), password) : await api.login(username.trim(), password)
      try {
        localStorage.setItem('kaagada-user', user.name)
      } catch {
        /* ignore */
      }
      qc.setQueryData(qk.me, user)
      const next = params.get('next')
      navigate(next && next.startsWith('/') && !next.startsWith('//') ? next : '/', { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      if (err instanceof ApiError && err.status === 401) setError({ field: 'password', msg })
      else if (err instanceof ApiError && (err.status === 400 || err.status === 409))
        setError({ field: msg.toLowerCase().includes('password') ? 'password' : 'username', msg })
      else setError({ field: 'form', msg })
      setPassword('')
      setConfirm('')
    } finally {
      setBusy(false)
    }
  }

  const tab = (m: Mode, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === m}
      onClick={() => switchMode(m)}
      className={`h-9 flex-1 rounded-[7px] text-label transition-colors ${
        mode === m ? 'bg-raised font-semibold text-ink shadow-[0_1px_0_var(--color-line)]' : 'text-muted hover:text-ink'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="relative grid min-h-dvh place-items-center px-4 py-10">
      <div className="absolute top-3 right-3">
        <ThemeToggle />
      </div>
      <main className="w-full max-w-[360px]">
        <div className="mb-7 text-center">
          <h1 className="text-[44px] leading-[48px]">
            <Wordmark />
          </h1>
          <p className="mt-1 text-label text-muted">
            <span lang="kn">ಕಾಗದ</span> · KCET practice
          </p>
        </div>
        <form onSubmit={submit} noValidate className="card relative overflow-hidden p-6">
          {/* notebook margin rule */}
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-3 w-px bg-wrong/25" />
          <div role="tablist" aria-label="Account" className="mb-5 flex gap-1 rounded-[9px] border border-line bg-paper p-1">
            {tab('login', 'Log in')}
            {tab('signup', 'Create account')}
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="label mb-1.5 block">
                Your name
              </label>
              <input
                id="username"
                className="field"
                autoFocus
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                aria-invalid={error?.field === 'username'}
                aria-describedby={error?.field === 'username' ? 'login-err' : undefined}
              />
            </div>
            <div>
              <label htmlFor="password" className="label mb-1.5 block">
                {signup ? 'Choose a password' : 'Password'}
              </label>
              <input
                id="password"
                type="password"
                className="field"
                autoComplete={signup ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={error?.field === 'password'}
                aria-describedby={error?.field === 'password' ? 'login-err' : signup ? 'pw-hint' : undefined}
              />
              {signup && (
                <p id="pw-hint" className="caption mt-1 text-muted">
                  At least 6 characters. You’ll use it to log in on any device.
                </p>
              )}
            </div>
            {signup && (
              <div>
                <label htmlFor="confirm" className="label mb-1.5 block">
                  Type it again
                </label>
                <input
                  id="confirm"
                  type="password"
                  className="field"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  aria-invalid={error?.field === 'confirm'}
                  aria-describedby={error?.field === 'confirm' ? 'login-err' : undefined}
                />
              </div>
            )}
            <p id="login-err" role="alert" aria-live="assertive" className="min-h-[18px] text-label font-medium text-wrong">
              {error?.msg}
            </p>
            <button type="submit" className="btn btn-primary h-11 w-full" disabled={busy}>
              {busy ? <Spinner /> : null}
              {busy ? (signup ? 'Creating account' : 'Logging in') : signup ? 'Create account' : 'Log in'}
              {!busy && <ArrowRightIcon size={16} aria-hidden />}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
