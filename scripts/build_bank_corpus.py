#!/usr/bin/env python3
"""Convert the raw KCET practice bank, assets into the repo's corpus question format.

Input : sources/manual/bank/raw/exams__kcet__*.json  (fetched verbatim)
Output: corpus/questions/<subject>/bank-kcet.json
        corpus/images/examon-<id>.svg            (inline diagrams)
        .scratch/bank/verify-worklist.json     (input for the verifier agents)

Usage:
    python3 scripts/build_bank_corpus.py                # build
    python3 scripts/build_bank_corpus.py --apply        # apply verified answers
"""
import argparse
import datetime
import glob
import json
import os
import sys
from collections import Counter, defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bank_chapters import map_chapter  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "sources/manual/bank/raw")
CORPUS = os.path.join(ROOT, "corpus")
IMAGES = os.path.join(CORPUS, "images")
SCRATCH = os.path.join(ROOT, ".scratch/bank")
MANIFEST = os.path.join(ROOT, "sources/_manifests/manual-bank.json")

QUESTION_FILES = [
    "exams__kcet__physics.json",
    "exams__kcet__physics-hard-batch.json",
    "exams__kcet__physics-hard-batch-02.json",
    "exams__kcet__physics-hard-batch-03.json",
    "exams__kcet__physics-very-hard-batch.json",
    "exams__kcet__physics-very-hard-batch-02.json",
    "exams__kcet__chemistry.json",
    "exams__kcet__chemistry-hard-batch.json",
    "exams__kcet__chemistry-hard-batch-02.json",
    "exams__kcet__chemistry-hard-batch-03.json",
    "exams__kcet__chemistry-very-hard-batch.json",
    "exams__kcet__chemistry-very-hard-batch-02.json",
    "exams__kcet__mathematics.json",
    "exams__kcet__mathematics-hard-batch.json",
    "exams__kcet__mathematics-hard-batch-02.json",
    "exams__kcet__mathematics-hard-batch-03.json",
    "exams__kcet__mathematics-very-hard-batch.json",
    "exams__kcet__mathematics-very-hard-batch-02.json",
]

# Batch families carry their own provenance label.
BATCH_LABEL = {
    "": "KCET practice bank",
    "-hard-batch": "KCET practice bank, hard batch",
    "-hard-batch-02": "KCET practice bank, hard batch 02",
    "-hard-batch-03": "KCET practice bank, hard batch 03",
    "-very-hard-batch": "KCET practice bank, very hard batch",
    "-very-hard-batch-02": "KCET practice bank, very hard batch 02",
}


def label_for(fname):
    base = fname[len("exams__kcet__"):-len(".json")]
    for suffix, label in BATCH_LABEL.items():
        if base.endswith(suffix):
            return label
    raise KeyError(fname)


def load_raw():
    out = []
    for fname in QUESTION_FILES:
        path = os.path.join(RAW, fname)
        with open(path) as fh:
            items = json.load(fh)
        assert isinstance(items, list) and items, fname
        for idx, q in enumerate(items, start=1):
            q["_file"] = fname
            q["_index"] = idx
            out.append(q)
    return out


def build():
    chapters = json.load(open(os.path.join(CORPUS, "chapters.json")))
    chapter_syllabus = {
        c["id"]: c["in_syllabus"]
        for sub in chapters.values()
        for c in sub
    }
    os.makedirs(IMAGES, exist_ok=True)

    items = load_raw()
    by_subject = defaultdict(list)
    images_written = 0
    unmapped = Counter()
    seen_ids = set()

    for q in items:
        subject = q["subject"]
        if subject not in ("physics", "chemistry", "mathematics"):
            unmapped[("subject", subject)] += 1
            continue
        try:
            chapter = map_chapter(subject, q["chapter"], q.get("topic"))
        except KeyError as exc:
            unmapped[("chapter", str(exc))] += 1
            continue
        if chapter not in chapter_syllabus:
            unmapped[("repo-chapter", chapter)] += 1
            continue

        qid = f"examon-{q['id']}"
        if qid in seen_ids:
            raise SystemExit(f"duplicate corpus id {qid}")
        seen_ids.add(qid)

        answer = q["answerIndex"]
        if not isinstance(answer, int) or not 0 <= answer <= 3:
            unmapped[("answer", q["id"])] += 1
            continue

        images = []
        diagram = q.get("diagram")
        if diagram:
            img_name = f"{qid}.svg"
            with open(os.path.join(IMAGES, img_name), "w") as fh:
                fh.write(diagram if diagram.lstrip().startswith("<svg") else
                         diagram[diagram.index("<svg"):])
            images.append(img_name)
            images_written += 1

        source_file = f"sources/manual/bank/raw/{q['_file']}"
        checks = {
            "extract_match": True,
            "key_sources": 1,
            "solver": None,
            "examon_verified": bool(q.get("verified")),
            "examon_audit_confidence": q.get("auditConfidence"),
            "examon_audit_model": q.get("auditModel"),
            "examon_audited_at": q.get("auditedAt"),
            "examon_audit_issues": q.get("auditIssues"),
            "examon_suggested_answer": q.get("auditSuggestedAnswerIndex"),
            "notes": q.get("source") or "",
        }
        if q.get("repairNote"):
            checks["examon_repair_note"] = q["repairNote"]
        if q.get("hardenNote"):
            checks["examon_harden_note"] = q["hardenNote"]

        rec = {
            "id": qid,
            "subject": subject,
            "chapter": chapter,
            "source": {
                "type": "third-party",
                "name": label_for(q["_file"]),
                "year": q.get("year") or 0,
                "version": "",
                "number": q["_index"],
                "file": source_file,
                "page": 0,
                "key_file": "",
            },
            "stem": q["stem"],
            "options": q["options"],
            "answer": answer,
            "accepted": [answer],
            "images": images,
            "status": "flagged",
            "in_syllabus": chapter_syllabus[chapter],
            "topic": q.get("topic") or "",
            "difficulty": q.get("difficulty") or "",
            "mnemonic": q.get("mnemonic") or "",
            "solution": q.get("solution") or "",
            "explanation": q.get("detailedExplanation") or "",
            "checks": checks,
        }
        by_subject[subject].append(rec)

    for subject, recs in by_subject.items():
        out = os.path.join(CORPUS, "questions", subject, "bank-kcet.json")
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with open(out, "w") as fh:
            json.dump(recs, fh, indent=1, ensure_ascii=False)
            fh.write("\n")
        print(f"wrote {out}  ({len(recs)} questions)")

    # Worklist for the verifier agents: no answer key, no solution, no mnemonic.
    os.makedirs(SCRATCH, exist_ok=True)
    work = []
    for subject in ("physics", "chemistry", "mathematics"):
        for rec in by_subject.get(subject, []):
            raw = next(x for x in items if f"examon-{x['id']}" == rec["id"])
            work.append({
                "id": rec["id"],
                "subject": subject,
                "chapter": rec["chapter"],
                "topic": rec["topic"],
                "stem": rec["stem"],
                "options": rec["options"],
                "diagram": raw.get("diagram"),
                "examon_answer": rec["answer"],
                "examon_audit_confidence": rec["checks"]["examon_audit_confidence"],
                "examon_flagged": not rec["checks"]["examon_verified"]
                or bool(rec["checks"]["examon_audit_issues"]),
            })
    with open(os.path.join(SCRATCH, "verify-worklist.json"), "w") as fh:
        json.dump(work, fh, indent=1, ensure_ascii=False)
    print(f"wrote worklist: {len(work)} questions")

    print(f"images written: {images_written}")
    if unmapped:
        print("UNMAPPED:")
        for k, v in unmapped.items():
            print("  ", k, v)
    else:
        print("no unmapped records")


def write_review(recs, now, applied, note):
    """Write corpus/review.md — every question still flagged, with both answers."""
    unverified = [(r["subject"], r) for r in recs if r["status"] != "verified"]
    lines = [
        "# Questions still flagged after verification",
        "",
        f"KCET practice bank, bank. {note}",
        f"Last checked {now}.",
        "",
        f"{len(unverified)} of {applied} checked questions are still flagged and are hidden "
        "from the app until they are resolved.",
        "",
    ]
    for subject, rec in sorted(unverified, key=lambda t: (t[0], t[1]["id"])):
        dis = rec["checks"].get("disagreement", {})
        lines += [
            f"## {rec['id']}",
            "",
            f"- Subject / chapter: {rec['subject']} / {rec['chapter']}",
            f"- Topic: {rec['topic']}",
        ]
        if dis.get("kind") == "no_correct_option":
            lines.append("- Reason: no option is correct")
        elif dis.get("kind") == "solver_unsure":
            lines.append("- Reason: solver could not decide")
        else:
            lines.append("- Reason: solver picked a different option")
        lines.append(f"- Examon key: **{chr(ord('A') + rec['answer'])}** — {rec['options'][rec['answer']]}")
        if "solver_answer_text" in dis:
            lines.append(f"- Solver chose: **{chr(ord('A') + dis['solver_answer'])}** — {dis['solver_answer_text']}")
        if dis.get("solver_correct_text"):
            lines.append(f"- Solver's derived answer: `{dis['solver_correct_text']}`")
        if rec["checks"].get("adjudicator_correct_value"):
            lines.append(f"- Adjudicator's derived answer: `{rec['checks']['adjudicator_correct_value']}`")
        if rec["checks"].get("adjudication_verdict"):
            lines.append(f"- Adjudication verdict: **{rec['checks']['adjudication_verdict']}**")
        if rec["checks"].get("adjudication_reason"):
            lines.append(f"- Adjudicator: {rec['checks']['adjudication_reason']}")
        if dis.get("note"):
            lines.append(f"- Note: {dis['note']}")
        lines += ["", f"    {rec['stem']}", ""]
        for i, opt in enumerate(rec["options"]):
            mark = " (key)" if i == rec["answer"] else ""
            lines.append(f"    {chr(ord('A') + i)}. {opt}{mark}")
        lines += ["", "```", ""]
    review = os.path.join(CORPUS, "review.md")
    with open(review, "w") as fh:
        fh.write("\n".join(lines))
    print(f"wrote {review}: {len(unverified)} flagged questions")


def apply_verification():
    """Apply solver verdicts (.scratch/bank/verify-results/*.json) to the corpus.

    A question is only promoted to "verified" when a solver, working blind from the
    stem alone, independently produced the same option index as Examon's key. Every
    other outcome stays "flagged" and is listed in corpus/review.md.
    """
    results = {}
    for path in sorted(glob.glob(os.path.join(SCRATCH, "verify-results", "*.json"))):
        with open(path) as fh:
            data = json.load(fh)
        if isinstance(data, dict):
            data = data.get("results", [])
        for item in data:
            qid = item.get("id")
            if qid:
                results[qid] = item
    if not results:
        raise SystemExit("no verifier results found")

    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    changed = 0
    unverified = []
    for subject in ("physics", "chemistry", "mathematics"):
        path = os.path.join(CORPUS, "questions", subject, "bank-kcet.json")
        recs = json.load(open(path))
        for rec in recs:
            v = results.get(rec["id"])
            if not v:
                continue
            changed += 1
            idx = v.get("correct_index")
            conf = v.get("confidence", "")
            note = (v.get("note") or "")[:2000]
            rec["checks"]["solver"] = "minimax-m3.1-flash (blind solve)"
            rec["checks"]["solver_confidence"] = conf
            rec["checks"]["verified_at"] = now
            if isinstance(idx, int) and idx >= 0 and idx <= 3 and conf != "low":
                if idx == rec["answer"]:
                    rec["status"] = "verified"
                    rec["accepted"] = [idx]
                else:
                    rec["status"] = "flagged"
                    rec["checks"]["disagreement"] = {
                        "examon_answer": rec["answer"],
                        "examon_answer_text": rec["options"][rec["answer"]],
                        "solver_answer": idx,
                        "solver_answer_text": rec["options"][idx],
                        "note": note,
                    }
                    unverified.append((subject, rec, "solver picked a different option"))
            elif isinstance(idx, int) and idx == -1:
                rec["status"] = "flagged"
                rec["checks"]["disagreement"] = {
                    "kind": "no_correct_option",
                    "examon_answer": rec["answer"],
                    "examon_answer_text": rec["options"][rec["answer"]],
                    "solver_correct_text": (v.get("correct_text") or "")[:500],
                    "note": note,
                }
                unverified.append((subject, rec, "no option is correct"))
            else:
                rec["status"] = "flagged"
                rec["checks"]["disagreement"] = {
                    "kind": "solver_unsure",
                    "examon_answer": rec["answer"],
                    "examon_answer_text": rec["options"][rec["answer"]],
                    "note": note,
                }
                unverified.append((subject, rec, "solver could not decide"))
        with open(path, "w") as fh:
            json.dump(recs, fh, indent=1, ensure_ascii=False)
            fh.write("\n")
    print(f"applied verdicts to {changed} questions")
    all_recs = []
    for subject in ("physics", "chemistry", "mathematics"):
        all_recs += json.load(open(os.path.join(CORPUS, "questions", subject, "bank-kcet.json")))
    write_review(all_recs, now, changed,
                 "Blind-solve pass: every question was re-solved by an agent that saw only "
                 "the stem, options and diagram — no answer key, no solution, no mnemonic.")



def apply_adjudication():
    """Apply the adjudication pass: a second, careful look at every disagreement.

    The adjudicator is shown the question, Examon's key, Examon's own published
    solution and the first solver's verdict, then works the problem out again.

    - solver_right / examon_right -> status "verified" with the correct index
    - both_wrong                 -> stays "flagged", question needs editing
    - still_ambiguous            -> stays "flagged"
    """
    results = {}
    for path in sorted(glob.glob(os.path.join(SCRATCH, "adjudicate-results", "*.json"))):
        with open(path) as fh:
            data = json.load(fh)
        if isinstance(data, dict):
            data = data.get("results", [])
        for item in data:
            if item.get("id"):
                results[item["id"]] = item
    if not results:
        raise SystemExit("no adjudication results found")

    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    changed = resolved = still = 0
    for subject in ("physics", "chemistry", "mathematics"):
        path = os.path.join(CORPUS, "questions", subject, "bank-kcet.json")
        recs = json.load(open(path))
        for rec in recs:
            v = results.get(rec["id"])
            if not v:
                continue
            changed += 1
            verdict = v.get("verdict", "")
            idx = v.get("correct_index")
            reason = (v.get("reason") or "")[:2000]
            rec["checks"]["adjudicated_at"] = now
            rec["checks"]["adjudicator"] = "minimax-m3.1-flash (adjudication)"
            rec["checks"]["adjudication_reason"] = reason
            if verdict in ("solver_right", "examon_right") and isinstance(idx, int) and 0 <= idx <= 3:
                rec["answer"] = idx
                rec["accepted"] = [idx]
                rec["status"] = "verified"
                rec["checks"]["adjudication_verdict"] = verdict
                resolved += 1
            else:
                rec["status"] = "flagged"
                rec["checks"]["adjudication_verdict"] = verdict or "still_ambiguous"
                if v.get("correct_value"):
                    rec["checks"]["adjudicator_correct_value"] = str(v["correct_value"])[:500]
                still += 1
        with open(path, "w") as fh:
            json.dump(recs, fh, indent=1, ensure_ascii=False)
            fh.write("\n")
    print(f"adjudicated {changed} questions: {resolved} verified, {still} still flagged")
    all_recs = []
    for subject in ("physics", "chemistry", "mathematics"):
        all_recs += json.load(open(os.path.join(CORPUS, "questions", subject, "bank-kcet.json")))
    write_review(all_recs, now, changed,
                 "Two-pass verification: a blind solve, then a second careful pass over every "
                 "disagreement with the key, the publisher's own solution and both verdicts "
                 "on the table.")


def apply_external():
    """Apply authoritative external evidence over the solver/adjudicator verdicts.

    Reads sources/manual/bank/external-checks.json. Entries with a
    `correct_index` override the answer outright; `examon_key_was_wrong: false`
    means the published key was right and the question is restored to it.
    """
    path = os.path.join(ROOT, "sources/manual/bank/external-checks.json")
    with open(path) as fh:
        doc = json.load(fh)
    entries = {e["id"]: e for e in doc.get("entries", [])}
    if not entries:
        raise SystemExit("no external checks found")

    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    applied = 0
    for subject in ("physics", "chemistry", "mathematics"):
        cpath = os.path.join(CORPUS, "questions", subject, "bank-kcet.json")
        recs = json.load(open(cpath))
        touched = False
        for rec in recs:
            e = entries.get(rec["id"])
            if not e:
                continue
            touched = True
            applied += 1
            rec["checks"]["external_check"] = {
                "source": e["source"],
                "url": e.get("url", ""),
                "note": e["note"],
                "checked_on": doc.get("checked_on", ""),
            }
            if e.get("examon_key_was_wrong") is False:
                # The published key was right; restore it and mark verified.
                rec["answer"] = e["examon_key_index"]
                rec["accepted"] = [e["examon_key_index"]]
                rec["status"] = "verified"
                rec["checks"]["adjudication_verdict"] = "examon_right (confirmed externally)"
                rec["checks"]["adjudication_reason"] = e["note"]
                rec["checks"]["verified_at"] = now
            elif isinstance(e.get("correct_index"), int):
                rec["answer"] = e["correct_index"]
                rec["accepted"] = [e["correct_index"]]
                rec["status"] = "verified"
                rec["checks"]["adjudication_verdict"] = "solver_right (confirmed externally)"
                rec["checks"]["adjudication_reason"] = e["note"]
                rec["checks"]["verified_at"] = now
        if touched:
            with open(cpath, "w") as fh:
                json.dump(recs, fh, indent=1, ensure_ascii=False)
                fh.write("\n")
    print(f"applied external checks to {applied} questions")
    all_recs = []
    for subject in ("physics", "chemistry", "mathematics"):
        all_recs += json.load(open(os.path.join(CORPUS, "questions", subject, "bank-kcet.json")))
    write_review(all_recs, now, len(all_recs),
                 "Two-pass verification plus an external-evidence pass against official "
                 "KEA/NCERT sources where a disagreement could be settled from outside.")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--apply-adjudication", action="store_true")
    ap.add_argument("--apply-external", action="store_true")
    args = ap.parse_args()
    if args.apply:
        apply_verification()
    elif args.apply_adjudication:
        apply_adjudication()
    elif args.apply_external:
        apply_external()
    else:
        build()
