import { useCallback, useEffect, useRef, useState } from 'react'
import { api, ApiError, isTransient } from './api'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'retrying'
type Payload = { choice: number | null; marked: boolean; time_ms: number }

/**
 * Per-question autosave. Payloads are built at send time, so a retry always carries the latest state.
 * Batches run one at a time, so two PUTs for the same question never race.
 */
export function useAutosave(attemptId: string, build: (qid: string) => Payload, onClosed: () => void) {
  const pending = useRef(new Set<string>())
  const inflight = useRef<Promise<void> | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const delay = useRef(2000)
  const buildRef = useRef(build)
  const closedRef = useRef(onClosed)
  buildRef.current = build
  closedRef.current = onClosed
  const [status, setStatus] = useState<SaveStatus>('idle')

  const runRef = useRef<() => Promise<void>>(async () => {})

  const schedule = useCallback((ms: number) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => void runRef.current(), ms)
  }, [])

  runRef.current = async () => {
    if (inflight.current) {
      await inflight.current
      if (pending.current.size) return runRef.current()
      return
    }
    if (!pending.current.size) return
    window.clearTimeout(timer.current)
    const batch = [...pending.current]
    pending.current.clear()
    setStatus('saving')
    const job = (async () => {
      const results = await Promise.allSettled(batch.map((qid) => api.saveResponse(attemptId, qid, buildRef.current(qid))))
      let failed = false
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') return
        const err = r.reason
        if (err instanceof ApiError && err.status === 409) {
          closedRef.current()
          return
        }
        if (isTransient(err)) {
          pending.current.add(batch[i])
          failed = true
        }
        // 400/404: nothing useful to retry
      })
      if (failed) {
        setStatus('retrying')
        schedule(delay.current)
        delay.current = Math.min(delay.current * 2, 20_000)
      } else {
        delay.current = 2000
        if (pending.current.size) schedule(300)
        else setStatus('saved')
      }
    })()
    inflight.current = job
    try {
      await job
    } finally {
      inflight.current = null
    }
  }

  const queue = useCallback(
    (qid: string, ms = 450) => {
      pending.current.add(qid)
      schedule(ms)
    },
    [schedule],
  )

  /** Send everything now. Resolves true once nothing is left unsaved. */
  const flush = useCallback(async (): Promise<boolean> => {
    for (let i = 0; i < 3; i++) {
      await runRef.current()
      if (inflight.current) await inflight.current
      if (!pending.current.size) return true
      await new Promise((r) => setTimeout(r, 600))
    }
    return pending.current.size === 0
  }, [])

  /** Last-ditch save when the tab is closing: fire-and-forget keepalive requests. */
  const beacon = useCallback(() => {
    for (const qid of pending.current) {
      void api.saveResponse(attemptId, qid, buildRef.current(qid), true).catch(() => {})
    }
  }, [attemptId])

  useEffect(() => {
    const online = () => {
      delay.current = 2000
      if (pending.current.size) schedule(0)
    }
    window.addEventListener('online', online)
    return () => {
      window.removeEventListener('online', online)
      window.clearTimeout(timer.current)
    }
  }, [schedule])

  const hasPending = useCallback(() => pending.current.size > 0 || inflight.current != null, [])

  return { status, queue, flush, beacon, hasPending }
}
