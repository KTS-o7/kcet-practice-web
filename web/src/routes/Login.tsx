import { ArrowRightIcon } from '@phosphor-icons/react'
import { useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { ThemeToggle, Wordmark } from '../components/Shell'
import { Spinner } from '../components/ui'
import { api, ApiError } from '../lib/api'
import { qk } from '../lib/queries'

export default function Login() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [username, setUsername] = useState(() => localStorage.getItem('kaagada-user') ?? '')
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState<{ field: 'username' | 'passcode' | 'form'; msg: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (username.trim().length < 2) {
      setError({ field: 'username', msg: 'Enter your name (at least 2 letters).' })
      return
    }
    if (!passcode) {
      setError({ field: 'passcode', msg: 'Enter the passcode.' })
      return
    }
    setBusy(true)
    setError(null)
    try {
      const user = await api.login(username.trim(), passcode)
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
      if (err instanceof ApiError && err.status === 401) setError({ field: 'passcode', msg })
      else if (err instanceof ApiError && err.status === 400) setError({ field: 'username', msg })
      else setError({ field: 'form', msg })
      setPasscode('')
    } finally {
      setBusy(false)
    }
  }

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
              <label htmlFor="passcode" className="label mb-1.5 block">
                Passcode
              </label>
              <input
                id="passcode"
                type="password"
                className="field"
                autoComplete="current-password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                aria-invalid={error?.field === 'passcode'}
                aria-describedby={error?.field === 'passcode' ? 'login-err' : undefined}
              />
            </div>
            <p id="login-err" role="alert" aria-live="assertive" className="min-h-[18px] text-label font-medium text-wrong">
              {error?.msg}
            </p>
            <button type="submit" className="btn btn-primary h-11 w-full" disabled={busy}>
              {busy ? <Spinner /> : null}
              {busy ? 'Signing in' : 'Sign in'}
              {!busy && <ArrowRightIcon size={16} aria-hidden />}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
