export const meta = {
  name: 'kcet-crosscheck',
  description: 'Proof-read retyped papers against an original (photographed/scanned) copy of another version, fix typos, re-verify fixed answers',
  phases: [{ title: 'Proofread', detail: 'Sonnet matches every question to the original copy and fixes transcription/typing errors', model: 'sonnet' }],
}
const ROOT = '/Users/kts/Documents/side-projects/kcet-practice-web'
const SCHEMA = { type: 'object', properties: {
  questions: { type: 'number' }, matched: { type: 'number' }, fixed: { type: 'array', items: { type: 'number' } },
  not_found: { type: 'array', items: { type: 'number' } }, still_disagree_with_key: { type: 'array', items: { type: 'number' } }, notes: { type: 'string' } },
  required: ['questions', 'matched', 'fixed', 'not_found', 'still_disagree_with_key'] }

const prompt = (j) => `You are proof-reading part of a 100%-correct question bank for a private KCET practice app. Repo root: ${ROOT}. Run Python as \`python3 -I\`. Never modify sources/.
Job ${j.id}: KCET ${j.year} ${j.subject}, version ${j.version}. Our questions came from a copy that a coaching website RETYPED, so it may contain typing mistakes (wrong digits, exponents, units, signs, missing words, swapped options).
Files in ${ROOT}/work/${j.id}/: questions.json (our transcription, numbered as version ${j.version}), key.json (official KEA key for version ${j.version} — do not change it), alt/a<i>-<n>.png = page images of ORIGINAL printed booklets of OTHER versions (${j.alt_desc}). paper/ = the retyped copy.
In other versions the question ORDER is shuffled and the OPTION order may be shuffled too, so match questions by content, never by number or letter. Original booklets carry a candidate's handwriting (circles, ticks, working) — ignore it completely.

1. Look at every alt page image. For EVERY question in questions.json find the same question in the original copy and compare stem and all four options symbol by symbol: numbers, signs, powers, subscripts, units, words, figure labels.
2. Where they differ, the ORIGINAL printed booklet is the truth. Fix questions.json (stem/option text) but keep OUR option order (map by content). If a figure is needed and our crop is worse than the original, you may re-crop from alt: \`python3 -I scripts/crop.py work/${j.id}/alt/a<i>-<n>.png x0 y0 x1 y1 work/${j.id}/img/<same file name>\` and look at the crop. Save questions.json with Python json.dump.
3. For every question you changed: solve it carefully yourself, then compare with key.json (version ${j.version}, 0-based options; "grace" entries have no answer). Note any that still disagree, with your working.
4. Write ${ROOT}/work/${j.id}/crosscheck.json: {"items": [{"number", "status": "matched_ok" | "fixed" | "not_found", "changes": "what changed", "solve": n|null, "key_agrees": true|false|null, "note": ""}]}.
Return the summary.`

const results = await parallel(args.jobs.map(j => () => agent(prompt(j), { label: `proofread:${j.id}`, phase: 'Proofread', schema: SCHEMA, model: 'sonnet' })))
return results.map((r, i) => ({ id: args.jobs[i].id, ...(r || { failed: true }) }))
