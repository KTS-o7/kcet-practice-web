#!/usr/bin/env python3
"""Build blind second-solve batches for the questions the first pass disagreed on.

The second solver must be independent of Examon's key, so these batches contain
only the id, the stem, the four options and the diagram. No answer key, no
published solution, no mnemonic, no topic hints.

Input : corpus/questions/<subject>/bank-kcet.json (after --apply)
Output: .scratch/bank/verify2/<batch>.json
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORPUS = os.path.join(ROOT, "corpus/questions")
OUT = os.path.join(ROOT, ".scratch/bank/verify2")
PER_BATCH = 14

os.makedirs(OUT, exist_ok=True)
for stale in os.listdir(OUT):
    os.remove(os.path.join(OUT, stale))

items = []
for subject in ("physics", "chemistry", "mathematics"):
    for rec in json.load(open(os.path.join(CORPUS, subject, "bank-kcet.json"))):
        if rec["status"] == "verified":
            continue
        item = {
            "id": rec["id"],
            "stem": rec["stem"],
            "options": rec["options"],
        }
        for img in rec.get("images", []):
            svg = os.path.join(ROOT, "corpus/images", img)
            if os.path.exists(svg):
                item["diagram"] = open(svg).read()
                break
        items.append(item)

batches = []
for i in range(0, len(items), PER_BATCH):
    chunk = items[i:i + PER_BATCH]
    name = f"solve2-{i // PER_BATCH + 1:02d}"
    batches.append((name, chunk))
    with open(os.path.join(OUT, f"{name}.json"), "w") as fh:
        json.dump({"batch": name, "questions": chunk}, fh, indent=1, ensure_ascii=False)

print(f"{len(items)} questions -> {len(batches)} blind second-solve batches of <= {PER_BATCH}")
for name, chunk in batches:
    print(f"  {name}: {len(chunk)}")
