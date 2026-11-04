#!/usr/bin/env python3
"""Build adjudication batches for questions where the blind solver disagreed.

The first pass was blind: the solver saw only the stem, options and diagram.
For the disagreements we now hand the solver the question, Examon's own
published solution, Examon's key and the first solver's verdict, and ask it to
work the problem out again from scratch and say which side is right.

Output goes to .scratch/bank/adjudicate/<batch>.json; results are applied by
scripts/build_bank_corpus.py --apply-adjudication.
"""
import json
import os
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORPUS = os.path.join(ROOT, "corpus/questions")
RESULTS = os.path.join(ROOT, ".scratch/bank/verify-results")
OUT = os.path.join(ROOT, ".scratch/bank/adjudicate")
PER_BATCH = 12

os.makedirs(OUT, exist_ok=True)
for stale in os.listdir(OUT):
    os.remove(os.path.join(OUT, stale))

# First-pass verdicts.
verdicts = {}
for path in sorted(glob_paths := __import__("glob").glob(os.path.join(RESULTS, "*.json"))):
    with open(path) as fh:
        data = json.load(fh)
    for item in data.get("results", []):
        verdicts[item["id"]] = item

flagged = []
for subject in ("physics", "chemistry", "mathematics"):
    with open(os.path.join(CORPUS, subject, "bank-kcet.json")) as fh:
        for rec in json.load(fh):
            v = verdicts.get(rec["id"])
            if not v:
                continue
            idx = v.get("correct_index")
            if isinstance(idx, int) and idx >= 0 and idx <= 3 and idx == rec["answer"]:
                continue  # agreed -> already verified
            flagged.append((subject, rec, v))

print(f"{len(flagged)} flagged questions to adjudicate")

batches = []
for subject in ("physics", "chemistry", "mathematics"):
    items = [t for t in flagged if t[0] == subject]
    for i in range(0, len(items), PER_BATCH):
        batches.append((f"{subject}-adj-{i // PER_BATCH + 1:02d}", items[i:i + PER_BATCH]))

for name, chunk in batches:
    payload = []
    for subject, rec, v in chunk:
        idx = v.get("correct_index")
        item = {
            "id": rec["id"],
            "subject": subject,
            "chapter": rec["chapter"],
            "topic": rec["topic"],
            "stem": rec["stem"],
            "options": rec["options"],
            "examon_key_index": rec["answer"],
            "examon_key_text": rec["options"][rec["answer"]],
            "examon_published_solution": rec.get("solution", "")[:1800],
            "first_solver_index": idx,
            "first_solver_text": rec["options"][idx] if isinstance(idx, int) and 0 <= idx <= 3 else None,
            "first_solver_correct_text": v.get("correct_text", ""),
            "first_solver_note": (v.get("note") or "")[:400],
            "first_solver_confidence": v.get("confidence", ""),
        }
        img = rec.get("images")
        if img:
            svg = os.path.join(ROOT, "corpus/images", img[0])
            if os.path.exists(svg):
                item["diagram"] = open(svg).read()
        payload.append(item)
    with open(os.path.join(OUT, f"{name}.json"), "w") as fh:
        json.dump({"batch": name, "questions": payload}, fh, indent=1, ensure_ascii=False)

print(f"{len(batches)} adjudication batches of <= {PER_BATCH}")
for name, chunk in batches:
    print(f"  {name}: {len(chunk)}")
