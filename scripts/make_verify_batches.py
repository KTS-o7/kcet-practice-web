#!/usr/bin/env python3
"""Split the Examon verification worklist into blind-solve batches.

The batches deliberately omit Examon's answer key, solutions and mnemonics so
the solver has to derive the answer itself. The corpus answer is compared
afterwards by scripts/build_bank_corpus.py --apply.
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.join(ROOT, ".scratch/bank/verify-worklist.json")
OUT = os.path.join(ROOT, ".scratch/bank/batches")
PER_BATCH = 30

os.makedirs(OUT, exist_ok=True)
for stale in os.listdir(OUT):
    os.remove(os.path.join(OUT, stale))

work = json.load(open(WORK))
batches = []
for subject in ("physics", "chemistry", "mathematics"):
    items = [q for q in work if q["subject"] == subject]
    for i in range(0, len(items), PER_BATCH):
        chunk = items[i:i + PER_BATCH]
        name = f"{subject}-{i // PER_BATCH + 1:02d}"
        batches.append((name, chunk))

for name, chunk in batches:
    payload = []
    for q in chunk:
        item = {
            "id": q["id"],
            "subject": q["subject"],
            "chapter": q["chapter"],
            "topic": q["topic"],
            "stem": q["stem"],
            "options": q["options"],
        }
        if q.get("diagram"):
            item["diagram"] = q["diagram"]
        payload.append(item)
    with open(os.path.join(OUT, f"{name}.json"), "w") as fh:
        json.dump({"batch": name, "questions": payload}, fh, indent=1, ensure_ascii=False)

print(f"{len(work)} questions -> {len(batches)} batches of <= {PER_BATCH}")
for name, chunk in batches:
    print(f"  {name}: {len(chunk)}")
