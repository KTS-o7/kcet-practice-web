"""Diff two independent answer-key readings. Usage: python3 -I scripts/compare_keys.py work/<job>"""
import json, sys, os
wd = sys.argv[1]
a = json.load(open(os.path.join(wd, "key_a.json")))
b = json.load(open(os.path.join(wd, "key_b.json")))
issues = []
if a.get("version") != b.get("version"):
    issues.append({"field": "version", "a": a.get("version"), "b": b.get("version")})
for n in sorted(set(a["answers"]) | set(b["answers"]), key=int):
    x, y = a["answers"].get(n), b["answers"].get(n)
    if x is None or y is None or sorted(x["options"]) != sorted(y["options"]) or bool(x.get("grace")) != bool(y.get("grace")):
        issues.append({"number": int(n), "a": x, "b": y})
print(json.dumps({"a_count": len(a["answers"]), "b_count": len(b["answers"]), "issue_count": len(issues), "issues": issues}, indent=1))
