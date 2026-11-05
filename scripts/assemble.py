"""Build corpus/questions/*.json, corpus/images and corpus/review.md from finished work/<job>/ dirs.
Usage: python3 -I scripts/assemble.py            (all jobs with a verify.json)

Status rules:
- grace / dropped in the key                      -> dropped (no correct answer exists)
- reconcile left the question unresolved           -> flagged
- any key (official or not): live ONLY if a blind solver (Haiku, Sonnet re-solve, or proofread re-solve) chose an accepted option;
  otherwise flagged (hidden) and listed in review.md. If the text was fixed after Haiku solved it, Haiku's answer doesn't count.
- mechanical failures (not 4 options, bad answer index, missing image, LaTeX that KaTeX rejects) -> flagged
Duplicates across sources (same normalised stem + options): the PYQ copy wins, others are dropped.
"""
import glob, hashlib, json, os, re, shutil, subprocess, sys, unicodedata
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from latex_fix import fix as latex_fix  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
chapters = json.load(open(os.path.join(ROOT, "corpus/chapters.json")))
chapter_ok = {s: {c["id"]: c for c in cs} for s, cs in chapters.items()}


ILLEGIBLE = re.compile(r"\[(hidden|illegible|unclear|unreadable|missing|\?)|\?\?\?", re.I)
notes_all = []


def load(p, default=None):
    try:
        raw = open(p).read()
    except FileNotFoundError:
        return default
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # agents sometimes write LaTeX with single backslashes (e.g. "\\frac" as "\frac"); repair invalid escapes
        return json.loads(re.sub(r'\\(?!["\\/bfnrtu])', r'\\\\', raw))


def norm(s):
    s = unicodedata.normalize("NFKC", s or "").lower()
    return re.sub(r"[\s{}$\\,]", "", s)


def katex_check(strings):
    """Returns the set of indices KaTeX fails on (uses web/node_modules/katex via bun)."""
    katex = os.path.join(ROOT, "web/node_modules/katex")
    if not os.path.isdir(katex) or not strings:
        return set()
    r = subprocess.run(["bun", os.path.join(ROOT, "scripts/katex_check.cjs")], input=json.dumps(strings), capture_output=True, text=True)
    if r.returncode != 0:
        print("katex check failed to run:", r.stderr[:300])
        return set()
    return set(json.loads(r.stdout))


def main():
    out_by_file, review, seen = {}, [], {}
    jobs = sorted(glob.glob(os.path.join(ROOT, "work/*/verify.json")))
    # PYQs first so they win dedup
    jobs.sort(key=lambda p: (0 if os.path.basename(os.path.dirname(p)).startswith("pyq-") else 1, p))
    img_dir = os.path.join(ROOT, "corpus/images")
    os.makedirs(img_dir, exist_ok=True)
    for vpath in jobs:
        wd = os.path.dirname(vpath)
        job = load(os.path.join(wd, "job.json"))
        qs = load(os.path.join(wd, "questions.json"))["questions"]
        key = load(os.path.join(wd, "key.json"))["answers"]
        solve = load(os.path.join(wd, "solve.json"), {"answers": {}})["answers"]
        sonnet = load(os.path.join(wd, "sonnet.json"), {"answers": {}}).get("answers", {})
        verify = {str(i["number"]): i for i in load(vpath, {"items": []}).get("items", [])}
        cross = {str(i["number"]): i for i in load(os.path.join(wd, "crosscheck.json"), {"items": []}).get("items", [])}
        for u in load(os.path.join(wd, "reconcile_summary.json"), {}).get("unresolved", []):
            notes_all.append((job["id"], u))
        official = bool(job.get("key_official"))
        subj = job["subject"]
        rows = []
        from collections import Counter as _C
        dupn = {k for k, c in _C(q["number"] for q in qs).items() if c > 1}
        seen_n = {}
        for q in qs:
            n = str(q["number"])
            qid = f"{job['id']}-{int(n):03d}"
            if q["number"] in dupn:  # e.g. comprehension sub-parts sharing one printed number
                seen_n[n] = seen_n.get(n, 0) + 1
                qid += "abcdefghij"[seen_n[n] - 1]
            k = key.get(n) or {}
            v = verify.get(n)
            s = solve.get(n) or {}
            chap = s.get("chapter") if s.get("chapter") in chapter_ok[subj] else ""
            checks = {"key_official": official, "blind_haiku": s.get("choice"), "verify": v["verdict"] if v else "agreed",
                      "notes": (v or {}).get("note", "")}
            status, reason = "verified", ""
            cx = cross.get(n)
            if cx:
                checks["proofread"] = cx.get("status")
                if cx.get("changes"):
                    checks["proofread_changes"] = cx["changes"]
            accepted = sorted(set(k.get("options") or []))
            if q["number"] in dupn:
                status, reason = "flagged", "several sub-questions share one printed number; key mapping ambiguous"
            elif k.get("grace"):
                status, reason = "dropped", "grace mark in key"
            elif not accepted:
                status, reason = "flagged", "no key entry"
            elif ILLEGIBLE.search(q.get("stem", "") + " ".join(q.get("options") or [])):
                status, reason = "flagged", "text not fully legible in source"
            else:
                # Live only if an independent blind solver's answer is one of the key's accepted options.
                # Computed from the solver files themselves, not from the verifier's verdict label.
                haiku_c = s.get("choice")
                sonnet_c = (sonnet.get(n) or {}).get("choice")
                cx_c = (cx or {}).get("solve")
                text_fixed = bool(v and v.get("verdict") == "transcription_fixed")
                agree_sources = []
                if haiku_c in accepted and not text_fixed:
                    agree_sources.append("haiku")
                if sonnet_c in accepted:
                    agree_sources.append("sonnet")
                if cx_c in accepted:
                    agree_sources.append("proofread")
                if cx and cx.get("key_agrees") is False:
                    agree_sources = []
                checks["solver_agrees"] = agree_sources
                if not agree_sources:
                    status, reason = "flagged", "blind solver and key disagree"
            opts = q.get("options") or []
            if status != "dropped" and (len(opts) != 4 or any(not str(o).strip() for o in opts) or any(a not in range(4) for a in accepted)):
                status, reason = "flagged", "mechanical: options/answer"
            images = []
            for name in q.get("images") or []:
                src = os.path.join(wd, "img", name)
                if os.path.exists(src):
                    shutil.copy(src, os.path.join(img_dir, name))
                    images.append(name)
                else:
                    status, reason = "flagged", f"missing image {name}"
            h = hashlib.sha1((norm(q.get("stem")) + "|" + "|".join(sorted(norm(o) for o in opts))).encode()).hexdigest()
            if h in seen and status == "verified":
                status, reason = "dropped", f"duplicate of {seen[h]}"
            elif status == "verified":
                seen[h] = qid
            src = {"type": job["type"], "name": job.get("name") or (f"KCET {job['year']}" if job["type"] == "pyq" else job.get("title", job["id"])),
                   "year": job.get("year", 0), "version": job.get("version", ""), "number": int(n),
                   "file": job["paper_pdf"], "page": q.get("page", 0), "key_file": (job.get("key_pdfs") or [""])[0]}
            row = {"id": qid, "subject": subj, "chapter": chap, "source": src, "stem": latex_fix(q.get("stem", "")), "options": [latex_fix(o) for o in opts],
                   "answer": accepted[0] if accepted else -1, "accepted": accepted, "images": images, "status": status,
                   "in_syllabus": bool(chap and chapter_ok[subj][chap]["in_syllabus"]), "checks": checks}
            if reason:
                row["checks"]["status_reason"] = reason
            rows.append(row)
            if status == "flagged" or checks.get("disputed"):
                review.append((qid, status, reason, src, k, v))
        out_by_file[(subj, job["id"])] = rows

    # Final gate for the examon import: live only when a blind solver agreed with examon's own key.
    # Questions whose key was wrong and got corrected (formula / external source) are hidden under the strict rule.
    for ep in sorted(glob.glob(os.path.join(ROOT, "corpus/questions/*/bank-kcet.json"))):
        recs = json.load(open(ep))
        changed = False
        for rec in recs:
            solver = str(rec.get("checks", {}).get("solver") or "")
            if rec.get("status") == "verified" and not solver.startswith("minimax"):
                rec["status"] = "flagged"
                rec["checks"]["status_reason"] = f"strict rule: solver and original key did not agree ({solver}); corrected answer kept for review"
                review.append((rec["id"], "flagged", "examon key was wrong; corrected answer available", rec["source"], {}, {"note": rec["checks"].get("adjudication_reason", "")}))
                changed = True
        if changed:
            with open(ep, "w") as fh:
                json.dump(recs, fh, indent=1, ensure_ascii=False)
                fh.write("\n")

    # LaTeX check across everything that would go live
    flat = [(f, i, r) for f, rs in out_by_file.items() for i, r in enumerate(rs) if r["status"] == "verified"]
    texts = [r["stem"] + "\n" + "\n".join(r["options"]) for _, _, r in flat]
    for idx in katex_check(texts):
        _, _, r = flat[idx]
        r["status"], r["checks"]["status_reason"] = "flagged", "LaTeX does not render"
        review.append((r["id"], "flagged", "LaTeX does not render", r["source"], {}, None))

    totals = {}
    for (subj, jid), rows in out_by_file.items():
        d = os.path.join(ROOT, "corpus/questions", subj)
        os.makedirs(d, exist_ok=True)
        json.dump(rows, open(os.path.join(d, f"{jid}.json"), "w"), indent=1, ensure_ascii=False)
        for r in rows:
            totals.setdefault(subj, {}).setdefault(r["status"], 0)
            totals[subj][r["status"]] += 1

    with open(os.path.join(ROOT, "corpus/review.md"), "w") as f:
        f.write("# Questions that need a human look\n\n")
        f.write("Flagged = hidden from practice until fixed. A question is live only when a blind solver agreed with its answer key.\n")
        f.write("Fix by editing the question's JSON in corpus/questions/ (stem/options/answer/status), committing, and deploying.\n")
        f.write("Note: re-running scripts/assemble.py rebuilds PYQ/Exemplar/NEET files from work/ and would undo such hand edits; check `git diff corpus/` before committing.\n\n")
        f.write("| Question | Status | Why | Source | Key | Checker |\n|---|---|---|---|---|---|\n")
        for qid, status, reason, src, k, v in sorted(review, key=lambda r: r[0]):
            label = status
            note = (v or {}).get("note", "").replace("|", "/")
            f.write(f"| {qid} | {label} | {reason} | {src['file']} p.{src['page']} | {k.get('raw', '')} | {note} |\n")
        f.write("\n## Transcriber notes (informational)\n\n")
        for jid, u in notes_all:
            f.write(f"- **{jid}**: {u}\n")
    print(json.dumps(totals, indent=1))
    print("assemble: wrote corpus/. Review with `git diff corpus/` (hand fixes to PYQ/Exemplar/NEET files are overwritten "
          "from work/), then commit. Deploys ship corpus/ as committed.", file=sys.stderr)
    print(f"review items: {len(review)}")


main()
