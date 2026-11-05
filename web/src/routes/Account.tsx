import { CheckCircleIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { RecoveryCodeCard } from '../components/RecoveryCode'
import { PageTitle, Spinner, Switch } from '../components/ui'
import { api, ApiError } from '../lib/api'
import { qk, useMe } from '../lib/queries'

type Field = 'current' | 'password' | 'confirm' | 'form'

export default function Account() {
  const me = useMe()
  return (
    <div className="mx-auto max-w-[560px]">
      <PageTitle sub={me.data ? `Signed in as ${me.data.name}` : undefined}>Account</PageTitle>
      <div className="space-y-6">
        <Recovery />
        <Analytics />
        <ChangePassword />
      </div>
    </div>
  )
}

function ChangePassword() {
  const me = useMe()
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<{ field: Field; msg: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setDone(false)
    if (!current) return setError({ field: 'current', msg: 'Enter your current password.' })
    if (password.length < 6) return setError({ field: 'password', msg: 'Use at least 6 characters.' })
    if (password.length > 72) return setError({ field: 'password', msg: 'Use 72 characters or fewer.' })
    if (confirm !== password) return setError({ field: 'confirm', msg: 'The two new passwords don’t match.' })
    setBusy(true)
    setError(null)
    try {
      await api.changePassword(current, password)
      setDone(true)
      setCurrent('')
      setPassword('')
      setConfirm('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      if (err instanceof ApiError && err.status === 403) setError({ field: 'current', msg })
      else if (err instanceof ApiError && err.status === 400) setError({ field: 'password', msg })
      else setError({ field: 'form', msg })
    } finally {
      setBusy(false)
    }
  }

  const field = (id: Field, label: string, value: string, set: (v: string) => void, autoComplete: string, hint?: string) => (
    <div>
      <label htmlFor={`acc-${id}`} className="label mb-1.5 block">
        {label}
      </label>
      <input
        id={`acc-${id}`}
        type="password"
        className="field"
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => {
          set(e.target.value)
          setDone(false)
        }}
        aria-invalid={error?.field === id}
        aria-describedby={error?.field === id ? 'acc-err' : hint ? `acc-${id}-hint` : undefined}
      />
      {hint && (
        <p id={`acc-${id}-hint`} className="caption mt-1 text-muted">
          {hint}
        </p>
      )}
    </div>
  )

  return (
    <section aria-labelledby="pw-h" className="card p-5 sm:p-6">
      <h2 id="pw-h" className="text-h2">
        Change password
      </h2>
      <p className="mt-1 text-label font-normal text-muted">
        Any other device logged in to this account is signed out. This one stays signed in.
      </p>
      <form onSubmit={submit} noValidate className="mt-5 space-y-4">
        {/* hidden username helps password managers save the new password against the right account */}
        <input type="text" autoComplete="username" value={me.data?.name ?? ''} readOnly hidden />
        {field('current', 'Current password', current, setCurrent, 'current-password')}
        {field('password', 'New password', password, setPassword, 'new-password', 'At least 6 characters. A long phrase is easier to remember and harder to guess.')}
        {field('confirm', 'Type the new one again', confirm, setConfirm, 'new-password')}
        <p id="acc-err" role="alert" aria-live="assertive" className="min-h-[18px] text-label font-medium text-wrong">
          {error?.msg}
        </p>
        {done && (
          <p role="status" className="flex items-center gap-2 text-label font-semibold text-correct">
            <CheckCircleIcon size={18} weight="fill" aria-hidden /> Password changed. Other devices were signed out.
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy && <Spinner />}
          {busy ? 'Changing password' : 'Change password'}
        </button>
      </form>
    </section>
  )
}

function Recovery() {
  const me = useMe()
  const qc = useQueryClient()
  const has = me.data?.has_recovery
  const [current, setCurrent] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [code, setCode] = useState<string | null>(null)

  const make = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (!current) return setError('Enter your current password.')
    setBusy(true)
    setError('')
    try {
      const r = await api.newRecovery(current)
      setCode(r.recovery_code)
      setCurrent('')
      if (me.data) qc.setQueryData(qk.me, { ...me.data, has_recovery: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  if (code) {
    return (
      <section id="recovery" className="card p-5 sm:p-6">
        <RecoveryCodeCard
          code={code}
          name={me.data?.name ?? ''}
          title="Your new recovery code"
          intro="Your old code (if you had one) no longer works. If you forget your password, use “Forgot password?” on the login page with this code."
          doneLabel="Done"
          onDone={() => setCode(null)}
        />
      </section>
    )
  }

  return (
    <section id="recovery" aria-labelledby="rec-h" className={`card p-5 sm:p-6 ${has === false ? 'shadow-[0_0_0_2px_var(--color-marked)]' : ''}`}>
      <h2 id="rec-h" className="flex items-center gap-2 text-h2">
        {has === false && <WarningCircleIcon size={22} weight="fill" className="text-marked" aria-hidden />}
        Recovery code
      </h2>
      <p className="mt-1 text-label font-normal text-muted">
        {has === false
          ? 'You don’t have one yet. Without it, a forgotten password can’t be recovered (there’s no email reset). Make one now and keep it safe.'
          : 'You have a recovery code. Lost it? Make a new one; the old one stops working.'}
      </p>
      <form onSubmit={make} noValidate className="mt-5 space-y-4">
        <input type="text" autoComplete="username" value={me.data?.name ?? ''} readOnly hidden />
        <div>
          <label htmlFor="rec-current" className="label mb-1.5 block">
            Current password
          </label>
          <input
            id="rec-current"
            type="password"
            className="field"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? 'rec-err' : undefined}
          />
        </div>
        <p id="rec-err" role="alert" aria-live="assertive" className="min-h-[18px] text-label font-medium text-wrong">
          {error}
        </p>
        <button type="submit" className={`btn ${has === false ? 'btn-primary' : 'btn-secondary'}`} disabled={busy}>
          {busy && <Spinner />}
          {has === false ? 'Make a recovery code' : 'Make a new recovery code'}
        </button>
      </form>
    </section>
  )
}

function Analytics() {
  const me = useMe()
  const qc = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const on = me.data?.analytics === true
  const set = async (allow: boolean) => {
    setBusy(true)
    setError('')
    try {
      await api.setAnalytics(allow)
      if (me.data) qc.setQueryData(qk.me, { ...me.data, analytics: allow })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <section aria-labelledby="an-h" className="card p-5 sm:p-6">
      <h2 id="an-h" className="mb-3 text-h2">
        Usage analytics
      </h2>
      <Switch
        checked={on}
        disabled={busy || !me.data}
        onChange={(v) => void set(v)}
        label="Allow usage analytics while I’m logged in"
        description="Pages you open, buttons you click and tests you take go to PostHog (in the EU) under a random ID, never your name. It helps us see what to improve. Only if you’re 18 or older, or your parent or guardian agrees."
      />
      {error && (
        <p role="alert" className="mt-3 text-label font-medium text-wrong">
          {error}
        </p>
      )}
    </section>
  )
}
