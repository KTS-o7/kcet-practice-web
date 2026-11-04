import { ClockIcon, HourglassMediumIcon } from '@phosphor-icons/react'
import { memo, useEffect, useRef, useState } from 'react'
import { clock } from '../../lib/format'

/**
 * Countdown from a server deadline (corrected for clock skew), or elapsed time when untimed.
 * Lives in its own component so the per-second tick never re-renders the question.
 */
export const Timer = memo(function Timer({
  deadlineMs,
  startedMs,
  skewMs,
  onExpire,
}: {
  deadlineMs: number
  startedMs: number
  skewMs: number
  onExpire: () => void
}) {
  const serverNow = () => Date.now() + skewMs
  const [now, setNow] = useState(serverNow)
  const [pulse, setPulse] = useState(0)
  const [say, setSay] = useState('')
  const prev = useRef<number | null>(null)
  const expired = useRef(false)
  const expireRef = useRef(onExpire)
  expireRef.current = onExpire

  useEffect(() => {
    let last = -1
    const id = window.setInterval(() => {
      const n = Date.now() + skewMs
      const sec = Math.floor(n / 1000)
      if (sec !== last) {
        last = sec
        setNow(n)
      }
    }, 200)
    return () => window.clearInterval(id)
  }, [skewMs])

  const timed = deadlineMs > 0
  const remaining = timed ? Math.ceil((deadlineMs - now) / 1000) : 0

  useEffect(() => {
    if (!timed) return
    const p = prev.current
    prev.current = remaining
    if (p != null) {
      for (const mark of [300, 60]) {
        if (p > mark && remaining <= mark) {
          setPulse((x) => x + 1)
          setSay(mark === 300 ? '5 minutes left' : '1 minute left')
        }
      }
    }
    if (remaining <= 0 && !expired.current) {
      expired.current = true
      expireRef.current()
    }
  }, [remaining, timed])

  if (!timed) {
    const elapsed = (now - startedMs) / 1000
    return (
      <div className="flex items-center gap-2 text-muted" title="Untimed — time since you started">
        <HourglassMediumIcon size={16} aria-hidden />
        <span className="font-mono text-[18px] font-semibold num text-ink">{clock(elapsed)}</span>
        <span className="caption hidden sm:inline">elapsed</span>
      </div>
    )
  }

  const warn = remaining <= 300
  return (
    <div className="relative">
      <div
        role="timer"
        aria-label={`Time left ${clock(remaining)}`}
        className={`relative flex h-8 items-center gap-1.5 rounded-full border px-3 transition-colors duration-200 ${
          warn ? 'border-warn text-warn' : 'border-transparent text-ink'
        }`}
      >
        {warn && <ClockIcon size={16} weight="bold" aria-hidden />}
        <span className="font-mono text-[18px] leading-none font-semibold num">{clock(remaining)}</span>
        {pulse > 0 && (
          <span
            key={pulse}
            aria-hidden
            className="timer-pulse pointer-events-none absolute inset-0 rounded-full border-2 border-warn"
          />
        )}
      </div>
      <span className="sr-only" aria-live="assertive">
        {say}
      </span>
    </div>
  )
})
