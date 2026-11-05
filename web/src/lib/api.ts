import { track } from './analytics'
import type { AdminOverview, AdminStudentDetail, Attempt, WithRecovery, AttemptDetail, CreateAttemptInput, Meta, ReviewItem, Stats, User } from './types'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/** True for failures worth retrying: no network, gateway trouble, server hiccups. */
export function isTransient(err: unknown): boolean {
  if (!(err instanceof ApiError)) return true
  return err.status === 0 || err.status === 408 || err.status === 429 || err.status >= 500
}

let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn
}

async function request<T>(method: string, path: string, body?: unknown, opts: { keepalive?: boolean } = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      keepalive: opts.keepalive,
    })
  } catch {
    throw new ApiError(0, 'Can’t reach the server. Check your connection.')
  }
  const text = await res.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }
  if (!res.ok) {
    const msg =
      data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : res.status >= 500
          ? 'The server had a problem. Try again in a moment.'
          : `Request failed (${res.status}).`
    if (res.status === 401 && path !== '/api/login' && path !== '/api/signup' && path !== '/api/reset' && onUnauthorized) onUnauthorized()
    throw new ApiError(res.status, msg)
  }
  return data as T
}

/** Run a side effect (analytics) on success and pass the value through. */
const tap =
  <T,>(fn: (v: T) => void) =>
  (v: T) => {
    try {
      fn(v)
    } catch {
      /* analytics must never break the app */
    }
    return v
  }

export const api = {
  me: () => request<User>('GET', '/api/me'),
  login: (username: string, password: string) =>
    request<User>('POST', '/api/login', { username, password }).then(tap(() => track('logged_in'))),
  signup: (username: string, password: string, analytics: boolean) =>
    request<WithRecovery>('POST', '/api/signup', { username, password, analytics }).then(
      tap(() => track('signup_completed', { analytics_consent: analytics })),
    ),
  reset: (username: string, code: string, password: string) =>
    request<WithRecovery>('POST', '/api/reset', { username, code, password }).then(tap(() => track('password_reset_with_code'))),
  newRecovery: (current: string) =>
    request<{ recovery_code: string }>('POST', '/api/account/recovery', { current }).then(tap(() => track('recovery_code_made'))),
  setAnalytics: (allow: boolean) => request<{ ok: boolean }>('POST', '/api/account/analytics', { allow }),
  logout: () => request<{ ok: boolean }>('POST', '/api/logout'),
  changePassword: (current: string, password: string) =>
    request<{ ok: boolean }>('POST', '/api/account/password', { current, password }).then(tap(() => track('password_changed'))),
  meta: () => request<Meta>('GET', '/api/meta'),
  stats: () => request<Stats>('GET', '/api/stats'),
  adminOverview: () => request<AdminOverview>('GET', '/api/admin/overview'),
  adminNewRecovery: (id: number) =>
    request<{ name: string; recovery_code: string }>('POST', `/api/admin/students/${id}/recovery`),
  adminStudent: (id: string) => request<AdminStudentDetail>('GET', `/api/admin/students/${encodeURIComponent(id)}`),
  attempts: () => request<Attempt[]>('GET', '/api/attempts'),
  attempt: (id: string) => request<AttemptDetail>('GET', `/api/attempts/${encodeURIComponent(id)}`),
  createAttempt: (input: CreateAttemptInput) =>
    request<{ id: string }>('POST', '/api/attempts', input).then(
      tap(() =>
        track('test_started', {
          mode: input.mode,
          subject: input.subject ?? 'all',
          count: input.count,
          chapters: input.chapters?.length ?? 0,
          paper: input.paper,
          practice: input.practice,
          timed: input.timed,
          include_out_of_syllabus: input.include_oos,
        }),
      ),
    ),
  discard: (id: string) => request<{ ok: boolean }>('DELETE', `/api/attempts/${encodeURIComponent(id)}`),
  saveResponse: (
    id: string,
    qid: string,
    body: { choice: number | null; marked: boolean; time_ms: number },
    keepalive = false,
  ) =>
    request<{ ok: boolean }>(
      'PUT',
      `/api/attempts/${encodeURIComponent(id)}/responses/${encodeURIComponent(qid)}`,
      body,
      { keepalive },
    ),
  reveal: (id: string, qid: string, body: { choice: number; time_ms: number }) =>
    request<ReviewItem>('POST', `/api/attempts/${encodeURIComponent(id)}/reveal/${encodeURIComponent(qid)}`, body),
  submit: (id: string) =>
    request<Attempt>('POST', `/api/attempts/${encodeURIComponent(id)}/submit`).then(
      tap((a) =>
        track('test_submitted', {
          mode: a.mode,
          subject: a.subject,
          practice: a.practice,
          score: a.score,
          total: a.total,
          percent: a.total ? Math.round(((a.score ?? 0) / a.total) * 100) : null,
          minutes: a.submitted_at ? Math.round((a.submitted_at - a.started_at) / 60) : null,
        }),
      ),
    ),
  report: (qid: string, note: string) =>
    request<{ ok: boolean }>('POST', '/api/reports', { qid, note }).then(tap(() => track('question_reported', { qid }))),
}
