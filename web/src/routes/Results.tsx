import {
  ArrowClockwiseIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CaretDownIcon,
  CheckIcon,
  ClockIcon,
  FlagIcon,
  MinusIcon,
  XIcon,
} from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { MdBlock, MdInline } from '../components/Md'
import { QuestionImages } from '../components/QuestionImages'
import { ReportDialog } from '../components/ReportDialog'
import { OptionCard, type OptionState } from '../components/test/OptionCard'
import { EmptyState, ErrorState, Skeleton, SubjectChip } from '../components/ui'
import { api, ApiError } from '../lib/api'
import { attemptMeta, duration, LETTERS, pct, qtime, relDay, retakeHref, SUBJECTS, subjectName } from '../lib/format'
import { qk } from '../lib/queries'
import type { AttemptDetail, Question, ResponseRow, ReviewItem, SubjectId } from '../lib/types'

type Status = 'correct' | 'wrong' | 'skipped'
interface Row {
  i: number
  q: Question
  r?: ResponseRow
  rv?: ReviewItem
  status: Status
  time: number
}
type Filter = 'all' | 'wrong' | 'skipped' | 'marked' | 'slow'

export default function Results() {
  const { id = '' } = useParams()
  const q = useQuery({ queryKey: qk.attempt(id), queryFn: () => api.attempt(id), staleTime: 60_000 })
  if (q.isPending) return <ResultsSkeleton />
  if (q.error) {
    if (q.error instanceof ApiError && q.error.status === 404)
      return (
        <EmptyState title="This test doesn’t exist" action={<Link to="/history" className="btn btn-secondary">All tests</Link>}>
          It may have been discarded.
        </EmptyState>
      )
    return <ErrorState error={q.error} onRetry={() => q.refetch()} />
  }
  if (q.data.attempt.submitted_at == null) return <Navigate to={`/test/${id}`} replace />
  return <ResultsView d={q.data} />
}

function ResultsSkeleton() {
  return (
    <div className="mx-auto max-w-[1040px]">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="mt-4 h-8 w-72" />
      <Skeleton className="mt-6 h-[132px] rounded-[14px]" />
      <Skeleton className="mt-8 h-6 w-48" />
      <Skeleton className="mt-3 h-48 rounded-[14px]" />
    </div>
  )
}

function useCountUp(target: number, ms = 600) {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [v, setV] = useState(reduce ? target : 0)
  useEffect(() => {
    if (reduce) {
      setV(target)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms)
      const e = 1 - Math.pow(1 - p, 3)
      setV(Math.round(target * e))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms, reduce])
  return v
}

function ResultsView({ d }: { d: AttemptDetail }) {
  const a = d.attempt
  const rows: Row[] = useMemo(() => {
    const rmap = new Map(d.responses.map((r) => [r.qid, r]))
    return d.questions.map((q, i) => {
      const r = rmap.get(q.id)
      const rv = d.review[q.id]
      const status: Status = r?.choice == null ? 'skipped' : rv?.correct ? 'correct' : 'wrong'
      return { i, q, r, rv, status, time: r?.time_ms ?? 0 }
    })
  }, [d])

  const n = rows.length
  const correct = rows.filter((r) => r.status === 'correct').length
  const wrong = rows.filter((r) => r.status === 'wrong').length
  const skipped = n - correct - wrong
  const score = a.score ?? correct
  const took = Math.max(0, (a.submitted_at ?? a.started_at) - a.started_at)
  const answeredTime = rows.reduce((s, r) => s + r.time, 0)
  // Wall-clock can under-report (resumed tests, same-second seeds); never show less than the time spent on questions.
  const tookRaw = Math.max(took, Math.round(answeredTime / 1000))
  const tookCapped = a.duration_s ? Math.min(tookRaw, a.duration_s) : tookRaw
  const shown = useCountUp(score)
  const p = pct(score, a.total || n) ?? 0

  const median = useMemo(() => {
    const ts = rows.map((r) => r.time).filter((t) => t > 0).sort((x, y) => x - y)
    if (!ts.length) return 0
    const m = Math.floor(ts.length / 2)
    return ts.length % 2 ? ts[m] : (ts[m - 1] + ts[m]) / 2
  }, [rows])

  const perSubject = a.subject === 'all'
    ? SUBJECTS.map((s) => {
        const rs = rows.filter((r) => r.q.subject === s)
        return { s, n: rs.length, c: rs.filter((r) => r.status === 'correct').length }
      }).filter((x) => x.n > 0)
    : []

  const chaptersPracticed = [...new Set(rows.filter((r) => r.status !== 'correct').map((r) => r.q.chapter))]

  return (
    <div className="mx-auto max-w-[1040px]">
      <Link to="/" className="mb-3 inline-flex items-center gap-1.5 text-label text-muted hover:text-ink">
        <ArrowLeftIcon size={14} aria-hidden /> Home
      </Link>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-h1">{a.title}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-muted">
            <SubjectChip subject={a.subject} />
            <span>
              {attemptMeta(a)} · {relDay(a.submitted_at ?? a.started_at, true)}
            </span>
          </p>
        </div>
        <Link to={retakeHref(a)} className="btn btn-secondary">
          <ArrowClockwiseIcon size={16} aria-hidden /> Retake similar
        </Link>
      </header>

      {/* Score + stats */}
      <section aria-label="Score" className="card flex flex-wrap items-center gap-x-10 gap-y-5 p-5 sm:p-6">
        <div>
          <p className="caption mb-1 text-muted">Score</p>
          <p className="font-display text-display font-semibold num" aria-label={`${score} out of ${a.total || n}`}>
            {shown}
            <span className="text-[24px] text-muted">/{a.total || n}</span>
          </p>
          <p className="caption mt-1 text-muted num">{p}% · one mark each, no negative marking</p>
        </div>
        <dl className="grid min-w-0 flex-1 basis-[300px] grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          <Stat icon={<CheckIcon size={14} weight="bold" className="text-correct" />} label="Correct" value={correct} />
          <Stat icon={<XIcon size={14} weight="bold" className="text-wrong" />} label="Wrong" value={wrong} />
          <Stat icon={<MinusIcon size={14} weight="bold" className="text-muted" />} label="Skipped" value={skipped} />
          <Stat
            icon={<ClockIcon size={14} weight="bold" className="text-muted" />}
            label="Time taken"
            value={duration(tookCapped * 1000)}
            sub={n && answeredTime ? `${qtime(answeredTime / n)} per question` : undefined}
          />
        </dl>
        {perSubject.length > 0 && (
          <div className="flex w-full flex-wrap gap-2 border-t border-line pt-4">
            {perSubject.map((x) => (
              <span key={x.s} className="chip h-7 px-3 text-label">
                {subjectName[x.s]}{' '}
                <span className="font-semibold text-ink num">
                  {x.c}/{x.n}
                </span>
              </span>
            ))}
          </div>
        )}
      </section>

      <ChapterTable rows={rows} subject={a.subject === 'all' ? null : a.subject} />

      <ReviewList rows={rows} median={median} practice={a.practice} />

      {chaptersPracticed.length > 0 && a.subject !== 'all' && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-line px-5 py-4">
          <p className="text-muted">
            Missed questions came from {chaptersPracticed.length === 1 ? 'one chapter' : `${chaptersPracticed.length} chapters`}.
          </p>
          <Link
            to={`/practice/${a.subject}?mode=chapter&practice=1&chapters=${encodeURIComponent(chaptersPracticed.join(','))}`}
            className="btn btn-secondary btn-sm"
          >
            Practise those chapters <ArrowRightIcon size={14} aria-hidden />
          </Link>
        </div>
      )}
    </div>
  )
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div>
      <dt className="caption flex items-center gap-1.5 text-muted">
        <span aria-hidden>{icon}</span>
        {label}
      </dt>
      <dd className="mt-0.5 font-display text-stat font-semibold num">{value}</dd>
      {sub && <dd className="caption text-muted">{sub}</dd>}
    </div>
  )
}

function ChapterTable({ rows, subject }: { rows: Row[]; subject: SubjectId | null }) {
  const groups = useMemo(() => {
    const m = new Map<string, { key: string; subject: SubjectId; chapter: string; name: string; n: number; c: number; w: number; t: number }>()
    for (const r of rows) {
      const key = r.q.subject + '/' + r.q.chapter
      let g = m.get(key)
      if (!g) {
        g = { key, subject: r.q.subject, chapter: r.q.chapter, name: r.q.chapter_name, n: 0, c: 0, w: 0, t: 0 }
        m.set(key, g)
      }
      g.n++
      g.t += r.time
      if (r.status === 'correct') g.c++
      if (r.status === 'wrong') g.w++
    }
    return [...m.values()].sort((a, b) => a.c / a.n - b.c / b.n || b.n - a.n)
  }, [rows])

  return (
    <section aria-labelledby="ch-h" className="mt-8">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="ch-h" className="text-h2">
          By chapter
        </h2>
        <p className="caption flex items-center gap-3 text-muted" aria-hidden>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm bg-correct" /> correct
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm bg-wrong" /> wrong
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm bg-line" /> skipped
          </span>
        </p>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full border-collapse text-left">
          <thead className="caption text-muted">
            <tr className="border-b border-line">
              <th scope="col" className="px-4 py-2.5 font-medium">
                Chapter
              </th>
              <th scope="col" className="w-[30%] px-2 py-2.5 font-medium max-sm:hidden">
                <span className="sr-only">Breakdown</span>
              </th>
              <th scope="col" className="px-2 py-2.5 text-right font-medium">
                Score
              </th>
              <th scope="col" className="px-2 py-2.5 text-right font-medium max-md:hidden">
                Avg time
              </th>
              <th scope="col" className="w-10 px-2 py-2.5">
                <span className="sr-only">Practise</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {groups.map((g) => (
              <tr key={g.key} className="group">
                <th scope="row" className="px-4 py-2.5 font-medium">
                  <span className="flex items-center gap-2">
                    {!subject && <SubjectChip subject={g.subject} short />}
                    <span className="min-w-0">{g.name}</span>
                  </span>
                </th>
                <td className="px-2 py-2.5 max-sm:hidden">
                  <div className="flex h-2 overflow-hidden rounded-full bg-line" aria-hidden>
                    <span className="bg-correct" style={{ width: `${(g.c / g.n) * 100}%` }} />
                    <span className="bg-wrong" style={{ width: `${(g.w / g.n) * 100}%` }} />
                  </div>
                </td>
                <td className="px-2 py-2.5 text-right whitespace-nowrap num">
                  <span className="font-semibold">{g.c}</span>
                  <span className="text-muted">/{g.n}</span>
                  <span className="caption ml-2 inline-block w-9 text-muted">{Math.round((g.c / g.n) * 100)}%</span>
                </td>
                <td className="px-2 py-2.5 text-right text-muted num max-md:hidden">{qtime(g.t / g.n)}</td>
                <td className="px-2 py-1.5 text-right">
                  <Link
                    to={`/practice/${g.subject}?mode=chapter&practice=1&chapters=${encodeURIComponent(g.chapter)}`}
                    className="btn btn-ghost btn-icon btn-sm text-muted"
                    aria-label={`Practise ${g.name}`}
                    title={`Practise ${g.name}`}
                  >
                    <ArrowRightIcon size={16} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ReviewList({ rows, median, practice }: { rows: Row[]; median: number; practice: boolean }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState<Set<number>>(new Set())
  const [report, setReport] = useState<Row | null>(null)

  const slow = (r: Row) => median > 0 && r.time > median
  const tests: Record<Filter, (r: Row) => boolean> = {
    all: () => true,
    wrong: (r) => r.status === 'wrong',
    skipped: (r) => r.status === 'skipped',
    marked: (r) => !!r.r?.marked,
    slow,
  }
  const list = rows.filter(tests[filter])
  const chips: { f: Filter; label: string }[] = [
    { f: 'all', label: 'All' },
    { f: 'wrong', label: 'Wrong' },
    { f: 'skipped', label: 'Skipped' },
    { f: 'marked', label: 'Marked' },
    { f: 'slow', label: 'Slow' },
  ]
  const toggle = (i: number) =>
    setOpen((s) => {
      const n = new Set(s)
      if (n.has(i)) n.delete(i)
      else n.add(i)
      return n
    })

  return (
    <section aria-labelledby="rev-h" className="mt-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 id="rev-h" className="text-h2">
          Review
        </h2>
        <div role="group" aria-label="Filter questions" className="flex flex-wrap gap-1.5">
          {chips.map((c) => {
            const count = rows.filter(tests[c.f]).length
            const on = filter === c.f
            return (
              <button
                key={c.f}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(c.f)}
                title={c.f === 'slow' ? `Took longer than your median of ${qtime(median)}` : undefined}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-label transition-colors duration-100 ${
                  on ? 'border-accent bg-accent-tint text-ink' : 'border-line-strong text-muted hover:text-ink'
                }`}
              >
                {c.label} <span className="font-normal num">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState title="Nothing here">
          {filter === 'wrong'
            ? 'No wrong answers in this test.'
            : filter === 'skipped'
              ? 'You answered every question.'
              : filter === 'marked'
                ? 'No questions were marked for review.'
                : 'No timing data for this test.'}
        </EmptyState>
      ) : (
        <ul className="card divide-y divide-line overflow-hidden">
          {list.map((row) => (
            <ReviewRow
              key={row.q.id}
              row={row}
              open={open.has(row.i)}
              onToggle={() => toggle(row.i)}
              slow={slow(row)}
              practice={practice}
              onReport={() => setReport(row)}
            />
          ))}
        </ul>
      )}
      {report && (
        <ReportDialog
          qid={report.q.id}
          label={`Q${report.i + 1}${report.q.source_label ? ` · ${report.q.source_label}` : ''}`}
          open
          onClose={() => setReport(null)}
        />
      )}
    </section>
  )
}

const statusUi: Record<Status, { label: string; icon: React.ReactNode; cls: string }> = {
  correct: { label: 'Correct', icon: <CheckIcon size={14} weight="bold" />, cls: 'text-correct bg-correct-tint' },
  wrong: { label: 'Wrong', icon: <XIcon size={14} weight="bold" />, cls: 'text-wrong bg-wrong-tint' },
  skipped: { label: 'Skipped', icon: <MinusIcon size={14} weight="bold" />, cls: 'text-muted bg-paper border border-line' },
}

function ReviewRow({
  row,
  open,
  onToggle,
  slow,
  onReport,
}: {
  row: Row
  open: boolean
  onToggle: () => void
  slow: boolean
  practice: boolean
  onReport: () => void
}) {
  const { q, r, rv, status } = row
  const ui = statusUi[status]
  const acc = rv ? (rv.accepted?.length ? rv.accepted : [rv.answer]) : []
  const stateOf = (i: number): OptionState => {
    const isAns = acc.includes(i)
    const picked = r?.choice === i
    if (picked && isAns) return 'correct-picked'
    if (picked) return 'wrong-picked'
    if (isAns) return 'correct'
    return 'dim'
  }
  const panelId = `rev-${q.id}`
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100 hover:bg-raised focus-visible:outline-offset-[-2px]"
      >
        <span className="w-8 shrink-0 font-mono text-[13px] text-muted num">Q{row.i + 1}</span>
        <span className={`inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-caption font-semibold ${ui.cls}`}>
          {ui.icon}
          <span className="max-sm:sr-only">{ui.label}</span>
        </span>
        <span className="min-w-0 flex-1 truncate text-muted [&_.katex]:text-ink">
          <MdInline text={q.stem.split('\n')[0]} />
        </span>
        {r?.marked && <FlagIcon size={14} weight="fill" className="shrink-0 text-marked" aria-label="Marked" />}
        <span className={`caption w-16 shrink-0 text-right num ${slow ? 'font-semibold text-ink' : 'text-muted'}`}>
          {row.time ? qtime(row.time) : '—'}
        </span>
        <CaretDownIcon
          size={14}
          aria-hidden
          className={`shrink-0 text-muted transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div id={panelId} className="fade-in border-t border-line bg-paper/60 px-4 pt-4 pb-5 sm:px-6">
          <p className="caption mb-2 flex flex-wrap gap-x-2 text-muted">
            <span>{q.chapter_name}</span>
            {q.source_label && <span>· {q.source_label}</span>}
            <span>
              · {row.time ? `${qtime(row.time)} on this question` : 'no time recorded'}
              {slow ? ' (slower than your median)' : ''}
            </span>
          </p>
          <MdBlock text={q.stem} className="max-w-[72ch] text-question font-[450]" />
          <QuestionImages images={q.images} compact />
          <div className="mt-4 max-w-[72ch] space-y-2">
            {q.options.map((o, i) => (
              <OptionCard key={i} index={i} text={o} state={stateOf(i)} compact />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="caption text-muted">
              {status === 'skipped'
                ? `Not answered. The answer is ${acc.map((x) => LETTERS[x]).join(' or ')}.`
                : status === 'wrong'
                  ? `You chose ${LETTERS[r!.choice!]}; the answer is ${acc.map((x) => LETTERS[x]).join(' or ')}.`
                  : acc.length === 4
                    ? 'Bonus question — every option earned the mark.'
                    : `You chose ${LETTERS[r!.choice!]} — correct.`}
            </p>
            <button type="button" className="caption text-muted underline-offset-[3px] hover:text-ink hover:underline" onClick={onReport}>
              Report a problem
            </button>
          </div>
        </div>
      )}
    </li>
  )
}
