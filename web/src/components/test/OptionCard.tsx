import { CheckIcon, XIcon } from '@phosphor-icons/react'
import { memo } from 'react'
import { LETTERS } from '../../lib/format'
import { MdInline } from '../Md'

export type OptionState = 'idle' | 'selected' | 'correct' | 'correct-picked' | 'wrong-picked' | 'dim'

const box: Record<OptionState, string> = {
  idle: 'border-line-strong bg-surface hover:border-accent/50 hover:bg-raised',
  selected: 'border-accent bg-accent-tint shadow-[inset_0_0_0_0.5px_var(--color-accent)]',
  correct: 'border-correct bg-correct-tint shadow-[inset_0_0_0_0.5px_var(--color-correct)]',
  'correct-picked': 'border-correct bg-correct-tint shadow-[inset_0_0_0_0.5px_var(--color-correct)]',
  'wrong-picked': 'border-wrong bg-wrong-tint shadow-[inset_0_0_0_0.5px_var(--color-wrong)]',
  dim: 'border-line bg-surface',
}
const badge: Record<OptionState, string> = {
  idle: 'border-line-strong text-muted bg-paper',
  selected: 'border-accent bg-accent text-on-accent',
  correct: 'border-correct bg-correct text-surface',
  'correct-picked': 'border-correct bg-correct text-surface',
  'wrong-picked': 'border-wrong bg-wrong text-surface',
  dim: 'border-line text-muted bg-paper',
}

export const OptionCard = memo(function OptionCard({
  index,
  text,
  state,
  onSelect,
  locked,
  compact = false,
}: {
  index: number
  text: string
  state: OptionState
  onSelect?: (i: number) => void
  locked?: boolean
  compact?: boolean
}) {
  const label =
    state === 'correct'
      ? 'Correct answer'
      : state === 'correct-picked'
        ? 'Your answer · Correct'
        : state === 'wrong-picked'
          ? 'Your answer'
          : null
  const Icon = state === 'wrong-picked' ? XIcon : state === 'correct' || state === 'correct-picked' ? CheckIcon : null
  const tone = state === 'wrong-picked' ? 'text-wrong' : 'text-correct'
  const interactive = !!onSelect && !locked

  return (
    <button
      type="button"
      data-option={index}
      aria-pressed={state === 'selected' || state === 'correct-picked' || state === 'wrong-picked'}
      aria-disabled={!interactive || undefined}
      onClick={interactive ? () => onSelect(index) : undefined}
      className={`group flex w-full items-start gap-3.5 rounded-[10px] border text-left transition-[background-color,border-color,box-shadow] duration-[120ms] ease-k ${
        compact ? 'min-h-12 px-3.5 py-2.5' : 'min-h-14 px-4 py-3.5'
      } ${box[state]} ${interactive ? '' : 'cursor-default'} ${state === 'dim' ? 'opacity-75' : ''}`}
    >
      <span
        aria-hidden
        className={`mt-px grid h-7 w-7 shrink-0 place-items-center rounded-[7px] border font-mono text-[13px] font-semibold transition-colors duration-[120ms] ${badge[state]}`}
      >
        {LETTERS[index]}
      </span>
      <span className="sr-only">Option {LETTERS[index]}: </span>
      <MdInline text={text} className="min-w-0 flex-1 self-center text-option font-[450] [overflow-wrap:anywhere]" />
      {label && Icon && (
        <span className={`flex shrink-0 items-center gap-1 self-center text-label ${tone}`}>
          <Icon size={16} weight="bold" aria-hidden />
          {label}
        </span>
      )}
    </button>
  )
})
