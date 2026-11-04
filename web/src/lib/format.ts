import type { Attempt, AttemptSubject, Mode, SubjectId } from './types'

export const SUBJECTS: SubjectId[] = ['physics', 'chemistry', 'mathematics']

export const subjectName: Record<AttemptSubject, string> = {
  physics: 'Physics',
  chemistry: 'Chemistry',
  mathematics: 'Mathematics',
  all: 'Full KCET',
}

export const subjectShort: Record<AttemptSubject, string> = {
  physics: 'Phy',
  chemistry: 'Chem',
  mathematics: 'Maths',
  all: 'KCET',
}

export const modeName: Record<Mode, string> = {
  mock: 'Full mock',
  full: 'Full KCET',
  quick: 'Quick set',
  chapter: 'Chapter-wise',
  year: 'Year-wise',
}

export function isSubject(s: string | undefined): s is SubjectId {
  return s === 'physics' || s === 'chemistry' || s === 'mathematics'
}

export const LETTERS = ['A', 'B', 'C', 'D'] as const

/** mm:ss up to 99:59 (a 70-minute paper reads 69:59), h:mm:ss beyond. */
export function clock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const sec = String(s % 60).padStart(2, '0')
  if (s < 100 * 60) return `${String(Math.floor(s / 60)).padStart(2, '0')}:${sec}`
  const h = Math.floor(s / 3600)
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  return `${h}:${m}:${sec}`
}

/** "1 h 20 min", "12 min", "45 s" */
export function duration(ms: number): string {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s} s`
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return rm ? `${h} h ${rm} min` : `${h} h`
}

/** Short per-question time: "48 s", "2 m 05 s" */
export function qtime(ms: number): string {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s} s`
  return `${Math.floor(s / 60)} m ${String(s % 60).padStart(2, '0')} s`
}

export function minutesLabel(seconds: number): string {
  if (seconds <= 0) return 'Untimed'
  const m = Math.round(seconds / 60)
  if (m < 120) return `${m} min`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return rm ? `${h} h ${rm} min` : `${h} h`
}

export function pct(n: number, d: number): number | null {
  if (!d) return null
  return Math.round((n / d) * 100)
}

const dayFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' })
const dayYearFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
const timeFmt = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' })
const longDayFmt = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

export function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/** "Today, 7:40 pm" / "Yesterday" / "3 Nov" */
export function relDay(unix: number, withTime = false): string {
  const d = new Date(unix * 1000)
  const today = startOfDay(new Date())
  const diff = Math.round((today - startOfDay(d)) / 86_400_000)
  const t = withTime ? `, ${timeFmt.format(d).toLowerCase()}` : ''
  if (diff === 0) return `Today${t}`
  if (diff === 1) return `Yesterday${t}`
  if (d.getFullYear() !== new Date().getFullYear()) return dayYearFmt.format(d)
  return dayFmt.format(d) + t
}

export function longToday(): string {
  return longDayFmt.format(new Date())
}

export function shortDate(d: Date): string {
  return dayFmt.format(d)
}

export function dateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Late night'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function plural(n: number, one: string, many = one + 's'): string {
  return `${n} ${n === 1 ? one : many}`
}

/** Unfinished = not submitted and either untimed or still before the deadline. */
export function isLive(a: Attempt, nowS = Date.now() / 1000): boolean {
  return a.submitted_at == null && (a.duration_s === 0 || a.started_at + a.duration_s > nowS)
}

export function attemptMeta(a: Attempt): string {
  const parts: string[] = [modeName[a.mode]]
  parts.push(a.practice ? 'Practice' : 'Exam')
  return parts.join(' · ')
}

/** Setup URL that recreates a similar attempt. */
export function retakeHref(a: Attempt, chapters?: string[]): string {
  const p = new URLSearchParams()
  p.set('mode', a.mode)
  if (a.practice) p.set('practice', '1')
  if (a.mode === 'quick' || a.mode === 'chapter') p.set('count', String(a.total))
  if (chapters?.length) p.set('chapters', chapters.join(','))
  const subject = a.subject === 'all' || a.mode === 'full' ? 'all' : a.subject
  return `/practice/${subject}?${p.toString()}`
}
