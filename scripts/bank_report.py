#!/usr/bin/env python3
"""Summary report for the KCET practice bank, corpus: status, chapters, and the shape of
whatever is still flagged."""
import json
import os
import re
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORPUS = os.path.join(ROOT, "corpus/questions")
CHAPTERS = json.load(open(os.path.join(ROOT, "corpus/chapters.json")))
names = {c["id"]: c["name"] for sub in CHAPTERS.values() for c in sub}

recs = []
for subject in ("physics", "chemistry", "mathematics"):
    with open(os.path.join(CORPUS, subject, "bank-kcet.json")) as fh:
        recs += json.load(fh)

print(f"total questions: {len(recs)}")
print("status:", dict(Counter(r["status"] for r in recs)))
print("in_syllabus:", dict(Counter(r["in_syllabus"] for r in recs)))
print("difficulty:", dict(Counter(r["difficulty"] for r in recs)))
print()

# per subject
for subject in ("physics", "chemistry", "mathematics"):
    sub = [r for r in recs if r["subject"] == subject]
    ok = sum(1 for r in sub if r["status"] == "verified")
    bad = len(sub) - ok
    print(f"{subject:12} {len(sub):>5} questions   verified {ok:>5}   flagged {bad:>4}   "
          f"({100*ok/len(sub):.1f}% clean)")

print("\nflagged by chapter (only chapters with flags):")
per_ch = defaultdict(lambda: [0, 0])
for r in recs:
    per_ch[(r["subject"], r["chapter"])][0 if r["status"] == "verified" else 1] += 1
for (subject, chapter), (ok, bad) in sorted(per_ch.items()):
    if bad:
        print(f"  {subject:12} {names.get(chapter, chapter):<48} flagged {bad:>3} / {ok+bad:>4}")

print("\nflagged by topic (>= 2 flagged, shows the systematic families):")
per_topic = Counter(r["topic"] for r in recs if r["status"] == "flagged")
for topic, n in per_topic.most_common():
    if n >= 2:
        print(f"  {n:>3}  {topic}")

print("\nflagged by source file:")
per_file = Counter(r["source"]["file"].split("/")[-1] for r in recs if r["status"] == "flagged")
for f, n in per_file.most_common():
    print(f"  {n:>3}  {f}")

# how many flagged items came from questions Examon itself already doubted
examon_flagged = [r for r in recs if r["status"] == "flagged"
                  and (r["checks"].get("examon_audit_issues") or r["checks"].get("examon_suggested_answer") is not None)]
print(f"\nof the flagged questions, {len(examon_flagged)} were ones Examon's own audit had already doubted")

# chapter totals for the app
print("\nchapter coverage (verified questions only):")
for subject in ("physics", "chemistry", "mathematics"):
    counts = Counter(r["chapter"] for r in recs if r["subject"] == subject and r["status"] == "verified")
    print(f"  {subject}: {len(counts)} chapters, {sum(counts.values())} questions")
