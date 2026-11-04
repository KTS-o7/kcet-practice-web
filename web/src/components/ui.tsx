import { ArrowClockwiseIcon, InfoIcon } from '@phosphor-icons/react'
import { useId, type ReactNode } from 'react'
import { subjectName, subjectShort } from '../lib/format'
import type { AttemptSubject } from '../lib/types'

export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <div aria-hidden className={`skeleton ${className}`} style={style} />
}

export function ErrorState({
  error,
  onRetry,
  title = 'Couldn’t load this.',
  className = '',
}: {
  error: unknown
  onRetry?: () => void
  title?: string
  className?: string
}) {
  const msg = error instanceof Error ? error.message : 'Something went wrong.'
  return (
    <div role="alert" className={`card flex flex-wrap items-center gap-4 p-5 ${className}`}>
      <InfoIcon size={22} className="shrink-0 text-muted" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p className="text-label font-normal text-muted">{msg}</p>
      </div>
      {onRetry && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
          <ArrowClockwiseIcon size={16} aria-hidden /> Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({
  title,
  children,
  action,
  className = '',
}: {
  title: string
  children?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-[14px] border border-dashed border-line-strong px-6 py-8 text-center ${className}`}>
      <p className="font-display text-h2 text-ink">{title}</p>
      {children && <div className="mx-auto mt-1.5 max-w-[46ch] text-muted">{children}</div>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

const subjectText: Record<AttemptSubject, string> = {
  physics: 'text-physics',
  chemistry: 'text-chemistry',
  mathematics: 'text-mathematics',
  all: 'text-accent',
}
const subjectBg: Record<AttemptSubject, string> = {
  physics: 'bg-physics',
  chemistry: 'bg-chemistry',
  mathematics: 'bg-mathematics',
  all: 'bg-accent',
}
export const subjectTextClass = (s: AttemptSubject) => subjectText[s]
export const subjectBgClass = (s: AttemptSubject) => subjectBg[s]

export function SubjectChip({ subject, short = false }: { subject: AttemptSubject; short?: boolean }) {
  return (
    <span className="chip">
      <span aria-hidden className={`h-2 w-2 rounded-full ${subjectBg[subject]}`} />
      <span className={short ? '' : ''}>{short ? subjectShort[subject] : subjectName[subject]}</span>
    </span>
  )
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  size = 'md',
  className = '',
}: {
  label: string
  value: T
  options: { value: T; label: ReactNode; disabled?: boolean }[]
  onChange: (v: T) => void
  size?: 'sm' | 'md'
  className?: string
}) {
  const h = size === 'sm' ? 'h-8 text-label' : 'h-10 text-body'
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`inline-flex rounded-[10px] border border-line bg-paper p-1 ${className}`}
      onKeyDown={(e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
        const enabled = options.filter((o) => !o.disabled)
        const i = enabled.findIndex((o) => o.value === value)
        const next = enabled[(i + (e.key === 'ArrowRight' ? 1 : enabled.length - 1)) % enabled.length]
        if (next) {
          e.preventDefault()
          onChange(next.value)
          const el = e.currentTarget.querySelector<HTMLButtonElement>(`[data-value="${next.value}"]`)
          el?.focus()
        }
      }}
    >
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            data-value={o.value}
            tabIndex={on ? 0 : -1}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={`${h} inline-flex flex-1 items-center justify-center gap-1.5 rounded-[7px] px-3.5 font-semibold whitespace-nowrap transition-[background-color,color,box-shadow] duration-150 ease-k disabled:opacity-45 ${
              on
                ? 'bg-surface text-ink shadow-[0_0_0_1px_var(--color-line-strong),0_1px_0_var(--color-line)]'
                : 'text-muted hover:text-ink'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
}) {
  const id = useId()
  return (
    <div className={`flex items-start justify-between gap-4 ${disabled ? 'opacity-60' : ''}`}>
      <div className="min-w-0">
        <label htmlFor={id} className="font-semibold">
          {label}
        </label>
        {description && (
          <p id={id + 'd'} className="text-label font-normal text-muted">
            {description}
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? id + 'd' : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-6 w-10 shrink-0 items-center rounded-full border transition-colors duration-150 ease-k ${
          checked ? 'border-accent bg-accent' : 'border-line-strong bg-paper'
        }`}
      >
        <span
          aria-hidden
          className={`absolute h-[18px] w-[18px] rounded-full transition-transform duration-150 ease-k ${
            checked ? 'translate-x-[18px] bg-on-accent' : 'translate-x-[2px] bg-line-strong'
          }`}
        />
      </button>
    </div>
  )
}

/** Thin horizontal meter. value 0..1 */
export function Meter({ value, className = '', tone = 'accent' }: { value: number; className?: string; tone?: 'accent' | 'correct' | 'muted' }) {
  const fill = tone === 'correct' ? 'bg-correct' : tone === 'muted' ? 'bg-muted' : 'bg-accent'
  return (
    <div aria-hidden className={`h-1.5 overflow-hidden rounded-full bg-line ${className}`}>
      <div className={`h-full rounded-full ${fill}`} style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  )
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={`h-4 w-4 animate-spin ${className}`}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="text-h1">{children}</h1>
      {sub && <p className="mt-1 text-muted">{sub}</p>}
    </div>
  )
}
