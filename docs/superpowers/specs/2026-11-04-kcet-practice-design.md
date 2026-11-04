# KCET Practice — design

Date: 2026-11-04. Status: approved to build autonomously ("keep it fully autonomous").

## Intent
A private practice site for one student (class 12, writing KCET 2027, ~April 2027). He practises
Physics, Chemistry and Mathematics MCQs on a laptop. The question bank must be **100% correct**:
a wrong answer key teaches the wrong thing, which is worse than a missing question.

## Goals
- Every past KCET paper we can find (≈2008–2026) plus third-party banks, each question traceable to a source PDF kept in the repo.
- Modes: full subject mock (60 Q, 70 min — the real answering window), full KCET (180 Q, all three), quick set (N Q at 1 min/Q),
  chapter-wise, year-wise (the real paper in order). Exam mode (answers at the end) or practice mode (instant right/wrong).
- Test screen: question + options, timer, question palette with jump, mark for review, keyboard shortcuts.
- Results: score, per-question review with correct answer, time per question, weak chapters. Progress over time.
- Fast, beautiful, working. Laptop-first (1366×768 @125% must look right), usable on phone.

## Non-goals
Explanations/solutions, leaderboards, admin UI (fix by editing corpus files + redeploy), tests (personal project; user said no tests).

## Anti-goals
- Any question live with an unverified answer. Flagged questions are hidden until resolved.
- Search-engine indexing (site is private: `X-Robots-Tag: noindex`, robots.txt disallow, passcode gate).

## Decisions (user's)
Go server + React frontend, SQLite, self-hosted on the user's own VPS. Username login. Text + LaTeX
with diagram images. Out-of-syllabus questions tagged and hidden by default. Haiku subagents for cheap
extraction, Sonnet subagents to check; source PDFs live in the repo.

## Decisions (my calls)
- One Go binary (`net/http`, `modernc.org/sqlite`, CGO off) embedding the built SPA and the compiled corpus. systemd service behind nginx + Cloudflare (server details kept in a private infra repo); deploy script builds, ships, health-checks and rolls back (build → scp → restart → health check → rollback).
- Accounts: the student creates his own (name + password, bcrypt). Signed HttpOnly session cookie. Sign-up and login rate-limited per IP.
- Frontend: Vite + React + TypeScript, Tailwind, React Router, TanStack Query, KaTeX. Hand-built components in a calm, focused style; light/dark; one accent colour per subject.
- Nightly SQLite backup on the VPS (`sqlite3 .backup`, 14 days kept).

## Corpus format (contract for extraction and app)
`corpus/questions/<subject>/<source-id>.json` — array of:
```json
{
  "id": "pyq-2024-physics-017",
  "subject": "physics|chemistry|mathematics",
  "chapter": "<chapter id from corpus/chapters.json>",
  "source": {"type": "pyq|third-party", "name": "KCET 2024", "year": 2024, "version": "A1",
             "number": 17, "file": "sources/...pdf", "page": 3, "key_file": "sources/...pdf"},
  "stem": "Markdown with $inline$ / $$display$$ LaTeX",
  "options": ["A text", "B text", "C text", "D text"],
  "answer": 2,
  "accepted": [2],
  "images": ["pyq-2024-physics-017.png"],
  "status": "verified|flagged|dropped",
  "in_syllabus": true,
  "checks": {"extract_match": true, "key_sources": 2, "solver": "haiku|sonnet", "notes": ""}
}
```
`answer` is 0-based. `accepted` lists every option that earns the mark (all four for a KEA bonus question).
Images in `corpus/images/`. `corpus/chapters.json`: `{subject: [{id, name, class: 11|12}]}`.
`corpus/review.md`: questions still flagged after Sonnet, for the user.

## Verification pipeline (per paper / source file)
1. Render pages to PNG (`pdftoppm -r 150`) + `pdftotext -layout`.
2. **Extract A** (Haiku): page images + text → questions JSON. **Extract B** (Haiku, independent) → same.
   Normalised diff; any mismatch → **Sonnet** reads the page image and decides.
3. **Key**: parse the answer key file(s) into a number→option map. Two keys disagree → Sonnet + flag.
4. **Blind solve** (Haiku, no key). Agrees with key → verified. Disagrees → **Sonnet** solves. Sonnet agrees
   with key → verified. Sonnet disagrees → `flagged`, listed in `corpus/review.md`. The key wins only when a solver confirms it.
5. **Mechanical checks** (script): 4 non-empty options, answer in range, LaTeX parses (KaTeX), images exist, ids unique, chapter id valid.
6. **Chapter tag** (Haiku, from the fixed chapter list) + syllabus flag from the deleted-topics notices.
7. **Dedup** across sources (normalised stem+options hash); PYQ copy wins.

## Mock composition
Year-wise: the real paper in order. Generated mocks: draw per chapter proportional to that chapter's share
of PYQs, prefer questions he hasn't seen, then ones he got wrong. Only `verified` + in-syllabus (unless toggled).

## Pattern facts (to confirm from sources/syllabus/SUMMARY.md)
60 Q per subject, 1 mark each, no negative marking. 80-minute paper: first 10 min for OMR details, 70 min to answer (2026 bulletin p.30 §5) — mocks use 70 min. OMR, English.
