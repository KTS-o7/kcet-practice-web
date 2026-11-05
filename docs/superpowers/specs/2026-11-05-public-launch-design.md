# Public launch: free KCET practice for everyone

Date: 2026-11-05. Builds on `2026-11-04-kcet-practice-design.md`.

## Why

The site was built for one student. He started using it on 2026-11-05. Krishna now wants to offer it free to every KCET aspirant and share it on Reddit (r/KCET and similar). To do that we need to know whether people come, sign up and keep practising, and the site must be ready for strangers.

## Decided by Krishna

- The site becomes a free public platform. No payments, no ads.
- The Examon bank stays. Examon told Krishna they no longer maintain examon.co and that we are free to use their questions and features where relevant. The site does not name or credit Examon for now; Krishna will agree with them how to credit them, and we add it after that.
- PostHog is used for product analytics.
- There is an owner dashboard for us.

## Goals

1. **Owner dashboard (`/admin`)**: sign-ups, activity, retention, and question health, from our own database.
2. **PostHog**: where visitors come from, and the funnel from landing page to sign-up to first test.
3. **Ready for the public**: a landing page, search engines can find the site, people can recover a forgotten password, and the sign-up form resists bots.

## Non-goals

- Email, phone, Google login, or any personal data beyond a username.
- Leaderboards, social features, discussion or comments.
- Explanations or solutions (as before).
- New question sources. Examon's other features are a separate, later discussion.

## Anti-goals (a failure even if it works)

- Any change that can lose or reset an existing student's progress. Migrations stay additive.
- Third-party tracking of what a logged-in student does (most users are 17; India's DPDP Act restricts behavioural monitoring of children).
- A slower site. The test screen must stay as fast as it is now.
- Questions or images readable without logging in. This keeps scrapers off and keeps progress per account.

## 1. Owner dashboard

**Access.** A new setting, `KCET_ADMINS`, holds a comma-separated list of account IDs in `/opt/kcet/.env` and is never in the repo. IDs, not usernames, because anyone can sign up and claim a listed name. `/api/admin/*` returns 404 for anyone else, so the page's existence isn't revealed. `/admin` is a page in the SPA that uses the same design as the rest of the site. It is read-only.

**Panels**, from one `GET /api/admin/overview` call:

| Panel | Contents |
|---|---|
| Today | sign-ups, active students, tests submitted, questions answered (today and the last 7 days) |
| Daily activity | active students and tests per day, last 30 days |
| Retention | for each sign-up week, % of students active in weeks 1, 2, 3 and 4 after sign-up |
| Usage mix | tests by mode (mock, quick, chapter, year, full) and by subject; practice vs timed |
| Hardest chapters | lowest average score, minimum 30 answers |
| Suspicious questions | questions with at least 8 answers where under 25% match our key and one other option has at least 50%. Each links to its ID so the key can be checked |
| Flagged by students | the `reports` table, newest first |
| Students | username, joined, last active, tests, average score; sortable |

"Active" means the student saved a response that day. That needs a timestamp on responses, so we add `responses.updated_at INTEGER` (additive and nullable; old rows count by their attempt's `started_at`).

## 2. PostHog

> **Changed 2026-11-05:** Krishna chose full tracking with consent, instead of cookieless-only. What shipped is described in `docs/analytics.md`.

- **Account:** PostHog Cloud, EU region, free tier. Krishna creates the project and gives me the project key. The key is public by design and goes in the frontend build.
- **What it records:** page views on public pages (landing, login, sign-up, about), the referrer and UTM tags (so each Reddit post can have its own link), and three events: `signup_started`, `signup_completed`, `first_test_started`.
- **Privacy settings:** cookieless mode, no person profiles, no session recording, no surveys, autocapture off, no usernames or user IDs sent. After login, nothing except `first_test_started` is sent.
- **Ad-blockers:** requests go through our own domain (`/ingest/` proxied by nginx to PostHog). The CSP stays `connect-src 'self'`. The nginx change lives in the private infra repo.
- **Retention numbers come from `/admin`, not PostHog.** Cookieless mode can't follow a visitor across days, and that is the point.

## 3. Ready for the public

- **Landing page at `/` for logged-out visitors.** It covers what the site is, what's inside (counts by subject and by kind: past KCET papers, NCERT Exemplar, NEET, practice bank; no third-party names), how questions are checked (official keys plus a blind solver), the mock format, sign-up and log-in buttons, and credits. Logged-in students still land on Home.
- **About / credits page:** sources (KEA, NCERT, NTA; Examon is added only after Krishna agrees the wording with them), how we verify, a contact address for corrections, and a short plain-language privacy note.
- **Search engines:** `robots.txt` allows `/`, `/about` and `/login`, and disallows everything else. `X-Robots-Tag: noindex` is dropped for those pages only. A title, description and Open Graph image so Reddit link previews look good.
- **Password recovery without email:**
  - At sign-up, show a one-time 12-character recovery code with "save this" and a copy button, and require ticking "I saved it" before continuing. It is stored bcrypt-hashed in a new `users.recovery_hash` column.
  - `POST /api/reset` takes name, code and new password, then issues a new code. It shares the same per-IP rate limit.
  - Existing accounts (Nish) can generate a code from a new Account page.
  - **Note:** today Nish has no recovery code until he visits Account.
- **Bot protection:** Cloudflare Turnstile on sign-up and reset. The site key goes in the frontend. The secret goes in `/opt/kcet/.env` as `TURNSTILE_SECRET`, and the server verifies it. CSP adds `challenges.cloudflare.com` to `script-src` and `frame-src`.
- **Rate limits:** many Indian users share one IPv4 address (Jio and Airtel CGNAT, hostels). Sign-ups get their own limit: 30 per IP per hour, with Turnstile as the real gate. Failed logins stay at 8 per 15 minutes, keyed on IP plus username, so one shared IP can't lock everyone out.
- **Report spam:** at most 20 reports per user per day.
- **Capacity:** the site is one Go program with SQLite (WAL) behind Cloudflare and serves static files from memory. That is enough for a Reddit spike, so the design doesn't change. The dashboard query runs on demand and only for admins.

## Order of work

1. Database additions (`responses.updated_at`, `users.recovery_hash`) and the admin API and page.
2. Recovery codes, the Account page, Turnstile and the rate-limit changes.
3. The landing and About pages, robots and indexing, and link previews.
4. PostHog, including the nginx `/ingest/` proxy in the infra repo.
5. Deploy: the binary only, as always. Back up the database first. Check `/healthz`, Nish's account and his history.

## Needed from Krishna

- PostHog project key (EU Cloud), or permission for me to create the project in the browser.
- Turnstile site and secret keys. I can create them in the logged-in Cloudflare dashboard if allowed.
- A contact email or link for the About page.
- Whether to require an "I'm 18+ or have a parent's permission" checkbox at sign-up. This is a legal judgement under DPDP. Without it, the design still collects only a username.

## Left to the builder

- Exact copy, layout and the landing-page illustration, within the Kaagada design (`docs/design.md`).
- The chart style for dashboard panels.
- The recovery-code alphabet (no ambiguous characters such as 0/O or 1/l).
