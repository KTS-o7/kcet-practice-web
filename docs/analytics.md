# Usage analytics (PostHog)

The project lives in PostHog's **EU cloud**. Its public project key is in `web/src/lib/analytics.ts`. It's meant to be public, so it's safe to ship in the frontend.

## What's tracked

| Who | Tracked | Linked to |
|---|---|---|
| Logged-out visitor (login and sign-up pages) | yes, with PostHog's cookie | an anonymous PostHog ID |
| Logged-in student who **allowed** analytics | yes: page views, clicks (autocapture), and the events below | an **opaque analytics ID** `s_…` |
| Logged-in student who declined, or hasn't answered yet | **nothing**; PostHog isn't even loaded | — |

- **The opaque ID** is a keyed hash (HMAC) of the account ID. It can't be turned back into the account ID or the name without the server secret. **Names are never sent.**
- **Session recordings and surveys are off.**
- **Events:**
  - `signup_completed` `{analytics_consent}`
  - `logged_in`
  - `test_started` `{mode, subject, count, chapters, paper, practice, timed, include_out_of_syllabus}`
  - `test_submitted` `{mode, subject, practice, score, total, percent, minutes}`
  - `question_reported` `{qid}`
  - `password_changed`
  - `password_reset_with_code`
  - `recovery_code_made`
- **Sign-out** resets PostHog, so the next visitor on that device starts with a new anonymous ID.

## Consent

- **At sign-up:** a checkbox, unticked by default: *"Help improve Kaagada: allow usage analytics while I'm logged in. My name is never sent. I'm 18 or older, or my parent or guardian agrees."*
- **Older accounts:** accounts made before this are asked once on Home (Allow / No thanks).
- **Any time:** the switch on the Account page changes it.
- **Storage:** the choice is saved in `users.analytics_consent` (`NULL` = not asked yet), so it follows the student across devices.
- **Disclosure:** a line under the login form says the site uses PostHog with cookies.

This is a practical consent step for a free site, not legal advice. India's DPDP rules on children's data apply from about 2027.

## How events reach PostHog

The browser sends everything to `/ingest/…` on this site. The Go server (`analytics.go`) forwards it:
- `/static/` and `/array/` go to `eu-assets.i.posthog.com`
- everything else goes to `eu.i.posthog.com`

While forwarding, it drops our cookies and sets `X-Forwarded-For` to the visitor's IP, so PostHog can tell visitors apart. Ad-blockers don't block a first-party path, the site's security headers (`connect-src 'self'`) stay strict, and **no nginx change is needed**.

PostHog only runs on `kcet.shenthar.me`. To test it locally, build with `VITE_ANALYTICS=1`. Headless test browsers are dropped as bots by posthog-js.

## In PostHog

- Settings → Project → **IP data capture**: discard. EU projects do this by default.
- **Web analytics:** visitors, referrers, UTM tags.
- **Reddit links:** give each Reddit post its own link, for example `https://kcet.shenthar.me/login?utm_source=reddit&utm_campaign=rkcet-launch`.
- **A useful funnel:** `$pageview` of `/login` → `signup_completed` → `test_started` → `test_submitted`.
- **Matching a person to a student:** each student's admin page doesn't show the `s_…` ID yet. Use `/api/admin/students/{id}` alongside PostHog's person view, or ask for it to be added.
