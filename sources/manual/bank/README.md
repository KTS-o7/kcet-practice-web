# Examon (examon.co) — KCET question bank

Third-party practice bank scraped from the public static assets of <https://examon.co>.
Fetched 2026-11-04. Used as a supplementary question source for the KCET corpus.

## What is here

| Path | Contents |
|---|---|
| `raw/exams__kcet__*.json` | The 18 question files exactly as served (3,051 questions). Filenames are the asset paths with `/` replaced by `__`. |
| `raw/exams__kcet__quicksheets.json` | 48 formula quicksheets (one per subject/chapter). |
| `raw/exams__kcet__confusion-pairs.json` | 12 confusion pairs (SN1/SN2 style traps). |
| `raw/exams__kcet__rank-curve.json` | Score → percentile curve for the rank estimator. |
| `raw/exams__kcet__college-bands.json` | Score → college cut-off bands. |
| `raw/drills__elimination.json` | 70 MCQ elimination-technique drill cards. |

Fetch metadata (URL, sha256, byte count, timestamp) for every file is in
`sources/_manifests/manual-bank.json`.

## Where the questions live

The Examon front end is an Angular SPA. It ships its content as plain JSON under
`https://examon.co/assets/exams/<examId>/<file>.json` and loads it with `http.get`.
The exam list is defined in the JS bundle (`questionFiles` in `chunk-BKIZYX2A.js`).
For the `kcet` exam id that resolves to 18 question files + `quicksheets.json`.
No login, no API key, no Firebase read required — the files are plain HTTP GETs.

## Question record shape

Each raw question is a JSON object:

```
id, examId, subject, chapter, topic, difficulty, difficultyScore, kcetDifficulty,
stem, options[4], answerIndex (0-based), solution, mnemonic, detailedExplanation,
verified, auditConfidence, auditModel, auditedAt, answerIndexCheckedAt,
tags?, source?, year?, diagram? (inline SVG), auditIssues?, auditSuggestedAnswerIndex?,
repairNote?, hardenNote?, templateGroup?
```

- `mnemonic` — the memory hook. Present on all 3,051 questions.
- `solution` / `detailedExplanation` — worked solution. Present on all 3,051 questions.
- `diagram` — inline SVG for the 38 questions that have a figure. Extracted to
  `corpus/images/examon-<id>.svg` and referenced from the question's `images` array.
- `verified: false` on 196 questions; 178 carry `auditIssues`; 164 carry
  `auditSuggestedAnswerIndex` (Examon's own audit proposed a different key).

## Provenance and licence

These questions, solutions and mnemonics are **Examon's own authored content**, not
official KEA past papers. Examon states its bank is "PYQ-grounded" — built from the
shape of KCET/NEET past questions rather than being scans of them. Treat every item
as third-party practice material, not as an official paper.

Attribution: content and mnemonics by Examon (examon.co). Retain this folder and the
manifest if any of it is redistributed.

## How it reached the corpus

```
sources/manual/bank/raw/*.json
        |  scripts/build_bank_corpus.py
        v
corpus/questions/<subject>/bank-kcet.json     (repo Question schema + mnemonic/solution/explanation)
corpus/images/examon-<id>.svg                   (38 diagrams)
```

Chapters: Examon uses ~59 coarse chapter names; the repo uses NCERT chapter ids.
The translation lives in `scripts/bank_chapters.py` and is explicit — an unmapped
chapter raises `KeyError` rather than silently landing in the wrong bucket.

Answer keys were **not** trusted. Every question was re-solved blind by a solver
agent that saw only the stem, options and diagram — no key, no solution, no mnemonic.
Results live in `.scratch/bank/verify-results/` and are applied by
`python3 scripts/build_bank_corpus.py --apply`:

- solver agrees with the key → `status: "verified"`
- solver disagrees → `status: "flagged"`, discrepancy recorded in `checks`
- solver finds no correct option → `status: "flagged"`, `checks.disagreement` keeps
  the solver's derived answer and its `correct_text`

Questions still flagged after that pass are listed in `corpus/review.md` and are
hidden from the app until resolved.

## Rebuilding

```sh
python3 scripts/build_bank_corpus.py     # raw -> corpus (resets all status to "flagged")
python3 scripts/make_verify_batches.py    # corpus -> blind-solve batches
python3 scripts/build_bank_corpus.py --apply   # apply solver verdicts
```

The build is destructive on re-run: it resets `status` to `flagged` and wipes the
verification fields. Re-run `--apply` after it to restore them.
