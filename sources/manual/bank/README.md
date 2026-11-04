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

Answer keys were **not** trusted. Every question was re-solved blind — the solver saw
only the stem, the options and the diagram, never a key, solution or mnemonic.

1. **Blind solve 1** over all 3,051 questions. A question is verified when this solver
   lands on Examon's own key; the answer and `accepted` list then come from Examon's
   key, never from the solver. Disagreements, and agreements at low confidence, stay
   flagged.
2. **Blind solve 2** over every disagreement, with the same blindness — a second
   independent attempt at the same question. If it lands on Examon's key the question
   is verified on Examon's answer; if it disagrees too, the question stays flagged with
   both answers and a one-line reason in `checks.disagreement`.
3. **External evidence** (`external-checks.json`) where a disagreement could be settled
   from outside: the official KCET 2025 Physics (Code D4) paper for a real PYQ, and the
   NCERT textbook/lab manual for the amine, ferrioxalate and melting-point items. An
   outside source that confirms the published key verifies the question; one that
   contradicts it leaves the question flagged, so nothing is ever published with a key
   known to be wrong.

Questions still flagged are listed in `flagged-questions.md` and are hidden from the app
until they are resolved.

## What this pipeline changed

Examon's key is wrong on a number of items, and the failures are systematic rather than
random — a family of questions shares one broken formula or one wrong convention:

| Family | Examon's key | Correct |
|---|---|---|
| Meter bridge, hard batch | `S = R·l/(100−l)` | `S = R(100−l)/l` — the balance length is measured from the known resistance's end |
| Dipole `E/V` on the axial line | `1000 m⁻¹` | `2/r = 10 m⁻¹` — Examon's own solution slips by a factor of 100 |
| Nernst equation, very hard batch | reaction quotient reversed | `E = E⁰ − (0.0591/n) log Q` with `Q` written from the cell as written |
| Tangent to a circle | the smaller root, or the centre value | the greater positive root |
| Electrolysis time | electron count doubled | `t = (m/M)·n·F/I` |
| Aqueous ethyl-amine basicity | methyl-series order | NCERT: `(C₂H₅)₂NH > (C₂H₅)₃N > C₂H₅NH₂ > NH₃` |
| Spin-only moment `√24 BM` | 3 unpaired | 4 unpaired (`n(n+2) = 24`) |

On the other side, the blind solver slipped on a few items that Examon had right — the
transformer current ratio, the string fundamental frequency, the dimensional formula for
mass, the slope of a line perpendicular to an intercept join, and the Born–Haber sign
convention. That is why the second pass is a re-solve rather than a vote.

## Rebuilding

```sh
python3 scripts/build_bank_corpus.py            # raw -> corpus (resets status to "flagged")
python3 scripts/make_verify_batches.py            # blind-solve batches
python3 scripts/build_bank_corpus.py --apply    # apply pass 1
python3 scripts/make_second_solve_batches.py      # blind second-solve batches (disagreements only)
python3 scripts/build_bank_corpus.py --apply-second   # apply pass 2
python3 scripts/build_bank_corpus.py --apply-adjudication  # record adjudication evidence
python3 scripts/build_bank_corpus.py --apply-external     # apply external evidence
python3 scripts/bank_summary.py                 # per-subject counts + flag reasons
```

The build is destructive on re-run: it resets `status` to `flagged` and wipes the
verification fields. Re-run the apply steps after it to restore them.

Only `corpus/questions/<subject>/bank-kcet.json` and `corpus/images/examon-*.svg` are
written by this pipeline.

