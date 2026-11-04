export const meta = {
  name: 'kcet-extract',
  description: 'Extract, cross-check and verify KCET questions + answer keys for a list of source jobs',
  phases: [
    { title: 'Extract', detail: '2 independent Haiku transcriptions + 2 independent Haiku key readings per paper' },
    { title: 'Reconcile', detail: 'Sonnet resolves every transcription/key mismatch against the page images, crops diagrams', model: 'sonnet' },
    { title: 'Solve', detail: 'Haiku solves every question blind and tags its chapter' },
    { title: 'Verify', detail: 'Sonnet re-solves every disagreement blind, re-reads the key, fixes transcription errors', model: 'sonnet' },
  ],
}

const ROOT = '/Users/kts/Documents/side-projects/kcet-practice-web'
const SCOPES = {
  physics: "Only the section headed 'MCQ I' (multiple choice questions with exactly ONE correct option). Skip MCQ II (more than one correct), Very Short Answer, Short Answer and Long Answer sections. Questions are numbered '<chapter>.<n>' (e.g. 3.4); use the integer n as \"number\".",
  mathematics: "Only the 'Objective Type Questions' in the EXERCISE part (\"Choose the correct answer out of the given four options in each of the Exercises …\"). Skip the solved Examples, Fill in the blanks and True/False. Use the exercise number as \"number\".",
  chemistry: "Only the section 'I. Multiple Choice Questions (Type-I)' (exactly ONE correct option). Skip Type-II (more than one correct) and every other section. Use the printed question number.",
}
const KEYHELP = {
  physics: (ch) => `This is the NCERT Exemplar ANSWERS file. Use only Chapter ${ch} entries '${ch}.<n> (x)' for the MCQ I question numbers; letters a/b/c/d → 0/1/2/3. Ignore entries for MCQ II / short-answer numbers. version is "".`,
  mathematics: (ch) => `This is the NCERT Exemplar ANSWERS file. Use only the block(s) headed '${ch}.x EXERCISE' and take the answers for the objective (MCQ) exercise numbers only; letters (A)/(B)/(C)/(D) → 0/1/2/3. version is "".`,
  chemistry: () => "The answers are in the ANSWERS section at the END of this same file, under 'I. Multiple Choice Questions (Type-I)'. Use only that sub-section; letters (i)/(ii)/(iii)/(iv) or a/b/c/d → 0/1/2/3. version is \"\".",
}
const expand = (j) => {
  if (j.kind === 'ncert') {
    const [, cls, ch] = j.id.match(/-(\d+)-ch(\d+)$/)
    return { ...j, type: 'third-party', title: `NCERT Exemplar ${j.subject} Class ${cls}, Chapter ${+ch}`, scope: SCOPES[j.subject], key_help: KEYHELP[j.subject](+ch), paper_has_answers: j.subject === 'chemistry' }
  }
  if (j.kind === 'neet') {
    return { ...j, type: 'third-party', title: `NEET (UG) ${j.year} ${j.subject}, booklet ${j.version}`,
      scope: `Only the ${j.subject.toUpperCase()} section. Check the paper's own section headings to find where ${j.subject} starts and ends (if the year has Section A/B, include both). Keep the printed question numbers. Skip Biology/Botany/Zoology entirely.`,
      key_help: `This is the official NTA answer key covering several booklets. Use ONLY booklet/test code ${j.version}, and only the ${j.subject} question numbers. NTA lists the correct option number (1–4) per question; several numbers = all accepted; 'Dropped'/'Bonus'/'All' = grace.` }
  }
  return { ...j, type: j.type || 'pyq' }
}
const jobs = args.jobs.map(expand)

const COMMON = (j) => `
You are part of a pipeline building a 100%-correct question bank for a private KCET (Karnataka engineering entrance) practice app.
Repo root: ${ROOT}. Job: ${j.id} — ${j.type === 'pyq' ? `KCET ${j.year} ${j.subject} question paper, version ${j.version}` : j.title}.
Work dir: ${ROOT}/work/${j.id}/
  paper/p-<n>.png = page images of the question source (n = page number), paper/p-<n>.txt = that page's text layer or OCR (may be garbled — the IMAGE is the truth).
  key/k<i>-<n>.png (+ .txt) = answer key pages (k0 = first key file, k1 = second …). job.json = job metadata.
Use the Read tool to look at PNG images. Never modify anything under sources/.
WARNING: many scanned papers carry a previous candidate's HANDWRITING — circled/ticked options, pencil working, underlines. Ignore all handwriting completely: never transcribe it, never treat a circled option as the answer, and keep it out of diagram crops where possible. Also ignore watermarks (e.g. "aglasem"), QR codes and page footers. Only write the files your task names. Run Python as \`python3 -I\`.

Transcription conventions (strict):
- Copy the question exactly as printed: same numbers, units, wording, symbols. Never correct, simplify or "improve" a question, even if it looks wrong.
- Math/physics/chemistry notation in KaTeX-compatible LaTeX inside $...$ (inline) or $$...$$ (display). Fractions \\frac{}{}, roots \\sqrt{}, vectors \\vec{}, degrees ^\\circ, Greek letters, \\times, \\Omega, \\mu. Units upright: $5\\,\\mathrm{m\\,s^{-1}}$. Chemical formulas upright with subscripts: $\\mathrm{H_2SO_4}$, $\\mathrm{Fe^{3+}}$, arrows \\rightarrow / \\rightleftharpoons. Plain words stay plain text.
- Matrices/determinants: \\begin{bmatrix}…\\end{bmatrix} / \\begin{vmatrix}…\\end{vmatrix}. Match-the-column / statement lists: Markdown lines separated by blank lines; tables as Markdown tables.
- options: exactly 4 strings in printed order, WITHOUT their labels ("(A)", "1)", "a."). 
- A figure/graph/circuit/structure that is needed: set "diagram": {"page": <page number>, "bbox": [x0,y0,x1,y1]} as fractions (0–1) of the page image width/height, generously covering the whole figure. If the OPTIONS themselves are pictures, set "options_are_images": true and include them in the bbox; option strings then are "(A)","(B)","(C)","(D)".
`

const EXTRACT_SCHEMA = { type: 'object', properties: { count: { type: 'number' }, first: { type: 'number' }, last: { type: 'number' }, missing_numbers: { type: 'array', items: { type: 'number' } }, problems: { type: 'string' } }, required: ['count', 'problems'] }
const KEY_SCHEMA = { type: 'object', properties: { version_found: { type: 'string' }, count: { type: 'number' }, grace: { type: 'array', items: { type: 'number' } }, multi: { type: 'array', items: { type: 'number' } }, problems: { type: 'string' } }, required: ['count', 'problems'] }
const RECON_SCHEMA = { type: 'object', properties: { questions: { type: 'number' }, extract_issues_resolved: { type: 'number' }, key_issues_resolved: { type: 'number' }, diagrams: { type: 'number' }, unresolved: { type: 'array', items: { type: 'string' } } }, required: ['questions', 'unresolved'] }
const SOLVE_SCHEMA = { type: 'object', properties: { solved: { type: 'number' }, low_confidence: { type: 'array', items: { type: 'number' } } }, required: ['solved'] }
const VERIFY_SCHEMA = { type: 'object', properties: { checked: { type: 'number' }, key_confirmed: { type: 'number' }, transcription_fixed: { type: 'array', items: { type: 'number' } }, key_reading_fixed: { type: 'array', items: { type: 'number' } }, disputed: { type: 'array', items: { type: 'number' } }, notes: { type: 'string' } }, required: ['checked', 'disputed'] }

const extractPrompt = (j, which) => `${COMMON(j)}
TASK: transcribe EVERY question in the source into ${ROOT}/work/${j.id}/extract_${which}.json.
${j.scope ? `SCOPE: ${j.scope}\n` : ''}${which === 'b' ? 'Work through the pages from the LAST page backwards (an independent second transcription; do not read extract_a.json).' : 'Work through the pages in order (do not read extract_b.json).'}
Look at every page image (paper/p-*.png). Skip cover pages, instructions, blank/rough-work pages and advertisements.${j.paper_has_answers ? ' This source prints answers/solutions next to questions: do NOT transcribe answers, "Ans:" lines, ticks or solutions — questions and options only.' : ''}
File format: {"questions": [{"number": <printed question number>, "page": <page>, "stem": "...", "options": ["...","...","...","..."], "diagram": null | {"page": n, "bbox": [x0,y0,x1,y1]}, "options_are_images": false, "notes": "anything unclear"}]}
Write valid JSON (escape backslashes: LaTeX \\frac must be "\\\\frac" inside JSON strings — write the file with Python json.dump from a Python dict to be safe). Then return the summary.`

const keyPrompt = (j, which) => `${COMMON(j)}
TASK: read the ANSWER KEY into ${ROOT}/work/${j.id}/key_${which}.json. ${which === 'b' ? '(Independent second reading — do not read key_a.json.)' : '(Do not read key_b.json.)'}
${j.key_help || ''}
${j.type === 'pyq' ? `The paper is version ${j.version} of the KCET ${j.year} ${j.subject.toUpperCase()} paper. KEA keys usually have one column per version (A1…D4, or A/B/C/D). Use ONLY the ${j.subject} table and ONLY the ${j.version} column. ${j.keys_by_date ? 'There are TWO KEA key documents (k0, k1), possibly of different dates and one may cover several subjects. Read the printed date/title on each. The LATEST-dated key is authoritative; if they disagree on a question, use the later one and put both values in "raw" (e.g. "k0:3 k1:4 -> later k1").' : 'If there are several key files, k0 is the final/revised key and wins; k1 is the provisional key.'} If the final/revised file only lists CHANGED questions, start from the provisional key and apply those changes. A question is "grace" when the key marks it G / grace / bonus / dropped / "0" or awards marks to everyone — read the key's own legend for its special codes. Known KEA conventions (confirm against the legend on the key itself): "0" = grace mark awarded; a value with more than one digit such as "34" = options 3 AND 4 both correct; "7" = question excluded. Treat grace AND excluded both as "grace": true with "options": [] (put the code in "raw").` : ''}
Options are 0-based indices: A/1/a → 0, B/2/b → 1, C/3/c → 2, D/4/d → 3.
File format: {"version": "${j.version || ''}", "answers": {"1": {"options": [2], "grace": false, "raw": "C"}, ...}} — one entry per question number; multiple correct options → several indices; grace → "grace": true, "options": [].
Write it with Python json.dump. Then return the summary.`

const reconcilePrompt = (j) => `${COMMON(j)}
TASK: produce the reconciled files questions.json and key.json for this job, and crop diagrams.
1. Run \`python3 -I scripts/compare_extracts.py work/${j.id}\` from the repo root. For EVERY issue, open the relevant page image and decide the exact correct transcription (it may be A's, B's, or neither). Also skim all remaining questions in extract_a.json for broken LaTeX or missing text and fix against the image. If a question number is missing from both, transcribe it yourself from the image.
2. Write ${ROOT}/work/${j.id}/questions.json: {"questions": [{"number", "page", "stem", "options", "images": [], "options_are_images", "notes"}]} sorted by number.
3. Diagrams: for each question that needs a figure, crop it: \`python3 -I scripts/crop.py work/${j.id}/paper/p-<page>.png x0 y0 x1 y1 work/${j.id}/img/${j.id}-<NNN>.png\` (NNN = zero-padded question number; add -2, -3 suffixes for extra figures). LOOK at every crop with the Read tool; adjust the bbox and re-crop until the figure is complete (labels included) and neighbouring questions are excluded. Put the file names (no path) in "images".
4. Run \`python3 -I scripts/compare_keys.py work/${j.id}\`. For EVERY issue, look at the key image and decide. Write ${ROOT}/work/${j.id}/key.json in the same format as key_a.json.
5. Sanity: every question has 4 options, numbers are contiguous for this source, key has an entry for every question. List anything you could not resolve in "unresolved" (e.g. "Q17: option C illegible").
Write JSON with Python json.dump. Return the summary.`

const solvePrompt = (j) => `${COMMON(j)}
TASK: solve every question yourself, WITHOUT any answer key — this is a blind check of the key.
First run \`python3 -I scripts/blind.py work/${j.id}\` from the repo root; it writes work/${j.id}/questions_blind.json (questions without transcriber notes). Read ONLY questions_blind.json and img/. Do NOT open questions.json, key.json, key_a.json, key_b.json, extract_*.json, anything in key/ or paper/.
For questions with "images", look at work/${j.id}/img/<file> (a figure crop may show a stray handwritten mark — ignore it; it is a previous candidate's guess). Work each problem out properly (calculate numericals, don't guess from option patterns). If a question looks garbled, mark it low confidence rather than opening other files.
Also tag each question with the best chapter id from ${ROOT}/corpus/chapters.json (subject: ${j.subject}). Use only ids from that list.
Write ${ROOT}/work/${j.id}/solve.json: {"answers": {"1": {"choice": <0-3>, "confidence": "high|medium|low", "chapter": "<chapter id>"}, ...}} with Python json.dump. Return the summary.`

const verifyPrompt = (j) => `${COMMON(j)}
TASK: settle every question where a blind solver disagreed with the answer key.
1. Run \`python3 -I scripts/check_answers.py work/${j.id} solve.json --numbers-only\` — it prints only the disagreeing question numbers (not the key), so you stay blind.
2. For each such number: FIRST solve it yourself from work/${j.id}/questions_blind.json (+ img/) without looking at the page image, notes or key, and write your choice down. THEN open the page image and confirm questions.json transcribes the question and options EXACTLY (handwritten circles/ticks on the scan are a previous candidate's marks — not evidence of the answer; ignore them) (fix questions.json if not — a transcription error is the most common cause). If you fix the transcription, re-solve the fixed version. Record in ${ROOT}/work/${j.id}/sonnet.json: {"answers": {"<n>": {"choice": <0-3>, "reasoning": "short working"}}}. Do not open key files before this step is complete.
3. Run \`python3 -I scripts/check_answers.py work/${j.id} sonnet.json\` to see where you and the key still differ. For each: re-read the key image cell for that question and version (fix key.json if it was mis-read), and re-check your own working once more.
4. Write ${ROOT}/work/${j.id}/verify.json: {"items": [{"number", "verdict": "key_confirmed" | "transcription_fixed" | "key_reading_fixed" | "disputed", "key": [...], "sonnet": n, "note": "one line"}]} — "disputed" means after all that you still believe the key is wrong; explain why in the note.
Return the summary.`

const results = await pipeline(
  jobs,
  async (j) => {
    const [ea, eb, ka, kb] = await parallel([
      () => agent(extractPrompt(j, 'a'), { label: `extract-a:${j.id}`, phase: 'Extract', schema: EXTRACT_SCHEMA, model: 'haiku' }),
      () => agent(extractPrompt(j, 'b'), { label: `extract-b:${j.id}`, phase: 'Extract', schema: EXTRACT_SCHEMA, model: 'haiku' }),
      () => agent(keyPrompt(j, 'a'), { label: `key-a:${j.id}`, phase: 'Extract', schema: KEY_SCHEMA, model: 'haiku' }),
      () => agent(keyPrompt(j, 'b'), { label: `key-b:${j.id}`, phase: 'Extract', schema: KEY_SCHEMA, model: 'haiku' }),
    ])
    if (!ea || !eb || !ka || !kb) throw new Error(`${j.id}: an extraction agent failed`)
    return { ea, eb, ka, kb }
  },
  async (prev, j) => ({ ...prev, recon: await agent(reconcilePrompt(j), { label: `reconcile:${j.id}`, phase: 'Reconcile', schema: RECON_SCHEMA, model: 'sonnet' }) }),
  async (prev, j) => ({ ...prev, solve: await agent(solvePrompt(j), { label: `solve:${j.id}`, phase: 'Solve', schema: SOLVE_SCHEMA, model: 'haiku' }) }),
  async (prev, j) => {
    const verify = await agent(verifyPrompt(j), { label: `verify:${j.id}`, phase: 'Verify', schema: VERIFY_SCHEMA, model: 'sonnet' })
    log(`${j.id}: ${prev.recon?.questions ?? '?'} Qs, disputed ${verify?.disputed?.length ?? '?'}`)
    return { id: j.id, ...prev, verify }
  },
)
return results.map((r, i) => r || { id: jobs[i].id, failed: true })
