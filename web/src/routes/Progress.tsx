import { ArrowRightIcon } from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { EmptyState, ErrorState, Meter, Segmented, Skeleton, Switch } from '../components/ui'
import { dateKey, duration, isSubject, pct, plural, relDay, shortDate, SUBJECTS, subjectName } from '../lib/format'
import { useMeta, useStats } from '../lib/queries'
import type { Attempt, Meta, Stats, SubjectId } from '../lib/types'

export default function Progress() {
  const [params, setParams] = useSearchParams()
  const s = params.get('s')
  const subject: SubjectId = isSubject(s ?? undefined) ? (s as SubjectId) : 'physics'
  const stats = useStats()
  const meta = useMeta()

  return (
    <div className="mx-auto max-w-[1040px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1">Progress</h1>
          <p className="mt-1 text-muted">How each subject is going, from every test you’ve finished.</p>
        </div>
        <Segmented
          label="Subject"
          value={subject}
          onChange={(v) => setParams({ s: v }, { replace: true })}
          options={SUBJECTS.map((x) => ({ value: x, label: subjectName[x] }))}
        />
      </div>
      {stats.isPending || meta.isPending ? (
        <ProgressSkeleton />
      ) : stats.error || meta.error ? (
        <ErrorState
          error={stats.error ?? meta.error}
          onRetry={() => {
            void stats.refetch()
            void meta.refetch()
          }}
        />
      ) : (
        <SubjectProgress key={subject} subject={subject} stats={stats.data} meta={meta.data} />
      )}
    </div>
  )
}

function ProgressSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[76px] rounded-[14px]" />
        ))}
      </div>
      <Skeleton className="h-[268px] rounded-[14px]" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-2">
        {Array.from({ length: 12 }, (_, i) => (
          <Skeleton key={i} className="h-16 rounded-[10px]" />
        ))}
      </div>
    </div>
  )
}

function SubjectProgress({ subject, stats, meta }: { subject: SubjectId; stats: Stats; meta: Meta }) {
  const st = stats.subjects[subject]
  const bank = meta.subjects.find((x) => x.id === subject)
  const tests = stats.attempts.filter((a) => a.subject === subject)
  const acc = st ? pct(st.correct, st.answered) : null

  if ((bank?.count ?? 0) === 0 && !st?.answered) {
    return (
      <EmptyState title={`${subjectName[subject]} questions are coming soon`}>
        They’re being checked against the official answer keys. Progress shows up here once you start practising.
      </EmptyState>
    )
  }

  return (
    <div className="space-y-8">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Accuracy" value={acc == null ? '—' : `${acc}%`} sub={st?.answered ? `${st.correct} of ${st.answered} answered` : 'No answers yet'} />
        <Tile label="Questions practised" value={String(st?.unique ?? 0)} sub={bank ? `of ${bank.count} in the bank` : undefined} />
        <Tile label="Tests finished" value={String(tests.length)} sub={tests[0] ? `latest ${relDay(tests[0].submitted_at ?? tests[0].started_at).replace(/^(Today|Yesterday)/, (m) => m.toLowerCase())}` : undefined} />
        <Tile label="Time spent" value={st?.time_ms ? duration(st.time_ms) : '—'} sub={st?.answered ? `${Math.round(st.time_ms / 1000 / Math.max(1, st.answered + st.skipped))} s per question` : undefined} />
      </dl>

      <section aria-labelledby="trend-h">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="trend-h" className="text-h2">
            Score trend
          </h2>
          <p className="caption text-muted">{tests.length > 1 ? `last ${Math.min(tests.length, 30)} tests` : ''}</p>
        </div>
        <TrendCard subject={subject} tests={tests} />
      </section>

      <ChapterSection subject={subject} stats={stats} meta={meta} />

      <section aria-labelledby="act-h">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="act-h" className="text-h2">
            Activity
          </h2>
          <p className="caption text-muted">All subjects · last 8 weeks</p>
        </div>
        <Activity days={stats.days} />
      </section>

      <div className="flex justify-end">
        <Link to="/history" className="link inline-flex items-center gap-1.5 text-label">
          Every test you’ve taken <ArrowRightIcon size={14} aria-hidden />
        </Link>
      </div>
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

/* ---------------- Trend chart (hand-rolled SVG) ---------------- */

const strokeVar: Record<SubjectId, string> = {
  physics: 'var(--color-physics)',
  chemistry: 'var(--color-chemistry)',
  mathematics: 'var(--color-mathematics)',
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)))
    ro.observe(el)
    setW(el.clientWidth)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

function TrendCard({ subject, tests }: { subject: SubjectId; tests: Attempt[] }) {
  const pts = useMemo(
    () =>
      tests
        .slice(0, 30)
        .reverse()
        .map((a) => ({ a, v: a.total ? ((a.score ?? 0) / a.total) * 100 : 0 })),
    [tests],
  )
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)

  if (pts.length < 2) {
    return (
      <EmptyState
        title={pts.length ? `One test so far: ${Math.round(pts[0].v)}%` : 'No finished tests yet'}
        action={
          <Link to={`/practice/${subject}`} className="btn btn-secondary">
            Start a {subjectName[subject]} test
          </Link>
        }
      >
        Finish {pts.length ? 'one more test' : 'two tests'} in {subjectName[subject]} and your score trend appears here.
      </EmptyState>
    )
  }

  const H = 220
  const padL = 34
  const padR = 52
  const padT = 14
  const padB = 26
  const W = Math.max(width, 280)
  const iw = W - padL - padR
  const ih = H - padT - padB
  const x = (i: number) => padL + (pts.length === 1 ? iw / 2 : (i / (pts.length - 1)) * iw)
  const y = (v: number) => padT + ih - (v / 100) * ih
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join('')
  const last = pts[pts.length - 1]
  const h = hover != null ? pts[hover] : null
  const avg = pts.reduce((s, p) => s + p.v, 0) / pts.length

  return (
    <div className="card p-4 pt-3" ref={ref}>
      <div className="relative" style={{ height: H }}>
        {width > 0 && (
          <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            className="block w-full overflow-visible"
            role="img"
            aria-label={`${subjectName[subject]} scores over the last ${pts.length} tests, latest ${Math.round(last.v)}%, average ${Math.round(avg)}%`}
            onMouseLeave={() => setHover(null)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const px = ((e.clientX - rect.left) / rect.width) * W
              const i = Math.round(((px - padL) / iw) * (pts.length - 1))
              setHover(Math.max(0, Math.min(pts.length - 1, i)))
            }}
          >
            {[25, 50, 75].map((g) => (
              <g key={g}>
                <line x1={padL} x2={padL + iw} y1={y(g)} y2={y(g)} stroke="var(--color-line-strong)" strokeDasharray="3 4" strokeWidth={1} opacity={0.7} />
                <text x={padL - 8} y={y(g) + 4} textAnchor="end" fontSize={11} fill="var(--color-muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {g}
                </text>
              </g>
            ))}
            <line x1={padL} x2={padL + iw} y1={y(0)} y2={y(0)} stroke="var(--color-line)" strokeWidth={1} />
            <path d={d} fill="none" stroke={strokeVar[subject]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={x(pts.length - 1)} cy={y(last.v)} r={3.5} fill={strokeVar[subject]} />
            <text
              x={x(pts.length - 1) + 8}
              y={y(last.v) + 4}
              fontSize={11}
              fontWeight={600}
              fill={strokeVar[subject]}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {Math.round(last.v)}%
            </text>
            <text x={padL} y={H - 6} fontSize={11} fill="var(--color-muted)">
              {shortDate(new Date((pts[0].a.submitted_at ?? 0) * 1000))}
            </text>
            <text x={padL + iw} y={H - 6} fontSize={11} fill="var(--color-muted)" textAnchor="end">
              {shortDate(new Date((last.a.submitted_at ?? 0) * 1000))}
            </text>
            {h && hover != null && (
              <g pointerEvents="none">
                <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + ih} stroke="var(--color-line-strong)" strokeWidth={1} />
                <circle cx={x(hover)} cy={y(h.v)} r={4.5} fill="var(--color-surface)" stroke={strokeVar[subject]} strokeWidth={2} />
              </g>
            )}
          </svg>
        )}
        {h && hover != null && (
          <div
            className="pointer-events-none absolute top-0 z-10 w-max max-w-[220px] -translate-x-1/2 rounded-[8px] border border-line bg-raised px-2.5 py-1.5 shadow-[0_8px_24px_-12px_rgb(31_27_22/0.35)]"
            style={{ left: `${(x(hover) / W) * 100}%` }}
          >
            <p className="text-label num">
              {h.a.score}/{h.a.total} <span className="font-normal text-muted">· {Math.round(h.v)}%</span>
            </p>
            <p className="caption truncate text-muted">
              {h.a.title} · {relDay(h.a.submitted_at ?? h.a.started_at)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------------- Chapters: heatmap tiles or weakest-first list ---------------- */

function ChapterSection({ subject, stats, meta }: { subject: SubjectId; stats: Stats; meta: Meta }) {
  const [list, setList] = useState(false)
  const chapters = useMemo(() => {
    const st = new Map(stats.chapters.filter((c) => c.subject === subject).map((c) => [c.chapter, c]))
    const fromMeta = (meta.subjects.find((s) => s.id === subject)?.chapters ?? []).map((c) => {
      const s = st.get(c.id)
      st.delete(c.id)
      return { id: c.id, name: c.name, answered: s?.answered ?? 0, correct: s?.correct ?? 0, cls: c.class }
    })
    // chapters with history but no longer in the bank
    const extra = [...st.values()].map((s) => ({ id: s.chapter, name: s.name, answered: s.answered, correct: s.correct, cls: 0 }))
    return [...fromMeta, ...extra]
  }, [stats, meta, subject])

  const touched = chapters.filter((c) => c.answered > 0)
  const sorted = [...touched].sort((a, b) => a.correct / a.answered - b.correct / b.answered || b.answered - a.answered)
  const untouched = chapters.filter((c) => c.answered === 0)

  return (
    <section aria-labelledby="chap-h">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 id="chap-h" className="text-h2">
          Chapters
        </h2>
        <div className="w-[200px]">
          <Switch checked={list} onChange={setList} label={<span className="text-label">Sort by weakest</span>} />
        </div>
      </div>
      {!touched.length && (
        <p className="mb-3 text-label font-normal text-muted">
          No chapter has answers yet. Tiles fill in with your accuracy as you practise — tap one to practise just that chapter.
        </p>
      )}
      {list ? (
        <div className="card divide-y divide-line overflow-hidden">
          {sorted.map((c) => {
            const a = c.correct / c.answered
            return (
              <Link
                key={c.id}
                to={`/practice/${subject}?mode=chapter&practice=1&chapters=${encodeURIComponent(c.id)}`}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 px-4 py-3 transition-colors hover:bg-raised sm:grid-cols-[minmax(0,1fr)_200px_96px] focus-visible:outline-offset-[-2px]"
              >
                <span className="truncate font-medium">{c.name}</span>
                <Meter value={a} className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-1 sm:col-start-2" />
                <span className="text-right text-label num">
                  {Math.round(a * 100)}%<span className="font-normal text-muted"> of {c.answered}</span>
                </span>
              </Link>
            )
          })}
          {untouched.length > 0 && (
            <p className="px-4 py-3 text-label font-normal text-muted">
              Not practised yet: {untouched.map((c) => c.name).join(', ')}.
            </p>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(136px,1fr))] gap-2">
          {chapters.map((c) => {
            const has = c.answered > 0
            const t = has ? c.correct / c.answered : 0
            const dark = has && t >= 0.6
            return (
              <li key={c.id}>
                <Link
                  to={`/practice/${subject}?mode=chapter&practice=1&chapters=${encodeURIComponent(c.id)}`}
                  title={`${c.name}: ${has ? `${Math.round(t * 100)}% of ${c.answered}` : 'not practised yet'}`}
                  aria-label={`${c.name}, ${has ? `${Math.round(t * 100)} percent of ${c.answered} answered` : 'not practised yet'}. Practise this chapter`}
                  className={`flex h-16 flex-col justify-between rounded-[10px] px-2.5 py-2 transition-transform duration-150 ease-k hover:-translate-y-px ${
                    has ? '' : 'border border-dashed border-line-strong text-muted'
                  }`}
                  style={
                    has
                      ? {
                          background: `color-mix(in oklab, var(--color-heat-hi) ${Math.round(t * 100)}%, var(--color-heat-lo))`,
                          color: dark ? 'var(--color-on-accent)' : 'var(--color-ink)',
                        }
                      : undefined
                  }
                >
                  <span className="line-clamp-2 text-[12px] leading-[15px] font-medium">{c.name}</span>
                  <span className="flex items-baseline justify-between text-[11px] leading-[14px] num">
                    <span className="text-[13px] font-semibold">{has ? `${Math.round(t * 100)}%` : '—'}</span>
                    <span className="opacity-75">{has ? `${c.answered} Q` : ''}</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

/* ---------------- Activity: 8-week calendar strip ---------------- */

function Activity({ days }: { days: Record<string, number> }) {
  const weeks = 8
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dow = (today.getDay() + 6) % 7 // Monday = 0
  const start = new Date(today)
  start.setDate(start.getDate() - dow - (weeks - 1) * 7)
  const cols: { d: Date; n: number; future: boolean }[][] = []
  let total = 0
  let active = 0
  for (let w = 0; w < weeks; w++) {
    const col = []
    for (let k = 0; k < 7; k++) {
      const d = new Date(start)
      d.setDate(start.getDate() + w * 7 + k)
      const n = days[dateKey(d)] ?? 0
      const future = d > today
      if (!future) {
        total += n
        if (n) active++
      }
      col.push({ d, n, future })
    }
    cols.push(col)
  }
  const level = (n: number) => (n === 0 ? 0 : n < 10 ? 1 : n < 30 ? 2 : n < 60 ? 3 : 4)
  const fill = ['', '28%', '52%', '76%', '100%']
  const todayN = days[dateKey(today)] ?? 0

  return (
    <div className="card flex flex-wrap items-center gap-x-8 gap-y-4 p-5">
      <div className="flex gap-[3px]" role="img" aria-label={`${total} questions answered on ${active} days in the last 8 weeks`}>
        <div className="caption mr-1 grid grid-rows-7 gap-[3px] text-[10px] leading-[14px] text-muted" aria-hidden>
          {['M', '', 'W', '', 'F', '', 'S'].map((l, i) => (
            <span key={i} className="h-3.5">
              {l}
            </span>
          ))}
        </div>
        {cols.map((col, w) => (
          <div key={w} className="grid grid-rows-7 gap-[3px]">
            {col.map(({ d, n, future }) => {
              const l = level(n)
              return (
                <span
                  key={d.toISOString()}
                  title={future ? undefined : `${shortDate(d)}: ${plural(n, 'question')}`}
                  className={`h-3.5 w-3.5 rounded-[3px] ${future ? 'opacity-0' : l === 0 ? 'border border-line bg-paper' : ''}`}
                  style={l ? { background: `color-mix(in oklab, var(--color-accent) ${fill[l]}, var(--color-surface))` } : undefined}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="min-w-[180px] flex-1">
        <p className="font-display text-stat font-semibold num">{total}</p>
        <p className="caption text-muted">
          questions answered on {plural(active, 'day')}
          {todayN ? ` · ${todayN} today` : ''}
        </p>
        {total === 0 && (
          <p className="mt-2 text-label font-normal text-muted">Finish a test and today’s square fills in. A little every day adds up.</p>
        )}
      </div>
    </div>
  )
}
