#!/usr/bin/env python3
"""Final summary for the KCET practice bank, corpus: per-subject verified/flagged counts and
the most common reasons a question is still flagged."""
import json
import os
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORPUS = os.path.join(ROOT, "corpus/questions")

recs = []
for subject in ("physics", "chemistry", "mathematics"):
    path = os.path.join(CORPUS, subject, "bank-kcet.json")
    if os.path.exists(path):
        recs += json.load(open(path))

print("EXAMON KCET CORPUS")
print("=" * 72)
total_v = total_f = 0
for subject in ("physics", "chemistry", "mathematics"):
    sub = [r for r in recs if r["subject"] == subject]
    if not sub:
        continue
    v = sum(1 for r in sub if r["status"] == "verified")
    f = len(sub) - v
    total_v += v
    total_f += f
    pct = 100 * v / len(sub)
    print(f"  {subject:<12} verified {v:>5}   flagged {f:>4}   total {len(sub):>5}   ({pct:.1f}% verified)")
print(f"  {'TOTAL':<12} verified {total_v:>5}   flagged {total_f:>4}   total {len(recs):>5}")

# flag reasons
reasons = Counter()
for r in recs:
    if r["status"] == "verified":
        continue
    reasons[r["checks"].get("flag_reason") or "unclassified"] += 1

print()
print("FLAG REASONS (20 most common)")
print("-" * 72)
if not reasons:
    print("  none")
for reason, n in reasons.most_common(20):
    print(f"  {n:>4}  {reason}")

# finer breakdown of the disagreements by topic
print()
print("FLAGGED BY TOPIC (most affected families)")
print("-" * 72)
topics = Counter(r["topic"] for r in recs if r["status"] != "verified")
for topic, n in topics.most_common(15):
    if n >= 2:
        print(f"  {n:>4}  {topic}")

# how the flagged ones break down by solver behaviour
print()
print("FLAGGED: solver behaviour")
print("-" * 72)
behaviour = Counter()
for r in recs:
    if r["status"] == "verified":
        continue
    dis = r["checks"].get("disagreement", {})
    k = dis.get("kind", "none")
    if k == "different_option" and dis.get("solver_2_answer") is not None:
        behaviour["both solves picked a different option"] += 1
    elif k == "different_option":
        behaviour["first solve picked a different option"] += 1
    elif k == "no_correct_option":
        behaviour["no option is correct"] += 1
    elif k == "low_confidence_agreement":
        behaviour["low-confidence agreement"] += 1
    elif k == "solver_unsure":
        behaviour["solver could not decide"] += 1
    else:
        behaviour["other"] += 1
for k, n in behaviour.most_common():
    print(f"  {n:>4}  {k}")
