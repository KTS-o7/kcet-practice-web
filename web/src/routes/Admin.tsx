import { ArrowClockwiseIcon, CheckIcon, CopyIcon, WarningIcon } from '@phosphor-icons/react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { MdBlock, MdInline } from '../components/Md'
import { EmptyState, ErrorState, Meter, Segmented, Skeleton, SubjectChip } from '../components/ui'
import { ApiError } from '../lib/api'
import { LETTERS, modeName, pct, plural, relDay, subjectName } from '../lib/format'
import { useAdminOverview } from '../lib/queries'
import type { AdminCount, AdminDay, AdminOverview, AdminStudent, AdminSuspect, AttemptSubject, Mode } from '../lib/types'

/** Owner dashboard. The API answers 404 for anyone not listed in KCET_ADMINS. */
export default function Admin() {
  const q = useAdminOverview()

  if (q.error instanceof ApiError && q.error.status === 404) {
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

  return (
    <div className="mx-auto max-w-[1040px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1">Admin</h1>
          <p className="mt-1 text-muted">
            Everyone on Kaagada{q.data ? ` · ${plural(q.data.students_total, 'student')}` : ''} · days in IST
          </p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => q.refetch()} disabled={q.isFetching}>
          <ArrowClockwiseIcon size={16} aria-hidden className={q.isFetching ? 'animate-spin' : ''} />
          {q.data ? `Updated ${relDay(q.data.generated_at, true).replace(/^Today, /, '')}` : 'Refresh'}
        </button>
      </div>
      {q.isPending ? (
        <AdminSkeleton />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <Overview d={q.data} />
      )}
    </div>
  )
}

function AdminSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[92px] rounded-[14px]" />
        ))}
      </div>
      <Skeleton className="h-[240px] rounded-[14px]" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-[220px] rounded-[14px]" />
        <Skeleton className="h-[220px] rounded-[14px]" />
      </div>
    </div>
  )
}

function Section({ id, title, aside, children }: { id: string; title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id={id} className="text-h2">
          {title}
        </h2>
        {aside && <div className="caption text-muted">{aside}</div>}
      </div>
      {children}
    </section>
  )
}

function Overview({ d }: { d: AdminOverview }) {
  return (
    <div className="space-y-10">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Sign-ups" today={d.today.signups} week={d.week.signups} />
        <Tile label="Active students" today={d.today.active} week={d.week.active} />
        <Tile label="Tests finished" today={d.today.tests} week={d.week.tests} />
        <Tile label="Questions answered" today={d.today.answered} week={d.week.answered} />
      </dl>

      <DailyChart days={d.days} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-x-6 gap-y-10 md:grid-cols-2">
        <Retention d={d} />
        <UsageMix d={d} />
      </div>

      <Suspects d={d} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-x-6 gap-y-10 md:grid-cols-2">
        <Hardest d={d} />
        <Reports d={d} />
      </div>

      <Students students={d.students} />
    </div>
  )
}

function Tile({ label, today, week }: { label: string; today: number; week: number }) {
  return (
    <div className="card px-4 py-3.5">
      <dt className="caption text-muted">{label}</dt>
      <dd className="mt-0.5 font-display text-stat font-semibold num">{today.toLocaleString('en-IN')}</dd>
      <dd className="caption text-muted">
        today · <span className="num">{week.toLocaleString('en-IN')}</span> in 7 days
      </dd>
    </div>
  )
}

/* ---------------- Daily activity: one series, 30 bars ---------------- */

type Metric = 'active' | 'tests' | 'answered' | 'signups'
const metricShort: Record<Metric, string> = { active: 'Students', tests: 'Tests', answered: 'Questions', signups: 'Sign-ups' }
const metricLabel: Record<Metric, string> = {
  active: 'Active students',
  tests: 'Tests finished',
  answered: 'Questions answered',
  signups: 'Sign-ups',
}

const dayFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' })
const fmtDay = (key: string) => dayFmt.format(new Date(`${key}T00:00:00+05:30`))

function DailyChart({ days }: { days: AdminDay[] }) {
  const [metric, setMetric] = useState<Metric>('active')
  const [hover, setHover] = useState<number | null>(null)
  const vals = days.map((x) => x[metric])
  const max = Math.max(1, ...vals)
  const total = vals.reduce((a, b) => a + b, 0)
  const h = hover != null ? days[hover] : null
  const H = 160

  return (
    <Section
      id="daily-h"
      title="Last 30 days"
      aside={
        <Segmented
          size="sm"
          label="Measure"
          value={metric}
          onChange={setMetric}
          options={(Object.keys(metricLabel) as Metric[]).map((m) => ({ value: m, label: metricShort[m] }))}
        />
      }
    >
      <div className="card p-4 sm:p-5">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <p className="text-label font-normal text-muted">
            {h ? (
              <>
                <span className="font-semibold text-ink">{fmtDay(h.day)}</span> · {metricLabel[metric]}{' '}
                <span className="font-semibold text-ink num">{h[metric]}</span>
              </>
            ) : (
              <>
                {metricLabel[metric]}: <span className="font-semibold text-ink num">{total.toLocaleString('en-IN')}</span>{' '}
                {metric === 'active' ? 'student-days' : 'in 30 days'}
              </>
            )}
          </p>
          <p className="caption text-muted num">peak {max === 1 && total === 0 ? 0 : max}</p>
        </div>
        <div
          role="img"
          aria-label={`${metricLabel[metric]} per day for the last 30 days, total ${total}, peak ${Math.max(...vals)}`}
          className="relative flex items-end gap-[2px] border-b border-line"
          style={{ height: H }}
          onMouseLeave={() => setHover(null)}
        >
          {/* recessive mid gridline */}
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-line" />
          {days.map((x, i) => {
            const v = x[metric]
            const isToday = i === days.length - 1
            return (
              <button
                key={x.day}
                type="button"
                tabIndex={-1}
                aria-hidden
                className="relative flex h-full flex-1 items-end"
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
              >
                <span
                  className="block w-full rounded-t-[4px] transition-[height,background-color] duration-200 ease-k"
                  style={{
                    height: v ? `${Math.max(3, (v / max) * (H - 8))}px` : '0px',
                    background:
                      hover === i || (hover == null && isToday)
                        ? 'var(--color-accent)'
                        : 'color-mix(in oklab, var(--color-accent) 55%, var(--color-surface))',
                  }}
                />
              </button>
            )
          })}
        </div>
        <div aria-hidden className="caption mt-1.5 flex justify-between text-muted">
          <span>{fmtDay(days[0].day)}</span>
          <span>{fmtDay(days[15].day)}</span>
          <span>Today</span>
        </div>
        <table className="sr-only">
          <caption>{metricLabel[metric]} per day</caption>
          <thead>
            <tr>
              <th>Day</th>
              <th>{metricLabel[metric]}</th>
            </tr>
          </thead>
          <tbody>
            {days.map((x) => (
              <tr key={x.day}>
                <td>{fmtDay(x.day)}</td>
                <td>{x[metric]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}

/* ---------------- Retention: sign-up week x weeks after ---------------- */

function Retention({ d }: { d: AdminOverview }) {
  return (
    <Section id="ret-h" title="Coming back" aside="% of each sign-up week active later">
      {d.retention.length === 0 ? (
        <EmptyState title="No sign-ups yet" />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-label">
            <thead>
              <tr className="caption text-left text-muted">
                <th className="px-4 py-2.5 font-medium">Joined week of</th>
                <th className="px-2 py-2.5 text-right font-medium">Students</th>
                {[1, 2, 3, 4].map((w) => (
                  <th key={w} className="w-14 px-1 py-2.5 text-center font-medium">
                    Wk {w}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.retention.map((c) => (
                <tr key={c.week} className="border-t border-line">
                  <td className="px-4 py-2 font-semibold">{fmtDay(c.week)}</td>
                  <td className="px-2 py-2 text-right num">{c.size}</td>
                  {c.weeks.map((v, i) => (
                    <td key={i} className="px-1 py-1.5">
                      {v == null ? (
                        <span className="block text-center text-muted" title="This week isn’t over yet">
                          ·
                        </span>
                      ) : (
                        <span
                          className="block rounded-[6px] py-1 text-center font-semibold num"
                          style={{
                            background: `color-mix(in oklab, var(--color-accent) ${Math.round(8 + v * 0.62)}%, var(--color-surface))`,
                            color: v >= 55 ? 'var(--color-on-accent)' : 'var(--color-ink)',
                          }}
                        >
                          {v}%
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="caption border-t border-line px-4 py-2.5 text-muted">
            Week 1 is days 7–13 after joining. “·” means that week hasn’t finished yet.
          </p>
        </div>
      )}
    </Section>
  )
}

/* ---------------- What people use ---------------- */

function MixList({ title, rows, label }: { title: string; rows: AdminCount[]; label: (k: string) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.started))
  return (
    <div>
      <p className="caption mb-2 text-muted">{title}</p>
      {rows.length === 0 ? (
        <p className="text-label font-normal text-muted">Nothing yet.</p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((r) => (
            <li key={r.key}>
              <div className="flex items-baseline justify-between gap-3 text-label">
                <span className="font-semibold">{label(r.key)}</span>
                <span className="text-muted num">
                  {r.started} started · {r.finished} finished
                </span>
              </div>
              <Meter value={r.started / max} className="mt-1" />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function UsageMix({ d }: { d: AdminOverview }) {
  return (
    <Section id="mix-h" title="What they use">
      <div className="card space-y-5 p-5">
        <MixList title="Mode" rows={d.modes} label={(k) => modeName[k as Mode] ?? k} />
        <MixList title="Subject" rows={d.subjects} label={(k) => subjectName[k as AttemptSubject] ?? k} />
        <MixList title="Kind" rows={d.kinds} label={(k) => (k === 'practice' ? 'Practice (instant answers)' : 'Timed test')} />
      </div>
    </Section>
  )
}

/* ---------------- Answer keys that students disagree with ---------------- */

function Suspects({ d }: { d: AdminOverview }) {
  const t = d.thresholds
  return (
    <Section
      id="sus-h"
      title="Answer keys to double-check"
      aside={`${t.suspect_min_students}+ students, under ${Math.round(t.suspect_max_correct * 100)}% match our key, one other option ≥ ${Math.round(t.suspect_min_top * 100)}%`}
    >
      {d.suspects.length === 0 ? (
        <EmptyState title="Nothing suspicious yet">
          A question lands here when most students agree on an option that isn’t our key. That usually means the key is
          wrong.
        </EmptyState>
      ) : (
        <ul className="space-y-4">
          {d.suspects.map((s) => (
            <SuspectCard key={s.id} s={s} />
          ))}
        </ul>
      )}
    </Section>
  )
}

function CopyId({ id }: { id: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm h-7 gap-1.5 px-2 font-mono text-[12px] font-normal text-muted"
      onClick={() => {
        void navigator.clipboard?.writeText(id).then(() => {
          setDone(true)
          setTimeout(() => setDone(false), 1400)
        })
      }}
      aria-label={`Copy question id ${id}`}
    >
      {done ? <CheckIcon size={13} aria-hidden /> : <CopyIcon size={13} aria-hidden />}
      {id}
    </button>
  )
}

function SuspectCard({ s }: { s: AdminSuspect }) {
  return (
    <li className="card p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SubjectChip subject={s.subject} />
        <span className="chip">{s.chapter_name}</span>
        {s.source && <span className="chip">{s.source}</span>}
        <span className="chip">{s.live ? 'Live' : 'Hidden'}</span>
        <span className="ml-auto">
          <CopyId id={s.id} />
        </span>
      </div>
      <MdBlock text={s.stem} className="text-body" />
      <ul className="mt-4 space-y-2">
        {s.options.map((o, i) => {
          const n = s.picks[i] ?? 0
          const share = s.students ? n / s.students : 0
          const key = s.accepted.includes(i)
          const top = i === s.top
          return (
            <li key={i} className="grid grid-cols-[22px_minmax(0,1fr)_minmax(90px,30%)] items-center gap-3 text-label">
              <span className="font-mono text-muted">{LETTERS[i]}</span>
              <span className="min-w-0">
                <MdInline text={o} className="font-normal" />
                {key && (
                  <span className="ml-2 inline-flex items-center gap-1 font-semibold text-correct">
                    <CheckIcon size={12} weight="bold" aria-hidden /> our key
                  </span>
                )}
                {top && (
                  <span className="ml-2 inline-flex items-center gap-1 font-semibold text-wrong">
                    <WarningIcon size={12} weight="bold" aria-hidden /> most picked
                  </span>
                )}
              </span>
              <span className="flex items-center gap-2">
                <span aria-hidden className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                  <span
                    className={`block h-full rounded-full ${key ? 'bg-correct' : top ? 'bg-wrong' : 'bg-muted'}`}
                    style={{ width: `${share * 100}%` }}
                  />
                </span>
                <span className="w-16 text-right text-muted num">
                  {n} · {Math.round(share * 100)}%
                </span>
              </span>
            </li>
          )
        })}
      </ul>
    </li>
  )
}

/* ---------------- Hardest chapters & student reports ---------------- */

function Hardest({ d }: { d: AdminOverview }) {
  return (
    <Section id="hard-h" title="Hardest chapters" aside={`${d.thresholds.hard_min_answers}+ answers`}>
      {d.hardest.length === 0 ? (
        <EmptyState title="Not enough answers yet">Chapters show up once students have answered enough of them.</EmptyState>
      ) : (
        <ul className="card divide-y divide-line p-0">
          {d.hardest.map((c) => {
            const p = pct(c.correct, c.answered) ?? 0
            return (
              <li key={c.subject + c.chapter} className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-3 text-label">
                  <span className="min-w-0 truncate font-semibold">
                    {c.name} <span className="font-normal text-muted">· {subjectName[c.subject]}</span>
                  </span>
                  <span className="shrink-0 text-muted num">
                    <span className="font-semibold text-ink">{p}%</span> of {c.answered.toLocaleString('en-IN')}
                  </span>
                </div>
                <Meter value={p / 100} className="mt-1.5" />
              </li>
            )
          })}
        </ul>
      )}
    </Section>
  )
}

function Reports({ d }: { d: AdminOverview }) {
  return (
    <Section id="rep-h" title="Flagged by students" aside={d.reports.length ? `latest ${d.reports.length}` : undefined}>
      {d.reports.length === 0 ? (
        <EmptyState title="No reports">When a student flags a question during a test, it shows up here.</EmptyState>
      ) : (
        <ul className="card max-h-[420px] divide-y divide-line overflow-y-auto p-0">
          {d.reports.map((r) => (
            <li key={r.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <CopyId id={r.qid} />
                {r.chapter_name && <span className="caption text-muted">{r.chapter_name}</span>}
                <span className="caption ml-auto text-muted">
                  {r.user} · {relDay(r.created_at, true)}
                </span>
              </div>
              <p className="mt-1 text-label font-normal break-words whitespace-pre-wrap">{r.note || '(no note)'}</p>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

/* ---------------- Students ---------------- */

type SortKey = 'name' | 'joined' | 'last_active' | 'tests' | 'answered' | 'avg'
const avgOf = (s: AdminStudent) => (s.total ? s.score / s.total : -1)

function Students({ students }: { students: AdminStudent[] }) {
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'last_active', desc: true })
  const rows = useMemo(() => {
    const val = (s: AdminStudent): number | string =>
      sort.key === 'name' ? s.name.toLowerCase() : sort.key === 'avg' ? avgOf(s) : s[sort.key]
    return [...students].sort((a, b) => {
      const x = val(a)
      const y = val(b)
      const c = x < y ? -1 : x > y ? 1 : 0
      return sort.desc ? -c : c
    })
  }, [students, sort])

  const head = (key: SortKey, label: string, right = false) => {
    const on = sort.key === key
    return (
      <th className={`px-3 py-2.5 font-medium ${right ? 'text-right' : 'text-left'}`} aria-sort={on ? (sort.desc ? 'descending' : 'ascending') : 'none'}>
        <button
          type="button"
          className={`inline-flex items-center gap-1 hover:text-ink ${on ? 'text-ink' : ''}`}
          onClick={() => setSort((s) => ({ key, desc: s.key === key ? !s.desc : key !== 'name' }))}
        >
          {label}
          {on && <span aria-hidden>{sort.desc ? '↓' : '↑'}</span>}
        </button>
      </th>
    )
  }

  return (
    <Section id="stu-h" title="Students" aside={`${plural(students.length, 'account')} · open a name for their progress`}>
      {students.length === 0 ? (
        <EmptyState title="No accounts yet" />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-label">
            <thead>
              <tr className="caption text-muted">
                {head('name', 'Name')}
                {head('joined', 'Joined')}
                {head('last_active', 'Last active')}
                {head('tests', 'Tests', true)}
                {head('answered', 'Questions', true)}
                {head('avg', 'Avg score', true)}
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const avg = s.total ? Math.round((s.score / s.total) * 100) : null
                return (
                  <tr key={s.id} className="border-t border-line">
                    <td className="max-w-[18ch] truncate px-3 py-2.5 font-semibold">
                      <Link to={`/admin/students/${s.id}`} className="link">
                        {s.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-muted">{relDay(s.joined)}</td>
                    <td className="px-3 py-2.5">{relDay(s.last_active, true)}</td>
                    <td className="px-3 py-2.5 text-right num">{s.tests}</td>
                    <td className="px-3 py-2.5 text-right num">{s.answered.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2.5 text-right num">
                      {avg == null ? <span className="text-muted">—</span> : `${avg}%`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  )
}
