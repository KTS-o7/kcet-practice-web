import { PlayIcon } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { AttemptRow } from '../components/AttemptRow'
import { EmptyState, ErrorState, Segmented, Skeleton, subjectBgClass } from '../components/ui'
import { attemptMeta, isLive, relDay, SUBJECTS, subjectName, subjectShort } from '../lib/format'
import { useAttempts } from '../lib/queries'
import type { Attempt, AttemptSubject } from '../lib/types'

type F = 'any' | AttemptSubject

export default function History() {
  const q = useAttempts()
  const [f, setF] = useState<F>('any')

  const groups = useMemo(() => {
    const list = (q.data ?? []).filter((a) => f === 'any' || a.subject === f)
    const out: { day: string; items: Attempt[] }[] = []
    for (const a of list) {
      const day = relDay(a.started_at)
      const g = out[out.length - 1]
      if (g && g.day === day) g.items.push(a)
      else out.push({ day, items: [a] })
    }
    return out
  }, [q.data, f])

  return (
    <div className="mx-auto max-w-[760px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1">History</h1>
          <p className="mt-1 text-muted">Every test, newest first.</p>
        </div>
        <Segmented
          label="Filter by subject"
          size="sm"
          value={f}
          onChange={setF}
          options={[
            { value: 'any', label: 'All' },
            ...SUBJECTS.map((s) => ({
              value: s as F,
              label: (
                <>
                  <span className="sm:hidden">{subjectShort[s]}</span>
                  <span className="max-sm:hidden">{subjectName[s]}</span>
                </>
              ),
            })),
            { value: 'all', label: 'Full KCET' },
          ]}
        />
      </div>
      {q.isPending ? (
        <div className="space-y-6">
          {[0, 1].map((i) => (
            <div key={i}>
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="h-[136px] rounded-[14px]" />
            </div>
          ))}
        </div>
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !groups.length ? (
        <EmptyState
          title={f === 'any' ? 'No tests yet' : `No ${subjectName[f as AttemptSubject]} tests yet`}
          action={
            <Link to="/" className="btn btn-primary">
              Pick a subject
            </Link>
          }
        >
          Every test you start shows up here, with its score and a full review.
        </EmptyState>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.day} aria-label={g.day}>
              <h2 className="label mb-2 font-sans text-muted">{g.day}</h2>
              <ul className="card divide-y divide-line overflow-hidden">
                {g.items.map((a) => (a.submitted_at == null ? <LiveRow key={a.id} a={a} /> : <AttemptRow key={a.id} a={a} />))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function LiveRow({ a }: { a: Attempt }) {
  const live = isLive(a)
  const left = a.duration_s ? Math.max(0, Math.round((a.started_at + a.duration_s - Date.now() / 1000) / 60)) : null
  return (
    <li>
      <Link
        to={`/test/${a.id}`}
        className="flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-raised focus-visible:outline-offset-[-2px]"
      >
        <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${subjectBgClass(a.subject)}`} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{a.title}</p>
          <p className="caption text-muted">
            {attemptMeta(a)} · {live ? (left == null ? 'untimed, in progress' : `${left} min left`) : 'time’s up — open to see results'}
          </p>
        </div>
        <span className="btn btn-secondary btn-sm pointer-events-none">
          <PlayIcon size={14} weight="fill" aria-hidden /> Resume
        </span>
      </Link>
    </li>
  )
}
