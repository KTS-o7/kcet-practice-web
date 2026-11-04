import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  CheckIcon,
  CloudCheckIcon,
  CloudSlashIcon,
  EraserIcon,
  FlagIcon,
  FlagBannerIcon,
  SignOutIcon,
  SquaresFourIcon,
  WarningIcon,
  XCircleIcon,
} from '@phosphor-icons/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { Dialog } from '../components/Dialog'
import { MdBlock } from '../components/Md'
import { QuestionImages } from '../components/QuestionImages'
import { ReportDialog } from '../components/ReportDialog'
import { OptionCard, type OptionState } from '../components/test/OptionCard'
import { counts, Legend, Palette } from '../components/test/Palette'
import { Timer } from '../components/test/Timer'
import { ErrorState, Skeleton, Spinner, SubjectChip, subjectBgClass } from '../components/ui'
import { api, ApiError, isTransient } from '../lib/api'
import { useAutosave, type SaveStatus } from '../lib/autosave'
import { clock, LETTERS, plural, subjectName } from '../lib/format'
import { qk } from '../lib/queries'
import type { AttemptDetail, ResponseRow, ReviewItem } from '../lib/types'

export default function Test() {
  const { id = '' } = useParams()
  const q = useQuery({
    queryKey: qk.attempt(id),
    queryFn: () => api.attempt(id),
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
  if (q.isPending) return <TestSkeleton />
  if (q.error) {
    if (q.error instanceof ApiError && q.error.status === 404) return <Navigate to="/" replace />
    return (
      <div className="mx-auto max-w-lg px-4 py-24">
        <ErrorState error={q.error} title="Couldn’t open this test." onRetry={() => q.refetch()} />
      </div>
    )
  }
  if (q.data.attempt.submitted_at != null) return <Navigate to={`/results/${id}`} replace />
  if (!q.data.questions.length)
    return (
      <div className="mx-auto max-w-lg px-4 py-24">
        <ErrorState error={new Error('Its questions were removed from the bank.')} title="This test is empty." />
      </div>
    )
  return <Runner key={id} detail={q.data} fetchedAt={q.dataUpdatedAt} />
}

function TestSkeleton() {
  return (
    <div className="flex h-dvh flex-col">
      <div className="flex h-12 items-center justify-between border-b border-line px-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex-1 px-6 py-8 sm:px-10">
          <div className="max-w-[72ch] space-y-3">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
            <div className="space-y-2.5 pt-5">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 rounded-[10px]" />
              ))}
            </div>
          </div>
        </div>
        <div className="hidden w-[280px] border-l border-line p-5 min-[700px]:block">
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: 30 }, (_, i) => (
              <Skeleton key={i} className="h-9 rounded-[8px]" />
            ))}
          </div>
        </div>
      </div>
      <div className="h-14 border-t border-line" />
    </div>
  )
}

const posKey = (id: string) => `kaagada:pos:${id}`

function Runner({ detail, fetchedAt }: { detail: AttemptDetail; fetchedAt: number }) {
  const { attempt, questions } = detail
  const navigate = useNavigate()
  const qc = useQueryClient()
  const practice = attempt.practice
  const grouped = attempt.subject === 'all'
  const N = questions.length
  const skewMs = useMemo(() => detail.now * 1000 - fetchedAt, [detail.now, fetchedAt])

  // ---- responses (ref mirrors state so saves always read the latest) ----
  const initial = useMemo(() => {
    const m: Record<string, ResponseRow> = {}
    for (const q of questions) m[q.id] = { qid: q.id, choice: null, marked: false, time_ms: 0, revealed: false }
    for (const r of detail.responses) m[r.qid] = { ...r }
    return m
  }, [detail, questions])
  const respRef = useRef(initial)
  const [resp, setResp] = useState(initial)
  const [review, setReview] = useState<Record<string, ReviewItem>>(() => ({ ...detail.review }))
  const update = useCallback((qid: string, patch: Partial<ResponseRow>) => {
    respRef.current = { ...respRef.current, [qid]: { ...respRef.current[qid], ...patch } }
    setResp(respRef.current)
  }, [])

  // ---- current question ----
  const [idx, setIdx] = useState(() => {
    const saved = Number(localStorage.getItem(posKey(attempt.id)))
    if (Number.isInteger(saved) && saved >= 0 && saved < N) return saved
    return 0
  })
  const q = questions[idx]
  const r = resp[q.id]
  const rv = r.revealed ? review[q.id] : undefined

  // ---- time on question: counted only while it's on screen and the tab is visible ----
  const active = useRef<{ qid: string; since: number | null }>({ qid: q.id, since: performance.now() })
  const elapsedOf = useCallback((qid: string) => {
    const base = respRef.current[qid]?.time_ms ?? 0
    const a = active.current
    if (a.qid !== qid || a.since == null || respRef.current[qid]?.revealed) return base
    return base + Math.round(performance.now() - a.since)
  }, [])
  /** Fold the running time into the stored total. Returns ms added. */
  const commitTime = useCallback(() => {
    const a = active.current
    if (a.since == null) return 0
    const now = performance.now()
    const add = respRef.current[a.qid]?.revealed ? 0 : Math.round(now - a.since)
    a.since = document.visibilityState === 'visible' ? now : null
    if (add > 0) {
      respRef.current = {
        ...respRef.current,
        [a.qid]: { ...respRef.current[a.qid], time_ms: respRef.current[a.qid].time_ms + add },
      }
    }
    return add
  }, [])

  const [closed, setClosed] = useState(false)
  const doneRef = useRef(false)
  const saver = useAutosave(
    attempt.id,
    (qid) => {
      const x = respRef.current[qid]
      return { choice: x.choice, marked: x.marked, time_ms: elapsedOf(qid) }
    },
    () => setClosed(true),
  )

  // Switch questions: bank the time on the old one, start the clock on the new one.
  useEffect(() => {
    const prev = active.current.qid
    if (prev !== q.id) {
      const add = commitTime()
      if (add >= 1000) saver.queue(prev, 800)
      active.current = { qid: q.id, since: document.visibilityState === 'visible' ? performance.now() : null }
    }
    try {
      localStorage.setItem(posKey(attempt.id), String(idx))
    } catch {
      /* ignore */
    }
    scrollRef.current?.scrollTo({ top: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.id])

  // Pause on hidden tab, save on the way out, heartbeat every 30 s.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        if (commitTime() > 0) saver.queue(active.current.qid, 0)
        active.current.since = null
        saver.beacon()
      } else {
        active.current.since = performance.now()
      }
    }
    const onHide = () => {
      commitTime()
      saver.queue(active.current.qid, 0)
      saver.beacon()
    }
    const beat = window.setInterval(() => {
      if (document.visibilityState === 'visible' && commitTime() > 0) saver.queue(active.current.qid, 0)
    }, 30_000)
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('pagehide', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('pagehide', onHide)
      window.clearInterval(beat)
    }
  }, [commitTime, saver])

  // Flush when leaving the screen inside the app.
  useEffect(
    () => () => {
      if (doneRef.current) return
      commitTime()
      saver.queue(active.current.qid, 0)
      void saver.flush()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  // ---- actions ----
  const [say, setSay] = useState('')
  const [checking, setChecking] = useState(false)
  const [checkErr, setCheckErr] = useState<string | null>(null)
  const go = useCallback((i: number) => setIdx(Math.max(0, Math.min(N - 1, i))), [N])

  const select = useCallback(
    (choice: number) => {
      const cur = respRef.current[q.id]
      if (cur.revealed || closed) return
      update(q.id, { choice })
      setCheckErr(null)
      saver.queue(q.id)
    },
    [q.id, update, saver, closed],
  )
  const clear = useCallback(() => {
    const cur = respRef.current[q.id]
    if (cur.revealed || cur.choice == null || closed) return
    update(q.id, { choice: null })
    saver.queue(q.id)
  }, [q.id, update, saver, closed])
  const toggleMark = useCallback(() => {
    if (closed) return
    const m = !respRef.current[q.id].marked
    update(q.id, { marked: m })
    setSay(m ? `Question ${idx + 1} marked for review` : `Question ${idx + 1} unmarked`)
    saver.queue(q.id)
  }, [q.id, idx, update, saver, closed])

  const check = useCallback(async () => {
    const cur = respRef.current[q.id]
    if (!practice || cur.revealed || checking || closed) return
    if (cur.choice == null) {
      setSay('Pick an option first.')
      setCheckErr('Pick an option first.')
      return
    }
    setChecking(true)
    setCheckErr(null)
    commitTime()
    try {
      const res = await api.reveal(attempt.id, q.id, { choice: cur.choice, time_ms: respRef.current[q.id].time_ms })
      setReview((m) => ({ ...m, [q.id]: res }))
      update(q.id, { revealed: true })
      const ans = LETTERS[res.answer]
      setSay(res.correct ? `Correct. ${ans} is right.` : `Not quite. The answer is ${ans}.`)
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setClosed(true)
      setCheckErr(isTransient(e) ? 'Couldn’t check just now — you may be offline. Try again.' : (e as Error).message)
    } finally {
      setChecking(false)
    }
  }, [practice, q.id, attempt.id, checking, closed, commitTime, update])

  // ---- submit ----
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [submitting, setSubmitting] = useState<null | 'manual' | 'auto'>(null)
  const [submitErr, setSubmitErr] = useState<string | null>(null)

  const finish = useCallback(
    async (why: 'manual' | 'auto') => {
      setSubmitting(why)
      setSubmitErr(null)
      commitTime()
      saver.queue(active.current.qid, 0)
      for (let attemptNo = 0; ; attemptNo++) {
        const saved = await saver.flush()
        if (!saved && why === 'manual') {
          setSubmitErr('Some answers haven’t reached the server yet. Check your connection, then try again.')
          setSubmitting(null)
          return
        }
        try {
          await api.submit(attempt.id)
          doneRef.current = true
          break
        } catch (e) {
          if (why === 'manual' || !isTransient(e) || attemptNo > 20) {
            setSubmitErr((e as Error).message)
            setSubmitting(null)
            return
          }
          await new Promise((res) => setTimeout(res, 3000))
        }
      }
      try {
        localStorage.removeItem(posKey(attempt.id))
      } catch {
        /* ignore */
      }
      qc.removeQueries({ queryKey: qk.attempt(attempt.id) }) // results must refetch the submitted version
      void qc.invalidateQueries({ queryKey: qk.attempts })
      void qc.invalidateQueries({ queryKey: qk.stats })
      navigate(`/results/${attempt.id}`, { replace: true })
    },
    [attempt.id, commitTime, navigate, qc, saver],
  )
  const onExpire = useCallback(() => void finish('auto'), [finish])

  // Server says it's already submitted (e.g. from another tab): go to results.
  useEffect(() => {
    if (closed && !submitting) navigate(`/results/${attempt.id}`, { replace: true })
  }, [closed, submitting, navigate, attempt.id])

  // ---- keyboard ----
  const anyDialog = confirmOpen || paletteOpen || reportOpen || submitting != null
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {})
  keyRef.current = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || anyDialog) return
    const t = e.target as HTMLElement
    if (t.closest('input, textarea, select, [contenteditable="true"], dialog')) return
    const k = e.key
    const lower = k.length === 1 ? k.toLowerCase() : k
    if (/^[1-4]$/.test(k)) select(Number(k) - 1)
    else if (/^[a-d]$/.test(lower)) select(lower.charCodeAt(0) - 97)
    else if (lower === 'n' || k === 'ArrowRight') {
      if (idx < N - 1) go(idx + 1)
    } else if (lower === 'p' || k === 'ArrowLeft') go(idx - 1)
    else if (lower === 'm') toggleMark()
    else if (lower === 'x') clear()
    else if (k === 'Enter' && practice) {
      if (t.tagName === 'BUTTON' && !t.hasAttribute('data-option')) return
      if (respRef.current[q.id].revealed) {
        if (idx < N - 1) go(idx + 1)
      } else void check()
    } else return
    e.preventDefault()
  }
  useEffect(() => {
    const h = (e: KeyboardEvent) => keyRef.current(e)
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  // ---- derived ----
  const scrollRef = useRef<HTMLDivElement>(null)
  const c = useMemo(() => counts(questions, resp, review), [questions, resp, review])
  const isLast = idx === N - 1

  const optState = (i: number): OptionState => {
    if (rv) {
      const acc = rv.accepted?.length ? rv.accepted : [rv.answer]
      const isAns = acc.includes(i)
      const picked = r.choice === i
      if (picked && isAns) return 'correct-picked'
      if (picked) return 'wrong-picked'
      if (isAns) return 'correct'
      return 'dim'
    }
    return r.choice === i ? 'selected' : 'idle'
  }

  const deadlineMs = detail.deadline * 1000

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-paper">
      {/* Top bar */}
      <header className="grid h-12 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-line px-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm text-muted"
            onClick={() => navigate('/')}
            aria-label="Leave test (it stays saved; the timer keeps running)"
            title="Leave — your answers stay saved, the timer keeps running"
          >
            <SignOutIcon size={18} className="-scale-x-100" />
          </button>
          <span className="hidden min-w-0 items-center gap-2 truncate font-semibold min-[900px]:flex">
            <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${subjectBgClass(grouped ? q.subject : attempt.subject)}`} />
            <span className="truncate">{grouped ? `Full KCET · ${subjectName[q.subject]}` : attempt.title}</span>
          </span>
          <span className="hidden font-mono text-[13px] text-muted num min-[700px]:inline">
            Q {idx + 1} / {N}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm gap-1.5 font-mono text-[13px] num min-[700px]:hidden"
            onClick={() => setPaletteOpen(true)}
            aria-label={`Question ${idx + 1} of ${N}. Open question palette`}
          >
            <SquaresFourIcon size={16} aria-hidden /> {idx + 1}/{N}
          </button>
        </div>
        <Timer deadlineMs={deadlineMs} startedMs={attempt.started_at * 1000} skewMs={skewMs} onExpire={onExpire} />
        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <SaveBadge status={saver.status} />
          <button type="button" className="btn btn-primary btn-sm sm:h-9 sm:px-4" onClick={() => setConfirmOpen(true)}>
            Submit
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Question column */}
        <main ref={scrollRef} className="min-w-0 flex-1 overflow-y-auto overscroll-contain" aria-label={`Question ${idx + 1}`}>
          <div key={q.id} className="fade-in max-w-[calc(72ch+80px)] px-4 pt-5 pb-10 sm:px-10 sm:pt-7">
            <div className="mb-3 flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span className="font-mono text-[13px] font-semibold text-ink num">Q{idx + 1}</span>
              {grouped && <SubjectChip subject={q.subject} />}
              {practice && <span className="caption text-muted">{q.chapter_name}</span>}
              {q.source_label && <span className="caption text-muted">· {q.source_label}</span>}
              {r.marked && (
                <span className="caption ml-auto inline-flex items-center gap-1 font-semibold text-marked">
                  <FlagIcon size={12} weight="fill" aria-hidden /> Marked for review
                </span>
              )}
            </div>
            <MdBlock text={q.stem} className="max-w-[72ch] text-question font-[450]" />
            <QuestionImages images={q.images} />

            <div role="group" aria-label="Options" className="mt-5 max-w-[72ch] space-y-2.5">
              {q.options.map((o, i) => (
                <OptionCard key={i} index={i} text={o} state={optState(i)} onSelect={select} locked={!!rv || closed} />
              ))}
            </div>

            {practice && (
              <div className="mt-4 max-w-[72ch]">
                {rv ? (
                  <RevealPanel rv={rv} choice={r.choice} onNext={isLast ? undefined : () => go(idx + 1)} />
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" className="btn btn-primary" onClick={() => void check()} disabled={checking || r.choice == null}>
                      {checking ? <Spinner /> : <CheckIcon size={16} weight="bold" aria-hidden />} Check answer
                    </button>
                    <span className="caption hidden text-muted sm:inline">
                      or press <Kbd>Enter</Kbd>
                    </span>
                    {checkErr && (
                      <span role="alert" className="text-label font-medium text-wrong">
                        {checkErr}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 max-w-[72ch]">
              <button type="button" className="caption text-muted underline-offset-[3px] hover:text-ink hover:underline" onClick={() => setReportOpen(true)}>
                Report a problem with this question
              </button>
            </div>
          </div>
        </main>

        {/* Palette rail */}
        <aside className="hidden w-[280px] shrink-0 flex-col border-l border-line bg-surface min-[700px]:flex" aria-label="Questions">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-4 pb-3">
            <Palette questions={questions} resp={resp} review={review} current={idx} onJump={go} grouped={grouped} practice={practice} />
          </div>
          <div className="border-t border-line px-5 py-3">
            <Legend c={c} practice={practice} />
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="flex h-12 shrink-0 items-center gap-1.5 border-t border-line bg-surface px-2 min-[700px]:h-14 min-[700px]:gap-2 min-[700px]:px-4">
        <button type="button" className="btn btn-secondary h-11 min-[700px]:h-10" onClick={() => go(idx - 1)} disabled={idx === 0} aria-label="Previous question">
          <ArrowLeftIcon size={16} aria-hidden />
          <span className="hidden min-[700px]:inline">Prev</span>
        </button>
        <button
          type="button"
          className={`btn h-11 min-[700px]:h-10 ${r.marked ? 'btn-secondary border-marked text-marked' : 'btn-ghost'}`}
          aria-pressed={r.marked}
          onClick={toggleMark}
        >
          {r.marked ? <FlagIcon size={16} weight="fill" aria-hidden /> : <FlagBannerIcon size={16} aria-hidden />}
          <span className="hidden min-[420px]:inline">{r.marked ? 'Marked' : 'Mark for review'}</span>
          <span className="sr-only min-[420px]:hidden">Mark for review</span>
        </button>
        <button
          type="button"
          className="btn btn-ghost h-11 min-[700px]:h-10"
          onClick={clear}
          disabled={r.choice == null || r.revealed}
          aria-label="Clear response"
        >
          <EraserIcon size={16} aria-hidden />
          <span className="hidden min-[560px]:inline">Clear</span>
        </button>
        <p className="caption hidden flex-1 items-center justify-center gap-3 text-muted lg:flex" aria-hidden>
          <span>
            <Kbd>1</Kbd>–<Kbd>4</Kbd> choose
          </span>
          <span>
            <Kbd>←</Kbd> <Kbd>→</Kbd> move
          </span>
          <span>
            <Kbd>M</Kbd> mark
          </span>
          <span>
            <Kbd>X</Kbd> clear
          </span>
          {practice && (
            <span>
              <Kbd>Enter</Kbd> check
            </span>
          )}
        </p>
        <div className="flex-1 lg:hidden" />
        {isLast ? (
          <button type="button" className="btn btn-primary h-11 min-w-28 min-[700px]:h-10" onClick={() => setConfirmOpen(true)}>
            Finish
          </button>
        ) : (
          <button type="button" className="btn btn-primary h-11 min-w-28 min-[700px]:h-10" onClick={() => go(idx + 1)}>
            Next <ArrowRightIcon size={16} aria-hidden />
          </button>
        )}
      </footer>

      <span className="sr-only" aria-live="polite">
        {say}
      </span>

      {/* Mobile palette drawer */}
      <Dialog open={paletteOpen} onClose={() => setPaletteOpen(false)} sheet title={`Question ${idx + 1} of ${N}`} labelledBy="pal-h">
        <Palette
          questions={questions}
          resp={resp}
          review={review}
          current={idx}
          onJump={(i) => {
            go(i)
            setPaletteOpen(false)
          }}
          grouped={grouped}
          practice={practice}
          touch
        />
        <div className="mt-4 border-t border-line pt-3">
          <Legend c={c} practice={practice} />
        </div>
      </Dialog>

      <SubmitDialog
        open={confirmOpen && submitting !== 'auto'}
        onClose={() => {
          setConfirmOpen(false)
          setSubmitErr(null)
        }}
        c={c}
        practice={practice}
        questionsLeft={questions
          .map((qq, i) => ({ i, r: resp[qq.id] }))
          .filter((x) => x.r.choice == null)
          .map((x) => x.i)}
        marked={questions.map((qq, i) => ({ i, r: resp[qq.id] })).filter((x) => x.r.marked).map((x) => x.i)}
        onJump={(i) => {
          go(i)
          setConfirmOpen(false)
        }}
        deadlineMs={deadlineMs}
        skewMs={skewMs}
        busy={submitting === 'manual'}
        error={submitErr}
        onSubmit={() => void finish('manual')}
        total={N}
      />

      <ReportDialog qid={q.id} label={`Q${idx + 1}${q.source_label ? ` · ${q.source_label}` : ''}`} open={reportOpen} onClose={() => setReportOpen(false)} />

      {submitting === 'auto' && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-paper/85 backdrop-blur-[2px]" role="alertdialog" aria-live="assertive" aria-label="Time is up">
          <div className="card w-[min(360px,calc(100vw-32px))] p-6 text-center">
            <p className="font-display text-h2">Time’s up</p>
            <p className="mt-2 text-muted">{submitErr ?? 'Saving your answers and submitting the test.'}</p>
            <div className="mt-4 flex justify-center">
              {submitErr ? (
                <button type="button" className="btn btn-primary" onClick={() => void finish('auto')}>
                  Try again
                </button>
              ) : (
                <Spinner className="h-5 w-5 text-accent" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-grid h-[18px] min-w-[18px] place-items-center rounded-[4px] border border-line-strong bg-paper px-1 font-mono text-[11px] leading-none text-muted">
      {children}
    </kbd>
  )
}

function SaveBadge({ status }: { status: SaveStatus }) {
  if (status === 'retrying')
    return (
      <span className="caption flex items-center gap-1.5 font-semibold text-warn" role="status">
        <CloudSlashIcon size={16} aria-hidden />
        <span className="hidden sm:inline">Offline — retrying</span>
        <span className="sr-only sm:hidden">Offline, retrying</span>
      </span>
    )
  if (status === 'idle') return <span className="hidden w-[52px] sm:block" />
  return (
    <span className="caption flex items-center gap-1.5 text-muted" role="status" aria-live="off">
      {status === 'saving' ? <Spinner className="h-3.5 w-3.5" /> : <CloudCheckIcon size={16} aria-hidden />}
      <span className="hidden sm:inline">{status === 'saving' ? 'Saving' : 'Saved'}</span>
    </span>
  )
}

function RevealPanel({ rv, choice, onNext }: { rv: ReviewItem; choice: number | null; onNext?: () => void }) {
  const acc = rv.accepted?.length ? rv.accepted : [rv.answer]
  const bonus = acc.length === 4
  const right = rv.correct
  return (
    <div
      className={`rise-in flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[10px] border px-4 py-3 ${
        right ? 'border-correct/40 bg-correct-tint' : 'border-wrong/40 bg-wrong-tint'
      }`}
    >
      {right ? (
        <CheckCircleIcon size={22} weight="fill" className="shrink-0 text-correct" aria-hidden />
      ) : (
        <XCircleIcon size={22} weight="fill" className="shrink-0 text-wrong" aria-hidden />
      )}
      <p className="min-w-0 flex-1">
        {bonus ? (
          <>
            <span className="font-semibold">Bonus question.</span> Every option earns the mark.
          </>
        ) : right ? (
          <>
            <span className="font-semibold">Correct.</span> {LETTERS[choice ?? rv.answer]} is the answer
            {acc.length > 1 ? ` (${acc.map((a) => LETTERS[a]).join(' or ')} accepted)` : ''}.
          </>
        ) : (
          <>
            <span className="font-semibold">Not this one.</span> The answer is {acc.map((a) => LETTERS[a]).join(' or ')}
            {choice != null ? `; you chose ${LETTERS[choice]}` : ''}.
          </>
        )}
      </p>
      {onNext && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onNext}>
          Next question <ArrowRightIcon size={14} aria-hidden />
        </button>
      )}
    </div>
  )
}

function SubmitDialog({
  open,
  onClose,
  c,
  practice,
  questionsLeft,
  marked,
  onJump,
  deadlineMs,
  skewMs,
  busy,
  error,
  onSubmit,
  total,
}: {
  open: boolean
  onClose: () => void
  c: ReturnType<typeof counts>
  practice: boolean
  questionsLeft: number[]
  marked: number[]
  onJump: (i: number) => void
  deadlineMs: number
  skewMs: number
  busy: boolean
  error: string | null
  onSubmit: () => void
  total: number
}) {
  const left = deadlineMs ? Math.max(0, Math.floor((deadlineMs - (Date.now() + skewMs)) / 1000)) : null
  return (
    <Dialog
      open={open}
      onClose={busy ? () => {} : onClose}
      title="Submit this test?"
      labelledBy="submit-h"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy} data-autofocus>
            Keep working
          </button>
          <button type="button" className="btn btn-primary" onClick={onSubmit} disabled={busy}>
            {busy && <Spinner />} {busy ? 'Submitting' : 'Submit test'}
          </button>
        </>
      }
    >
      <dl className="grid grid-cols-3 gap-2">
        {[
          { k: 'Answered', v: c.answered },
          { k: 'Not answered', v: c.unanswered },
          { k: 'Marked', v: c.marked },
        ].map((x) => (
          <div key={x.k} className="rounded-[10px] border border-line bg-paper px-3 py-2.5">
            <dt className="caption text-muted">{x.k}</dt>
            <dd className="font-display text-stat font-semibold num">{x.v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-label font-normal text-muted">
        {c.unanswered
          ? `${plural(c.unanswered, 'question')} of ${total} still blank — there’s no negative marking, so a guess can only help.`
          : `All ${total} answered.`}
        {left != null && ` ${clock(left)} left on the clock.`}
        {practice && ` ${c.correct} correct so far.`}
      </p>
      <Jumps list={questionsLeft} label="Not answered" onJump={onJump} />
      <Jumps list={marked} label="Marked for review" onJump={onJump} />
      {error && (
        <p role="alert" className="mt-4 flex items-start gap-2 text-label font-medium text-wrong">
          <WarningIcon size={16} className="mt-px shrink-0" aria-hidden /> {error}
        </p>
      )}
    </Dialog>
  )
}

function Jumps({ list, label, onJump }: { list: number[]; label: string; onJump: (i: number) => void }) {
  if (!list.length) return null
  return (
    <div className="mt-4">
      <p className="label mb-2 text-muted">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {list.slice(0, 24).map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => onJump(i)}
            className="h-8 min-w-8 rounded-[7px] border border-line-strong px-1.5 font-mono text-[12px] num hover:border-accent/60 hover:bg-raised"
            aria-label={`Go to question ${i + 1}`}
          >
            {i + 1}
          </button>
        ))}
        {list.length > 24 && <span className="caption self-center text-muted">+{list.length - 24} more</span>}
      </div>
    </div>
  )
}
