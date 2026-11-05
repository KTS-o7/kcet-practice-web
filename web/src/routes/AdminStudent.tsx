import { ArrowLeftIcon, ArrowClockwiseIcon, CheckIcon, CopyIcon, KeyIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { Dialog } from '../components/Dialog'
import { Link, useParams, useSearchParams } from 'react-router'
import { ErrorState, Meter, Skeleton, Spinner, subjectBgClass } from '../components/ui'
import { api, ApiError } from '../lib/api'
import { attemptMeta, duration, isLive, isSubject, pct, plural, relDay, SUBJECTS, subjectName } from '../lib/format'
import { useAdminStudent, useMe, useMeta } from '../lib/queries'
import type { AdminStudentDetail, Attempt, Meta, SubjectId } from '../lib/types'
import { SubjectProgress } from './Progress'

/** One student's progress, read-only, for the owners. */
export default function AdminStudent() {
  const { id = '' } = useParams()
  const me = useMe()
  const q = useAdminStudent(id, me.data?.admin === true)
  const meta = useMeta()

  // Not an admin: the same page as any unknown link, so the admin area isn't revealed.
  if (me.data && !me.data.admin) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="font-display text-h1">Nothing on this page.</p>
        <p className="mt-2 text-muted">The link may be old.</p>
        <Link to="/" className="btn btn-secondary mt-6">
          Go home
        </Link>
      </div>
    )
  }
  if (q.error instanceof ApiError && q.error.status === 404) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="font-display text-h1">No such student.</p>
        <Link to="/admin" className="btn btn-secondary mt-6">
          Back to admin
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1040px]">
      <Link to="/admin" className="link mb-4 inline-flex items-center gap-1.5 text-label">
        <ArrowLeftIcon size={14} aria-hidden /> All students
      </Link>
      {q.isPending || meta.isPending ? (
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[92px] rounded-[14px]" />
            ))}
          </div>
          <Skeleton className="h-[268px] rounded-[14px]" />
        </div>
      ) : q.error || meta.error ? (
        <ErrorState
          error={q.error ?? meta.error}
          onRetry={() => {
            void q.refetch()
            void meta.refetch()
          }}
        />
      ) : (
        <Detail d={q.data} meta={meta.data} refetch={() => q.refetch()} fetching={q.isFetching} />
      )}
    </div>
  )
}

function Detail({ d, meta, refetch, fetching }: { d: AdminStudentDetail; meta: Meta; refetch: () => void; fetching: boolean }) {
  const [params, setParams] = useSearchParams()
  const s = params.get('s')
  const { student, stats, tests } = d
  const finished = tests.filter((t) => t.submitted_at != null)
  const live = tests.filter((t) => isLive(t))
  const abandoned = tests.length - finished.length - live.length

  const all = SUBJECTS.reduce(
    (acc, x) => {
      const st = stats.subjects[x]
      if (st) {
        acc.answered += st.answered
        acc.correct += st.correct
        acc.unique += st.unique
        acc.time += st.time_ms
      }
      return acc
    },
    { answered: 0, correct: 0, unique: 0, time: 0 },
  )
  // Default to the subject they've practised most.
  const busiest = [...SUBJECTS].sort((a, b) => (stats.subjects[b]?.answered ?? 0) - (stats.subjects[a]?.answered ?? 0))[0]
  const subject: SubjectId = isSubject(s ?? undefined) ? (s as SubjectId) : busiest
  const acc = pct(all.correct, all.answered)

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-h1">{student.name}</h1>
          <p className="mt-1 text-muted">
            Joined {relDay(student.joined).replace(/^(Today|Yesterday)/, (m) => m.toLowerCase())} · last active{' '}
            {relDay(student.last_active, true).replace(/^(Today|Yesterday)/, (m) => m.toLowerCase())}
          </p>
        </div>
        <div className="flex gap-2">
          <ResetPassword id={student.id} name={student.name} />
          <button type="button" className="btn btn-secondary btn-sm" onClick={refetch} disabled={fetching}>
            <ArrowClockwiseIcon size={16} aria-hidden className={fetching ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile
          label="Tests finished"
          value={String(finished.length)}
          sub={live.length || abandoned ? [live.length && `${live.length} in progress`, abandoned && `${abandoned} left unfinished`].filter(Boolean).join(' · ') : 'none left unfinished'}
        />
        <Tile label="Accuracy" value={acc == null ? '—' : `${acc}%`} sub={all.answered ? `${all.correct} of ${all.answered} answered` : 'No answers yet'} />
        <Tile label="Questions practised" value={all.unique.toLocaleString('en-IN')} sub="different questions" />
        <Tile label="Time spent" value={all.time ? duration(all.time) : '—'} sub={all.answered ? `${Math.round(all.time / 1000 / Math.max(1, all.answered))} s per answer` : undefined} />
      </dl>

      <section aria-labelledby="subj-h">
        <h2 id="subj-h" className="mb-3 text-h2">
          By subject
        </h2>
        <div role="group" aria-label="Subject" className="grid gap-3 sm:grid-cols-3">
          {SUBJECTS.map((x) => {
            const st = stats.subjects[x]
            const p = st ? pct(st.correct, st.answered) : null
            const n = finished.filter((t) => t.subject === x).length
            const on = x === subject
            return (
              <button
                key={x}
                type="button"
                aria-pressed={on}
                onClick={() => setParams({ s: x }, { replace: true })}
                className={`card px-4 py-3.5 text-left transition-shadow duration-150 ease-k ${
                  on ? 'shadow-[0_0_0_2px_var(--color-accent)]' : 'hover:shadow-[0_0_0_1px_var(--color-line-strong)]'
                }`}
              >
                <span className="caption flex items-center gap-2 text-muted">
                  <span aria-hidden className={`h-2 w-2 rounded-full ${subjectBgClass(x)}`} />
                  {subjectName[x]}
                </span>
                <span className="mt-0.5 block font-display text-stat font-semibold num">{p == null ? '—' : `${p}%`}</span>
                <span className="caption block text-muted">
                  {st?.answered ? `${st.correct} of ${st.answered} · ${plural(n, 'test')}` : 'Not practised yet'}
                </span>
                {st?.answered ? (
                  <span className="caption block text-muted">
                    {st.unique} different questions · {duration(st.time_ms)}
                  </span>
                ) : null}
                <Meter value={(p ?? 0) / 100} className="mt-2" />
              </button>
            )
          })}
        </div>
      </section>

      <div>
        <SubjectProgress key={subject} subject={subject} stats={stats} meta={meta} admin />
      </div>

      <section aria-labelledby="tests-h">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="tests-h" className="text-h2">
            Every test
          </h2>
          <p className="caption text-muted">{plural(tests.length, 'test')} started</p>
        </div>
        {tests.length === 0 ? (
          <p className="text-muted">No tests started yet.</p>
        ) : (
          <ul className="card divide-y divide-line overflow-hidden p-0">
            {tests.map((t) => (
              <TestRow key={t.id} t={t} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card px-4 py-3.5">
      <dt className="caption text-muted">{label}</dt>
      <dd className="mt-0.5 font-display text-stat font-semibold num">{value}</dd>
      {sub && <dd className="caption truncate text-muted">{sub}</dd>}
    </div>
  )
}

function TestRow({ t }: { t: Attempt }) {
  const done = t.submitted_at != null
  const p = done && t.score != null ? pct(t.score, t.total) : null
  const taken = done ? Math.min((t.submitted_at ?? 0) - t.started_at, t.duration_s || Infinity) : 0
  const status = done ? null : isLive(t) ? 'In progress' : 'Left unfinished'
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${subjectBgClass(t.subject)}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{t.title}</p>
        <p className="caption text-muted">
          {attemptMeta(t)} · {relDay(t.started_at, true)}
          {done && taken > 0 ? ` · took ${duration(taken * 1000)}` : ''}
        </p>
      </div>
      <div className="text-right">
        {done ? (
          <>
            <p className="font-semibold num">
              {t.score ?? 0}
              <span className="text-muted">/{t.total}</span>
            </p>
            <p className="caption text-muted num">{p != null ? `${p}%` : ''}</p>
          </>
        ) : (
          <>
            <p className="caption font-semibold">{status}</p>
            <p className="caption text-muted num">
              {t.answered ?? 0}/{t.total} answered
            </p>
          </>
        )}
      </div>
    </li>
  )
}

/** For a student who forgot their password and lost their recovery code: make a new code to pass on. */
function ResetPassword({ id, name }: { id: number; name: string }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [code, setCode] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const close = () => {
    setOpen(false)
    setCode(null)
    setError('')
  }
  const make = async () => {
    setBusy(true)
    setError('')
    try {
      setCode((await api.adminNewRecovery(id)).recovery_code)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(true)}>
        <KeyIcon size={16} aria-hidden /> Reset password
      </button>
      <Dialog
        open={open}
        onClose={close}
        title={code ? `New recovery code for ${name}` : `Reset ${name}’s password?`}
        labelledBy="reset-h"
        footer={
          code ? (
            <button type="button" className="btn btn-primary" onClick={close}>
              Done
            </button>
          ) : (
            <>
              <button type="button" className="btn btn-secondary" onClick={close}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={make} disabled={busy} data-autofocus>
                {busy && <Spinner />} Make a new code
              </button>
            </>
          )
        }
      >
        {code ? (
          <div className="space-y-3">
            <p className="text-label font-normal text-muted">
              Send this to {name} privately. On the login page they choose <b>Forgot password?</b>, enter their name and this code,
              and set a new password. The code works once. It’s shown only now.
            </p>
            <p className="rounded-[10px] border border-dashed border-line-strong bg-paper px-4 py-3 text-center font-mono text-[22px] font-semibold tracking-[0.12em] select-all">
              {code}
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() =>
                void navigator.clipboard?.writeText(code).then(() => {
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1600)
                })
              }
            >
              {copied ? <CheckIcon size={15} aria-hidden /> : <CopyIcon size={15} aria-hidden />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        ) : (
          <div className="space-y-2 text-label font-normal text-muted">
            <p>
              This makes a new one-time recovery code for {name}. Their old code stops working. Their password and progress don’t
              change, and they stay logged in until they use the code.
            </p>
            <p>Only do this when {name} has asked, and send the code to them directly.</p>
            {error && (
              <p role="alert" className="font-medium text-wrong">
                {error}
              </p>
            )}
          </div>
        )}
      </Dialog>
    </>
  )
}
