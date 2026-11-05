# API (Go server, same origin, JSON, cookie session)

All `/api/*` except login return 401 `{"error"}` when not logged in. Errors: `{"error": "human readable message"}`.

## Auth
- `POST /api/signup` `{username, password}` → 201 `User {id, name}` (sets HttpOnly cookie). 409 name taken, 400 bad name / password < 6 chars, 429 too many tries.
- `POST /api/login` `{username, password}` → `User {id, name}` (sets cookie). 401 wrong name or password, 429 too many tries.
- `POST /api/logout` → `{ok}`
- `GET /api/me` → `User & {admin: boolean}`
- `POST /api/signup` also returns `recovery_code` (shown once), and `GET /api/me` includes `has_recovery`.
- `POST /api/reset` `{username, code, password}` (not logged in) → `User & {recovery_code}`. Checks the one-time
  recovery code (any case, dashes optional). Sets the new password, issues a fresh code (the used one is spent), signs
  out every other device, and logs this one in. 401 `"Name or recovery code isn't right."`. Same per-IP limit and
  per-account lockout as login.
- `POST /api/account/recovery` `{current}` → `{recovery_code}`. Needs the current password (403 if wrong). Replaces
  the old code.
- `POST /api/account/password` `{current, password}` → `{ok}`. Needs the current password (403 if wrong, 400 if the new
  one isn't 6–72 characters). Bumps the account's session generation, which signs out every other device, and
  re-issues this device's cookie.

Limits: 8 failed logins or sign-ups per IP per 15 minutes (429). Separately, 10 wrong passwords for one account
name within an hour, from any IP, lock that name for 15 minutes after the last wrong try (429, even with the right
password). Unknown names are counted the same way, so the response doesn't reveal whether an account exists. Wrong
"current password" tries on `/api/account/password` count too. Counts are in memory and reset on restart.

Sessions: the cookie carries the account's session generation. Every authenticated request checks it against
`users.session_gen`, so a password change (or a deleted account) ends old logins. Cookies from before this existed
count as generation 0 and keep working until the first password change.

## Meta
`GET /api/meta` →
```ts
{
  subjects: { id: "physics"|"chemistry"|"mathematics", count: number /*in-syllabus verified*/, pyq: number,
              chapters: { id, name, class: 11|12, in_syllabus: boolean, count, pyq, out_of_syllabus }[] }[],
  papers: { id: string /*"kcet-2024-physics"*/, subject, year, name /*"KCET 2024"*/, count }[],  // newest first
  flagged: number
}
```

## Attempts
- `POST /api/attempts` →
  `{mode: "mock"|"full"|"quick"|"chapter"|"year", subject?, count?, chapters?: string[], paper?: string, practice: boolean, timed: boolean, include_oos: boolean}`
  → 201 `{id}`. 409 `{error}` if no questions.
  - mock: 60 Q, 70 min (practice && !timed → untimed). full: 180 Q (P,C,M in that order), 210 min.
  - quick: `count` Q at 1 min each (untimed if practice && !timed). chapter: needs `chapters`; timed only if `timed`.
  - year: `paper` id; the real paper in original order; 70 min unless practice && !timed.
- `GET /api/attempts` → `Attempt[]` (incl. `answered` count) newest first (expired ones are auto-submitted).
- `GET /api/attempts/{id}` →
```ts
{
  attempt: Attempt,
  questions: { id, subject, chapter, chapter_name, stem /*markdown + $latex$ / $$latex$$*/, options: string[4] /*same format*/,
               images: string[] /*served at /img/<name>*/, source_label /*"KCET 2024 · Q17"*/ }[],
  responses: { qid, choice: 0|1|2|3|null, marked: boolean, time_ms: number, revealed: boolean }[],
  review: Record<qid, { qid, answer: number, accepted: number[], correct: boolean }>,  // all Qs once submitted; revealed Qs in practice mode
  deadline: number /*unix s, 0 = untimed*/, now: number /*server unix s, use to correct clock skew*/
}
Attempt = { id, subject: "physics"|"chemistry"|"mathematics"|"all", mode, practice, title, duration_s, started_at, submitted_at: number|null, score: number|null, total }
```
- `DELETE /api/attempts/{id}` → discard an unsubmitted attempt.
- `PUT /api/attempts/{id}/responses/{qid}` `{choice: number|null, marked: boolean, time_ms: number /*cumulative on this question*/}` → `{ok}`. 409 after submit. Revealed answers can't change.
- `POST /api/attempts/{id}/reveal/{qid}` `{choice, time_ms}` (practice only) → `{qid, answer, accepted, correct}`; locks that answer.
- `POST /api/attempts/{id}/submit` → `Attempt` (with score). Server auto-submits once the deadline passes (10 s grace).

## Stats
`GET /api/stats` →
```ts
{
  subjects: Record<subject, { answered, correct, skipped, unique, time_ms }>,
  chapters: { subject, chapter, name, answered, correct, skipped, time_ms }[],
  attempts: Attempt[] /*submitted, newest first*/,
  days: Record<"YYYY-MM-DD", number /*questions answered*/>
}
```

## Reports
`POST /api/reports` `{qid, note}` → `{ok}` ("this question looks wrong").

## Admin (owner dashboard)
`GET /api/admin/overview` → everything the `/admin` page shows, computed on demand (days in IST):
`today`/`week` totals (sign-ups, active students, tests finished, questions answered), `days` (last 30),
`retention` (by sign-up week, % active in weeks 1–4 after joining; `null` until that week is over),
`modes`/`subjects`/`kinds` usage, `hardest` chapters (30+ answers), `suspects` (8+ students, under 25%
match our key, one other option ≥ 50%), `reports`, `students`.

`GET /api/admin/students/{id}` → `{student: {id, name, joined, last_active}, stats, tests}`: one student's
progress. `stats` has the same shape as `/api/stats`; `tests` is every test they started (finished or not), newest
first. 404 `"No such student."` for an unknown id.

`POST /api/admin/students/{id}/recovery` → `{name, recovery_code}`: a new code for a student who lost theirs. Their
old code stops working. It doesn't change their password or sign them out. Logged server-side.

Access: only account **ids** listed in `KCET_ADMINS` (comma-separated, in `/opt/kcet/.env`). Anyone else
gets 404; logged out gets 401. Ids, not names, because anyone can sign up and claim a listed name.
Take an id off the list before deleting that account (SQLite can hand the last id to the next sign-up).

## Static
`/img/<name>` question images (auth required). Everything else: SPA (`index.html` fallback). `robots.txt` disallows all.
