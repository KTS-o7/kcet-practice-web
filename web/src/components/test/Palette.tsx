import { CheckIcon, XIcon } from '@phosphor-icons/react'
import { memo } from 'react'
import { subjectName } from '../../lib/format'
import type { Question, ResponseRow, ReviewItem, SubjectId } from '../../lib/types'
import { subjectBgClass } from '../ui'

export interface Section {
  subject: SubjectId
  start: number
  end: number // exclusive
}

export function sectionsOf(questions: Question[]): Section[] {
  const out: Section[] = []
  questions.forEach((q, i) => {
    const last = out[out.length - 1]
    if (last && last.subject === q.subject) last.end = i + 1
    else out.push({ subject: q.subject, start: i, end: i + 1 })
  })
  return out
}

type Resp = Record<string, ResponseRow>

export function counts(questions: Question[], resp: Resp, review: Record<string, ReviewItem>) {
  let answered = 0
  let marked = 0
  let correct = 0
  let wrong = 0
  for (const q of questions) {
    const r = resp[q.id]
    if (r?.choice != null) answered++
    if (r?.marked) marked++
    const rv = review[q.id]
    if (rv && r?.revealed) {
      if (rv.correct) correct++
      else wrong++
    }
  }
  return { answered, marked, unanswered: questions.length - answered, correct, wrong }
}

export const Palette = memo(function Palette({
  questions,
  resp,
  review,
  current,
  onJump,
  grouped,
  practice,
  touch = false,
}: {
  questions: Question[]
  resp: Resp
  review: Record<string, ReviewItem>
  current: number
  onJump: (i: number) => void
  grouped: boolean
  practice: boolean
  touch?: boolean
}) {
  const sections = grouped ? sectionsOf(questions) : [{ subject: questions[0]?.subject, start: 0, end: questions.length } as Section]
  return (
    <nav aria-label="Question palette" className="space-y-4">
      {sections.map((s) => {
        const slice = questions.slice(s.start, s.end)
        const done = slice.filter((q) => resp[q.id]?.choice != null).length
        return (
          <div key={s.start}>
            {grouped && (
              <h3 className="sticky top-0 z-[1] -mx-1 mb-2 flex items-center gap-2 bg-surface px-1 py-1 font-sans text-label font-semibold tracking-[0.02em]">
                <span aria-hidden className={`h-2 w-2 rounded-full ${subjectBgClass(s.subject)}`} />
                {subjectName[s.subject]}
                <span className="ml-auto font-normal text-muted num">
                  {done}/{slice.length}
                </span>
              </h3>
            )}
            <div className={`pal-grid ${touch ? 'pal-touch' : ''}`}>
              {slice.map((q, k) => {
                const i = s.start + k
                const r = resp[q.id]
                const answered = r?.choice != null
                const rv = practice && r?.revealed ? review[q.id] : undefined
                const isCur = i === current
                const base = rv
                  ? rv.correct
                    ? 'bg-correct-tint text-correct'
                    : 'bg-wrong-tint text-wrong'
                  : answered
                    ? 'bg-accent-tint text-accent font-semibold'
                    : 'border-[1.5px] border-unans text-ink'
                const desc = [
                  `Question ${i + 1}`,
                  rv ? (rv.correct ? 'correct' : 'wrong') : answered ? 'answered' : 'not answered',
                  r?.marked ? 'marked for review' : '',
                ]
                  .filter(Boolean)
                  .join(', ')
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => onJump(i)}
                    aria-label={desc}
                    aria-current={isCur ? 'step' : undefined}
                    className={`pal-cell relative grid place-items-center overflow-hidden rounded-[8px] font-mono text-[13px] num transition-[background-color,color] duration-[120ms] ease-k hover:brightness-[0.97] ${base} ${
                      isCur ? 'shadow-[0_0_0_3px_var(--color-surface),0_0_0_5px_var(--color-ink)]' : ''
                    }`}
                  >
                    {i + 1}
                    {r?.marked && (
                      <span aria-hidden className="flag-corner absolute top-0 right-0 h-2.5 w-2.5 bg-marked" />
                    )}
                    {rv && (
                      <span aria-hidden className="absolute right-[3px] bottom-[2px]">
                        {rv.correct ? <CheckIcon size={9} weight="bold" /> : <XIcon size={9} weight="bold" />}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </nav>
  )
})

export function Legend({
  c,
  practice,
}: {
  c: ReturnType<typeof counts>
  practice: boolean
}) {
  const item = (swatch: React.ReactNode, label: string, n: number) => (
    <li className="flex items-center gap-2">
      {swatch}
      <span className="min-w-0 flex-1 whitespace-nowrap text-muted">{label}</span>
      <span className="pl-1 font-semibold num">{n}</span>
    </li>
  )
  return (
    <ul className="caption grid grid-cols-2 gap-x-3 gap-y-1.5" aria-label="Summary">
      {item(<span aria-hidden className="h-3.5 w-3.5 rounded-[4px] bg-accent-tint" />, 'Answered', c.answered)}
      {item(<span aria-hidden className="h-3.5 w-3.5 rounded-[4px] border-[1.5px] border-unans" />, 'Unanswered', c.unanswered)}
      {item(
        <span aria-hidden className="relative h-3.5 w-3.5 overflow-hidden rounded-[4px] border border-line-strong">
          <span className="flag-corner absolute top-0 right-0 h-2 w-2 bg-marked" />
        </span>,
        'Marked',
        c.marked,
      )}
      {practice &&
        item(
          <span aria-hidden className="grid h-3.5 w-3.5 place-items-center rounded-[4px] bg-correct-tint text-correct">
            <CheckIcon size={9} weight="bold" />
          </span>,
          'Correct',
          c.correct,
        )}
      {practice &&
        item(
          <span aria-hidden className="grid h-3.5 w-3.5 place-items-center rounded-[4px] bg-wrong-tint text-wrong">
            <XIcon size={9} weight="bold" />
          </span>,
          'Wrong',
          c.wrong,
        )}
    </ul>
  )
}
