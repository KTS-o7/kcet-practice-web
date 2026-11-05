import { CheckCircleIcon } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import { PageTitle, Spinner } from '../components/ui'
import { api, ApiError } from '../lib/api'
import { useMe } from '../lib/queries'

type Field = 'current' | 'password' | 'confirm' | 'form'

export default function Account() {
  const me = useMe()
  return (
    <div className="mx-auto max-w-[560px]">
      <PageTitle sub={me.data ? `Signed in as ${me.data.name}` : undefined}>Account</PageTitle>
      <ChangePassword />
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
