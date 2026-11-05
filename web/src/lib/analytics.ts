import type { PostHog } from 'posthog-js'
import type { User } from './types'

/*
 * Usage analytics with PostHog (EU cloud), sent through /ingest on our own server.
 *
 * - Logged-out visitors: tracked with PostHog's cookie (where they came from, the sign-up funnel).
 * - Logged in: only if the student allowed it (sign-up checkbox, Account page, or the one-time question
 *   on Home). They're identified by an opaque analytics id, never their name or account id.
 * - No session recordings, no surveys.
 *
 * Only runs on the live site, or in a build with VITE_ANALYTICS=1 (for testing).
 */

const KEY = 'phc_zKoMgcCqU5reXj7gUxwPHA87nA5jP45T9pz3hkDmCQmY' // public project key (safe to ship; PostHog EU)
const enabled = import.meta.env.VITE_ANALYTICS === '1' || location.hostname === 'kcet.shenthar.me'

let ph: PostHog | null = null
let allowed = false // logged out, or logged in with consent
let loading: Promise<PostHog | null> | null = null
const queue: ((p: PostHog) => void)[] = []

function load(): Promise<PostHog | null> {
  if (!enabled) return Promise.resolve(null)
  loading ??= import('posthog-js').then(({ default: posthog }) => {
    posthog.init(KEY, {
      api_host: '/ingest',
      ui_host: 'https://eu.posthog.com',
      defaults: '2025-05-24',
      persistence: 'localStorage+cookie',
      person_profiles: 'identified_only',
      autocapture: true,
      capture_pageview: 'history_change',
      capture_pageleave: true,
      disable_session_recording: true,
      disable_surveys: true,
    })
    ph = posthog
    queue.splice(0).forEach((fn) => fn(posthog))
    return posthog
  })
  return loading
}

function withPh(fn: (p: PostHog) => void) {
  if (!enabled) return
  if (ph) fn(ph)
  else {
    queue.push(fn)
    void load()
  }
}

export function track(event: string, props?: Record<string, unknown>) {
  if (allowed) withPh((p) => p.capture(event, props))
}

let lastSynced: string | null = null

/**
 * Called once we know who's here (and whenever /api/me changes). PostHog only loads when allowed:
 * logged out, or logged in with consent. For a student who hasn't allowed it, it isn't loaded at all
 * (or, if it already is, it stops capturing), so nothing leaks before their choice is known.
 */
export function syncAnalyticsUser(user: User | null | undefined) {
  const key = user ? `${user.id}:${user.analytics}` : 'out'
  if (key === lastSynced) return
  const wasIn = lastSynced !== null && lastSynced !== 'out'
  lastSynced = key
  allowed = !user || (user.analytics === true && !!user.analytics_id)
  if (!user) {
    withPh((p) => {
      if (wasIn) p.reset() // forget the link to the student who just logged out
      if (p.has_opted_out_capturing()) p.opt_in_capturing({ captureEventName: false })
    })
    return
  }
  if (user.analytics === true && user.analytics_id) {
    const id = user.analytics_id
    withPh((p) => {
      if (p.has_opted_out_capturing()) p.opt_in_capturing({ captureEventName: false })
      p.identify(id, { admin: !!user.admin })
    })
    return
  }
  // declined or not asked yet: never start PostHog for them; stop it if it's already running
  queue.length = 0
  ph?.opt_out_capturing()
}
