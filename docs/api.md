# API (Go server, same origin, JSON, cookie session)

All `/api/*` except login return 401 `{"error"}` when not logged in. Errors: `{"error": "human readable message"}`.

## Auth
- `POST /api/signup` `{username, password}` → 201 `User {id, name}` (sets HttpOnly cookie). 409 name taken, 400 bad name / password < 6 chars, 429 too many tries.
- `POST /api/login` `{username, password}` → `User {id, name}` (sets cookie). 401 wrong name or password, 429 too many tries.
- `POST /api/logout` → `{ok}`
- `GET /api/me` → `User`

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

## Static
`/img/<name>` question images (auth required). Everything else: SPA (`index.html` fallback). `robots.txt` disallows all.
