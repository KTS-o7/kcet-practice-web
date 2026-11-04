import { Link } from 'react-router'
import { attemptMeta, pct, relDay } from '../lib/format'
import type { Attempt } from '../lib/types'
import { subjectBgClass } from './ui'

export function AttemptRow({ a }: { a: Attempt }) {
  const p = a.score != null ? pct(a.score, a.total) : null
  return (
    <li>
      <Link
        to={`/results/${a.id}`}
        className="flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-raised focus-visible:outline-offset-[-2px]"
      >
        <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${subjectBgClass(a.subject)}`} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{a.title}</p>
          <p className="caption text-muted">
            {attemptMeta(a)} · {relDay(a.submitted_at ?? a.started_at, true)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold num">
            {a.score ?? 0}
            <span className="text-muted">/{a.total}</span>
          </p>
          <p className="caption text-muted num">{p != null ? `${p}%` : ''}</p>
        </div>
      </Link>
    </li>
  )
}

