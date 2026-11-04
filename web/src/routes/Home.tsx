import { ArrowRightIcon, ClockIcon, PlayIcon, TrashIcon } from '@phosphor-icons/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Dialog } from '../components/Dialog'
import { AttemptRow } from '../components/AttemptRow'
import { EmptyState, ErrorState, Meter, Skeleton, SubjectChip, subjectBgClass } from '../components/ui'
import { api } from '../lib/api'
import {
  attemptMeta,
  greeting,
  isLive,
  longToday,
  pct,
  SUBJECTS,
  subjectName,
} from '../lib/format'
import { qk, useAttempts, useMe, useMeta, useStats } from '../lib/queries'
import type { Attempt, Meta, Stats, SubjectId } from '../lib/types'

export default function Home() {
  const me = useMe()
  const meta = useMeta()
  const stats = useStats()
  const attempts = useAttempts()

  const first = me.data?.name.split(' ')[0] ?? ''
  const name = first ? first.charAt(0).toUpperCase() + first.slice(1) : ''

  return (
    <div className="mx-auto max-w-[1040px]">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h1 className="text-h1">
          {greeting()}
          {name && `, ${name}`}
        </h1>
        <p className="text-label font-medium text-muted">{longToday()}</p>
      </div>

      {attempts.data && <ContinueStrip attempts={attempts.data} />}

      <section aria-label="Subjects" className="grid gap-4 md:grid-cols-3">
        {meta.isPending || stats.isPending ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-[148px] rounded-[14px]" />)
        ) : meta.error || stats.error ? (
          <ErrorState
            className="md:col-span-3"
            error={meta.error ?? stats.error}
            onRetry={() => {
              void meta.refetch()
              void stats.refetch()
            }}
          />
        ) : (
          SUBJECTS.map((s) => <SubjectCard key={s} subject={s} meta={meta.data} stats={stats.data} />)
        )}
      </section>

      {meta.data && <FullKcetRow meta={meta.data} />}

      <div className="mt-8 grid gap-x-8 gap-y-8 lg:grid-cols-12">
        <section aria-labelledby="recent-h" className="lg:col-span-7">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="recent-h" className="text-h2">
              Recent tests
            </h2>
            <Link to="/history" className="link text-label">
              All tests
            </Link>
          </div>
          <RecentList stats={stats.data} loading={stats.isPending} meta={meta.data} />
        </section>
        <section aria-labelledby="weak-h" className="lg:col-span-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="weak-h" className="text-h2">
              Weak chapters
            </h2>
            <Link to="/progress" className="link text-label">
              Progress
            </Link>
          </div>
          <WeakChapters stats={stats.data} loading={stats.isPending} />
        </section>
      </div>
    </div>
  )
}

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

function ContinueStrip({ attempts }: { attempts: Attempt[] }) {
  const now = useNow(15_000)
  const live = attempts.filter((a) => isLive(a, now / 1000))
  const a = live[0]
  const [confirm, setConfirm] = useState(false)
  const qc = useQueryClient()
  const navigate = useNavigate()
  const discard = useMutation({
    mutationFn: (id: string) => api.discard(id),
    onSuccess: () => {
      setConfirm(false)
      void qc.invalidateQueries({ queryKey: qk.attempts })
    },
  })
  if (!a) return null
  const left = a.duration_s ? a.started_at + a.duration_s - now / 1000 : null
  const leftLabel =
    left == null ? 'Untimed' : left >= 3600 ? `${Math.floor(left / 3600)} h ${Math.round((left % 3600) / 60)} min left` : `${Math.max(1, Math.round(left / 60))} min left`

  return (
    <section aria-label="Unfinished test" className="card mb-4 flex min-h-[72px] flex-wrap items-center gap-x-5 gap-y-3 px-5 py-3.5">
      <span aria-hidden className={`hidden h-9 w-1 rounded-full sm:block ${subjectBgClass(a.subject)}`} />
      <div className="min-w-0 flex-1">
        <p className="label text-muted">Continue where you left off</p>
        <p className="truncate font-semibold">
          {a.title} <span className="font-normal text-muted">· {attemptMeta(a)}</span>
        </p>
      </div>
      <p className="flex items-center gap-1.5 font-mono text-[14px] font-semibold num text-ink">
        <ClockIcon size={16} aria-hidden className="text-muted" />
        {leftLabel}
      </p>
      <div className="flex items-center gap-2">
        {live.length > 1 && (
          <Link to="/history" className="link mr-2 text-label">
            +{live.length - 1} more
          </Link>
        )}
        <button type="button" className="btn btn-ghost btn-sm text-muted" onClick={() => setConfirm(true)}>
          <TrashIcon size={16} aria-hidden /> Discard
        </button>
        <button type="button" className="btn btn-primary" onClick={() => navigate(`/test/${a.id}`)}>
          <PlayIcon size={16} weight="fill" aria-hidden /> Continue
        </button>
      </div>
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Discard this test?"
        labelledBy="discard-h"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setConfirm(false)}>
              Keep it
            </button>
            <button type="button" className="btn btn-primary" disabled={discard.isPending} onClick={() => discard.mutate(a.id)}>
              Discard test
            </button>
          </>
        }
      >
        <p className="text-muted">
          “{a.title}” and its answers will be deleted. It won’t count towards your progress.
        </p>
        {discard.error && <p className="mt-3 text-label text-wrong">{discard.error.message}</p>}
      </Dialog>
    </section>
  )
}

function SubjectCard({ subject, meta, stats }: { subject: SubjectId; meta: Meta; stats: Stats }) {
  const m = meta.subjects.find((s) => s.id === subject)
  const st = stats.subjects[subject]
  const bank = m?.count ?? 0
  const acc = st ? pct(st.correct, st.answered) : null
  const empty = bank === 0

  return (
    <article className="card relative flex min-h-[148px] flex-col overflow-hidden p-5">
      <span aria-hidden className={`absolute inset-x-0 top-0 h-[3px] ${subjectBgClass(subject)}`} />
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-h2">{subjectName[subject]}</h2>
        <p className="caption text-muted num">{empty ? '' : `${bank} in the bank`}</p>
      </div>
      {empty ? (
        <div className="mt-auto">
          <p className="font-display text-[22px] leading-7 text-muted">Questions coming soon</p>
          <p className="caption mt-1 text-muted">Being checked against the official keys first.</p>
        </div>
      ) : (
        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <p className="font-display text-stat font-semibold num">
              {acc == null ? <span className="text-muted">—</span> : `${acc}%`}
            </p>
            <p className="caption text-muted">
              {acc == null ? 'Not started yet' : `accuracy · ${st.unique} practised`}
            </p>
          </div>
          <Link to={`/practice/${subject}`} className="btn btn-secondary" aria-label={`Start ${subjectName[subject]}`}>
            Start <ArrowRightIcon size={16} aria-hidden />
          </Link>
        </div>
      )}
    </article>
  )
}

function FullKcetRow({ meta }: { meta: Meta }) {
  const per = SUBJECTS.map((s) => ({ s, n: Math.min(60, meta.subjects.find((x) => x.id === s)?.count ?? 0) }))
  const total = per.reduce((a, b) => a + b.n, 0)
  const missing = per.filter((p) => p.n < 60).map((p) => subjectName[p.s])
  if (total === 0) return null
  return (
    <section
      aria-label="Full KCET"
      className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[14px] border border-line px-5 py-3.5"
    >
      <div className="hidden items-center gap-1 sm:flex" aria-hidden>
        {SUBJECTS.map((s) => (
          <span key={s} className={`h-2 w-2 rounded-full ${subjectBgClass(s)}`} />
        ))}
      </div>
      <div className="min-w-0 flex-1 basis-[260px]">
        <p className="font-semibold">
          Full KCET <span className="font-normal text-muted">· 180 questions, 3 h 30 min, all three papers back to back</span>
        </p>
        {missing.length > 0 && (
          <p className="caption text-muted">
            For now it has {total} questions — {missing.join(' and ')} {missing.length > 1 ? 'aren’t' : 'isn’t'} complete in
            the bank yet.
          </p>
        )}
      </div>
      <Link to="/practice/all" className="btn btn-secondary btn-sm">
        Set up <ArrowRightIcon size={14} aria-hidden />
      </Link>
    </section>
  )
}

function RecentList({ stats, loading, meta }: { stats?: Stats; loading: boolean; meta?: Meta }) {
  if (loading) {
    return (
      <div className="card divide-y divide-line">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-14" />
          </div>
        ))}
      </div>
    )
  }
  const list = stats?.attempts.slice(0, 5) ?? []
  if (!list.length) {
    const firstSubject = meta?.subjects.find((s) => s.count > 0)?.id ?? 'physics'
    return (
      <EmptyState
        title="No finished tests yet"
        action={
          <Link to={`/practice/${firstSubject}?mode=quick&count=10&practice=1`} className="btn btn-primary">
            Warm up with 10 questions
          </Link>
        }
      >
        A short practice set is a good first step — you see right or wrong after each question.
      </EmptyState>
    )
  }
  return (
    <ul className="card divide-y divide-line overflow-hidden">
      {list.map((a) => (
        <AttemptRow key={a.id} a={a} />
      ))}
    </ul>
  )
}

function WeakChapters({ stats, loading }: { stats?: Stats; loading: boolean }) {
  const weak = useMemo(
    () =>
      (stats?.chapters ?? [])
        .filter((c) => c.answered >= 5)
        .map((c) => ({ ...c, acc: c.correct / c.answered }))
        .sort((a, b) => a.acc - b.acc || b.answered - a.answered)
        .slice(0, 5),
    [stats],
  )
  if (loading) {
    return (
      <div className="card space-y-4 p-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-8" />
        ))}
      </div>
    )
  }
  if (!weak.length) {
    return (
      <EmptyState title="Nothing to show yet">
        Once you’ve answered 5 or more questions in a chapter, the ones that need work appear here.
      </EmptyState>
    )
  }
  return (
    <ul className="card divide-y divide-line overflow-hidden">
      {weak.map((c) => (
        <li key={c.subject + c.chapter}>
          <Link
            to={`/practice/${c.subject}?mode=chapter&chapters=${encodeURIComponent(c.chapter)}&practice=1`}
            className="group block px-4 py-3 transition-colors duration-150 hover:bg-raised focus-visible:outline-offset-[-2px]"
            title={`Practise ${c.name}`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 truncate font-medium">{c.name}</p>
              <p className="shrink-0 text-label num">
                {Math.round(c.acc * 100)}%<span className="font-normal text-muted"> of {c.answered}</span>
              </p>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <SubjectChip subject={c.subject} short />
              <Meter value={c.acc} className="flex-1" />
              <ArrowRightIcon size={14} className="text-muted opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
