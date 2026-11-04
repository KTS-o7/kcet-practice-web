import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BooksIcon,
  CalendarBlankIcon,
  CheckIcon,
  LightningIcon,
  MinusIcon,
  StackIcon,
  TimerIcon,
} from '@phosphor-icons/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { EmptyState, ErrorState, Segmented, Skeleton, Switch, subjectBgClass } from '../components/ui'
import { api } from '../lib/api'
import { isSubject, minutesLabel, plural, SUBJECTS, subjectName } from '../lib/format'
import { qk, useMeta } from '../lib/queries'
import type { ChapterMeta, CreateAttemptInput, Meta, Mode, SubjectId } from '../lib/types'

type SubjectMode = Exclude<Mode, 'full'>
const COUNTS = [10, 20, 30, 45] as const

export default function Setup() {
  const { subject = '' } = useParams()
  const meta = useMeta()
  if (subject !== 'all' && !isSubject(subject)) return <Navigate to="/" replace />
  if (meta.isPending) return <SetupSkeleton />
  if (meta.error) return <ErrorState error={meta.error} onRetry={() => meta.refetch()} />
  return <SetupForm key={subject} subject={subject as SubjectId | 'all'} meta={meta.data} />
}

function SetupSkeleton() {
  return (
    <div className="mx-auto max-w-[1040px]">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-3 h-4 w-72" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[88px] rounded-[10px]" />
          ))}
          <Skeleton className="col-span-2 mt-4 h-12 rounded-[10px]" />
        </div>
        <Skeleton className="h-72 rounded-[14px]" />
      </div>
    </div>
  )
}

function SetupForm({ subject, meta }: { subject: SubjectId | 'all'; meta: Meta }) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isFull = subject === 'all'
  const sm = isFull ? undefined : meta.subjects.find((s) => s.id === subject)
  const chapters = useMemo(() => sm?.chapters ?? [], [sm])
  const papers = useMemo(() => meta.papers.filter((p) => p.subject === subject), [meta.papers, subject])

  const initialMode = ((): SubjectMode => {
    const m = params.get('mode')
    if (m === 'quick' || m === 'chapter' || m === 'mock') return m
    if (m === 'year' && papers.length) return 'year'
    return 'mock'
  })()
  const [mode, setMode] = useState<SubjectMode>(initialMode)
  const [practice, setPractice] = useState(params.get('practice') === '1')
  const [timedPref, setTimed] = useState(params.get('timed') === '1')
  const [includeOOS, setIncludeOOS] = useState(false)
  const [count, setCount] = useState<number>(() => {
    const c = Number(params.get('count'))
    return (COUNTS as readonly number[]).includes(c) ? c : c > 0 ? Math.min(c, 180) : 20
  })
  const [picked, setPicked] = useState<Set<string>>(() => new Set((params.get('chapters') ?? '').split(',').filter(Boolean)))
  const [paper, setPaper] = useState<string>(() => params.get('paper') ?? papers[0]?.id ?? '')

  const oosTotal = chapters.reduce((a, c) => a + c.out_of_syllabus, 0)
  const avail = (c: ChapterMeta) => c.count + (includeOOS ? c.out_of_syllabus : 0)
  const subjectAvail = (sm?.count ?? 0) + (includeOOS ? oosTotal : 0)
  const chapterAvail = chapters.filter((c) => picked.has(c.id)).reduce((a, c) => a + avail(c), 0)

  // Live summary of what the server will build.
  const plan = useMemo(() => {
    if (isFull) {
      const n = SUBJECTS.reduce(
        (a, s) => a + Math.min(60, meta.subjects.find((x) => x.id === s)?.count ?? 0),
        0,
      )
      const timed = !practice || timedPref
      return { n, seconds: timed ? 210 * 60 : 0, mode: 'full' as Mode }
    }
    switch (mode) {
      case 'mock': {
        const n = Math.min(60, subjectAvail)
        return { n, seconds: !practice || timedPref ? 70 * 60 : 0, mode }
      }
      case 'quick': {
        const n = Math.min(count, subjectAvail)
        return { n, seconds: !practice || timedPref ? n * 60 : 0, mode }
      }
      case 'chapter': {
        const n = Math.min(count, chapterAvail)
        return { n, seconds: timedPref ? n * 60 : 0, mode }
      }
      case 'year': {
        const p = papers.find((x) => x.id === paper)
        const n = p?.count ?? 0
        return { n, seconds: !practice || timedPref ? Math.round((70 * 60 * n) / 60) : 0, mode }
      }
    }
  }, [isFull, mode, practice, timedPref, count, subjectAvail, chapterAvail, papers, paper, meta.subjects])

  const timerLocked = !practice && (isFull || mode !== 'chapter') // exam papers are always timed
  const timedShown = timerLocked ? true : timedPref

  const create = useMutation({
    mutationFn: (input: CreateAttemptInput) => api.createAttempt(input),
    onSuccess: ({ id }) => {
      void qc.invalidateQueries({ queryKey: qk.attempts })
      navigate(`/test/${id}`)
    },
  })

  const blocker =
    plan.n === 0
      ? mode === 'chapter' && !isFull && picked.size === 0
        ? 'Pick at least one chapter.'
        : mode === 'year' && !isFull && !paper
          ? 'Pick a paper.'
          : 'No questions match these settings yet.'
      : null

  const start = () => {
    if (blocker || create.isPending) return
    const input: CreateAttemptInput = isFull
      ? { mode: 'full', practice, timed: timedShown, include_oos: includeOOS }
      : {
          mode,
          subject: subject as SubjectId,
          practice,
          timed: timedShown,
          include_oos: includeOOS,
          ...(mode === 'quick' || mode === 'chapter' ? { count } : {}),
          ...(mode === 'chapter' ? { chapters: [...picked] } : {}),
          ...(mode === 'year' ? { paper } : {}),
        }
    create.mutate(input)
  }

  if (!isFull && (sm?.count ?? 0) === 0 && oosTotal === 0) {
    return (
      <div className="mx-auto max-w-[1040px]">
        <BackLink />
        <h1 className="text-h1">{subjectName[subject]}</h1>
        <EmptyState
          className="mt-6"
          title={`${subjectName[subject]} questions are coming soon`}
          action={
            <Link to="/" className="btn btn-secondary">
              Back to home
            </Link>
          }
        >
          Every question is checked against the official answer key before it shows up here. They’ll appear as soon as
          that’s done.
        </EmptyState>
      </div>
    )
  }

  const pyq = isFull ? 0 : (sm?.pyq ?? 0)

  return (
    <div className="mx-auto max-w-[1040px]">
      <BackLink />
      <header className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="flex items-center gap-3 text-h1">
            {isFull ? (
              <span aria-hidden className="flex gap-1">
                {SUBJECTS.map((s) => (
                  <span key={s} className={`h-2.5 w-2.5 rounded-full ${subjectBgClass(s)}`} />
                ))}
              </span>
            ) : (
              <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${subjectBgClass(subject)}`} />
            )}
            {isFull ? 'Full KCET' : subjectName[subject]}
          </h1>
          <p className="mt-1 text-muted">
            {isFull
              ? 'Physics, Chemistry and Mathematics back to back — 60 questions each, 3 h 30 min.'
              : `${plural(sm?.count ?? 0, 'question')} in the bank${pyq ? ` · ${pyq} from past KCET papers` : ''}`}
          </p>
        </div>
      </header>

      <div className="grid gap-x-8 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
        <div className="space-y-6">
          {!isFull && (
            <fieldset>
              <legend className="label mb-2 text-muted">Mode</legend>
              <div role="radiogroup" aria-label="Mode" className="grid grid-cols-2 gap-3">
                <ModeCard
                  on={mode === 'mock'}
                  onClick={() => setMode('mock')}
                  icon={<StackIcon size={20} />}
                  title="Full mock"
                  desc="60 questions · 70 min"
                  hint="Real exam pace — 70 min to answer, like the OMR window."
                />
                <ModeCard
                  on={mode === 'quick'}
                  onClick={() => setMode('quick')}
                  icon={<LightningIcon size={20} />}
                  title="Quick set"
                  desc="10–45 questions · 1 min each"
                />
                <ModeCard
                  on={mode === 'chapter'}
                  onClick={() => setMode('chapter')}
                  icon={<BooksIcon size={20} />}
                  title="Chapter-wise"
                  desc="Choose the chapters"
                />
                <ModeCard
                  on={mode === 'year'}
                  onClick={() => setMode('year')}
                  icon={<CalendarBlankIcon size={20} />}
                  title="Year-wise"
                  desc={papers.length ? `${plural(papers.length, 'past paper')}, in order` : 'No past papers yet'}
                  disabled={!papers.length}
                />
              </div>
            </fieldset>
          )}

          <div>
            <p className="label mb-2 text-muted" id="style-l">
              How it runs
            </p>
            <Segmented
              label="Exam or practice"
              value={practice ? 'practice' : 'exam'}
              onChange={(v) => setPractice(v === 'practice')}
              className="w-full sm:w-auto"
              options={[
                { value: 'exam', label: 'Exam' },
                { value: 'practice', label: 'Practice' },
              ]}
            />
            <p className="mt-2 text-label font-normal text-muted">
              {practice
                ? 'Check each answer as you go and see right or wrong straight away.'
                : 'Like the real paper: answers and score only after you submit.'}
            </p>
          </div>

          {!isFull && (mode === 'quick' || mode === 'chapter') && (
            <div>
              <p className="label mb-2 text-muted">Questions</p>
              <Segmented
                label="Number of questions"
                value={String(count)}
                onChange={(v) => setCount(Number(v))}
                options={COUNTS.map((c) => ({ value: String(c), label: <span className="num">{c}</span> }))}
              />
            </div>
          )}

          <div className="space-y-4 rounded-[14px] border border-line p-4">
            <Switch
              checked={timedShown}
              disabled={timerLocked}
              onChange={setTimed}
              label={
                <span className="inline-flex items-center gap-1.5">
                  <TimerIcon size={16} aria-hidden /> Timed
                </span>
              }
              description={
                timerLocked
                  ? 'Exam mode always runs on the clock.'
                  : timedShown
                    ? 'A countdown, and the test submits itself at zero.'
                    : 'No countdown — you’ll see elapsed time instead.'
              }
            />
            <div className="h-px bg-line" />
            <Switch
              checked={includeOOS}
              onChange={setIncludeOOS}
              disabled={isFull ? false : oosTotal === 0}
              label="Include out-of-syllabus"
              description={
                !isFull && oosTotal === 0
                  ? 'Nothing in the bank is out of syllabus.'
                  : 'Questions from topics dropped from the current KCET syllabus.' +
                    (!isFull && oosTotal ? ` Adds up to ${oosTotal}.` : '')
              }
            />
          </div>
        </div>

        <div className="min-w-0">
          {isFull ? (
            <InfoPanel
              title="How the paper is built"
              lines={[
                'Three 60-question papers, Physics then Chemistry then Mathematics, in one sitting.',
                'Each paper is spread across chapters the way past KCET papers are.',
                'Questions you haven’t seen come first, then ones you got wrong before.',
              ]}
            />
          ) : mode === 'chapter' ? (
            <ChapterPicker chapters={chapters} picked={picked} setPicked={setPicked} includeOOS={includeOOS} />
          ) : mode === 'year' ? (
            <PaperList papers={papers} value={paper} onChange={setPaper} />
          ) : mode === 'mock' ? (
            <InfoPanel
              title="How the mock is built"
              lines={[
                '60 questions spread across chapters in the same proportion as past KCET papers.',
                'Questions you haven’t seen come first, then ones you got wrong before.',
                'One mark each, no negative marking — just like the real exam.',
              ]}
            />
          ) : (
            <InfoPanel
              title="How the set is picked"
              lines={[
                'Drawn from the whole subject, unseen questions first.',
                'A minute per question when timed — a touch faster than the KCET pace of 70 seconds.',
                'Good for a short daily session or a warm-up before a mock.',
              ]}
            />
          )}
        </div>
      </div>

      {/* Sticky summary footer */}
      <div className="sticky bottom-0 z-10 -mx-4 mt-8 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur-[6px] sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <p className="min-w-0 flex-1 font-semibold num" aria-live="polite">
            {plan.n} Q · {minutesLabel(plan.seconds)} · {practice ? 'Practice' : 'Exam'}
            {mode === 'chapter' && !isFull && picked.size > 0 && (
              <span className="font-normal text-muted"> · {plural(picked.size, 'chapter')}</span>
            )}
            {create.error ? (
              <span role="alert" className="mt-0.5 block text-label font-medium text-wrong">
                {create.error.message}
              </span>
            ) : blocker ? (
              <span className="mt-0.5 block text-label font-normal text-muted">{blocker}</span>
            ) : null}
          </p>
          <button type="button" className="btn btn-primary min-w-36" onClick={start} disabled={!!blocker || create.isPending}>
            {create.isPending ? 'Starting' : 'Start'} <ArrowRightIcon size={16} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}

function BackLink() {
  return (
    <Link to="/" className="mb-3 inline-flex items-center gap-1.5 text-label text-muted hover:text-ink">
      <ArrowLeftIcon size={14} aria-hidden /> Home
    </Link>
  )
}

function ModeCard({
  on,
  onClick,
  icon,
  title,
  desc,
  hint,
  disabled,
}: {
  on: boolean
  onClick: () => void
  icon: ReactNode
  title: string
  desc: string
  hint?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      disabled={disabled}
      onClick={onClick}
      className={`relative flex min-h-[84px] flex-col items-start gap-0.5 rounded-[10px] border px-3.5 py-3 text-left transition-[background-color,border-color] duration-150 ease-k disabled:opacity-45 ${
        on
          ? 'border-accent bg-accent-tint shadow-[inset_0_0_0_0.5px_var(--color-accent)]'
          : 'border-line-strong bg-surface hover:border-accent/50 hover:bg-raised'
      }`}
    >
      <span className={on ? 'text-accent' : 'text-muted'} aria-hidden>
        {icon}
      </span>
      <span className="font-semibold">{title}</span>
      <span className="caption text-muted">{desc}</span>
      {hint && <span className="caption text-muted/85">{hint}</span>}
      {on && (
        <span aria-hidden className="absolute top-3 right-3 grid h-5 w-5 place-items-center rounded-full bg-accent text-on-accent">
          <CheckIcon size={12} weight="bold" />
        </span>
      )}
    </button>
  )
}

function InfoPanel({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="card p-5">
      <h2 className="text-h2">{title}</h2>
      <ul className="mt-3 space-y-2.5">
        {lines.map((l) => (
          <li key={l} className="flex gap-3 text-muted">
            <span aria-hidden className="mt-[9px] h-1 w-3 shrink-0 rounded-full bg-line-strong" />
            <span>{l}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Checkbox({ state }: { state: 'on' | 'off' | 'some' }) {
  return (
    <span
      aria-hidden
      className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors duration-100 ${
        state === 'off' ? 'border-line-strong bg-raised' : 'border-accent bg-accent text-on-accent'
      }`}
    >
      {state === 'on' && <CheckIcon size={12} weight="bold" />}
      {state === 'some' && <MinusIcon size={12} weight="bold" />}
    </span>
  )
}

function ChapterPicker({
  chapters,
  picked,
  setPicked,
  includeOOS,
}: {
  chapters: ChapterMeta[]
  picked: Set<string>
  setPicked: (s: Set<string>) => void
  includeOOS: boolean
}) {
  const groups = [11, 12].map((cls) => ({ cls, list: chapters.filter((c) => c.class === cls) })).filter((g) => g.list.length)
  const other = chapters.filter((c) => c.class !== 11 && c.class !== 12)
  if (other.length) groups.push({ cls: 0, list: other })
  const usable = (c: ChapterMeta) => c.count + (includeOOS ? c.out_of_syllabus : 0) > 0

  const toggle = (id: string) => {
    const n = new Set(picked)
    if (n.has(id)) n.delete(id)
    else n.add(id)
    setPicked(n)
  }

  return (
    <div className="card flex max-h-[min(460px,calc(100dvh-220px))] min-h-[280px] flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 className="label">
          Chapters <span className="font-normal text-muted num">· {picked.size} picked</span>
        </h2>
        {picked.size > 0 && (
          <button type="button" className="link text-label" onClick={() => setPicked(new Set())}>
            Clear
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2">
        {groups.map((g) => {
          const ids = g.list.filter(usable).map((c) => c.id)
          const n = ids.filter((id) => picked.has(id)).length
          const state = n === 0 ? 'off' : n === ids.length ? 'on' : 'some'
          return (
            <div key={g.cls} role="group" aria-label={g.cls ? `Class ${g.cls}` : 'Other'}>
              <button
                type="button"
                className="sticky top-0 z-[1] flex w-full items-center gap-3 bg-surface px-2 pt-3 pb-2 text-left"
                onClick={() => {
                  const s = new Set(picked)
                  if (state === 'on') ids.forEach((id) => s.delete(id))
                  else ids.forEach((id) => s.add(id))
                  setPicked(s)
                }}
                aria-pressed={state === 'on'}
                aria-label={`Select all class ${g.cls} chapters`}
              >
                <Checkbox state={state} />
                <span className="label text-muted">{g.cls ? `Class ${g.cls}` : 'Other'}</span>
              </button>
              <ul>
                {g.list.map((c) => {
                  const ok = usable(c)
                  const on = picked.has(c.id)
                  const n = c.count + (includeOOS ? c.out_of_syllabus : 0)
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={on}
                        disabled={!ok}
                        onClick={() => toggle(c.id)}
                        className="flex min-h-10 w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors duration-100 hover:bg-raised disabled:opacity-45"
                      >
                        <Checkbox state={on ? 'on' : 'off'} />
                        <span className="min-w-0 flex-1">
                          {c.name}
                          {!c.in_syllabus && <span className="caption ml-2 text-muted">out of syllabus</span>}
                        </span>
                        <span className="caption text-muted num">{n}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PaperList({ papers, value, onChange }: { papers: Meta['papers']; value: string; onChange: (v: string) => void }) {
  if (!papers.length)
    return <EmptyState title="No past papers yet">Past KCET papers appear here once they’re checked.</EmptyState>
  return (
    <div className="card flex max-h-[min(460px,calc(100dvh-220px))] flex-col overflow-hidden">
      <div className="border-b border-line px-4 py-3">
        <h2 className="label">Past papers</h2>
      </div>
      <div role="radiogroup" aria-label="Past paper" className="min-h-0 flex-1 overflow-y-auto p-2">
        {papers.map((p) => {
          const on = p.id === value
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(p.id)}
              className={`flex min-h-12 w-full items-center gap-3 rounded-[8px] px-3 py-2 text-left transition-colors duration-100 ${
                on ? 'bg-accent-tint' : 'hover:bg-raised'
              }`}
            >
              <span
                aria-hidden
                className={`grid h-[18px] w-[18px] place-items-center rounded-full border ${on ? 'border-accent' : 'border-line-strong'}`}
              >
                {on && <span className="h-2.5 w-2.5 rounded-full bg-accent" />}
              </span>
              <span className="flex-1 font-semibold">{p.name}</span>
              <span className="caption text-muted num">{plural(p.count, 'question')}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
