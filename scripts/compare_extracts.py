"""Diff two independent extractions. Usage: python3 -I scripts/compare_extracts.py work/<job>"""
import json, re, sys, os, unicodedata
wd = sys.argv[1]
a = {q["number"]: q for q in json.load(open(os.path.join(wd, "extract_a.json")))["questions"]}
b = {q["number"]: q for q in json.load(open(os.path.join(wd, "extract_b.json")))["questions"]}

def norm(s):
    s = unicodedata.normalize("NFKC", s or "")
    s = re.sub(r"\\(,|;|:|!|quad|qquad| )", "", s)        # LaTeX spacing
    s = re.sub(r"\\(mathrm|text|rm|mathit|operatorname)\{([^}]*)\}", r"\2", s)
    s = re.sub(r"\\left|\\right|\\displaystyle|\$", "", s)
    s = re.sub(r"[\s{}]", "", s)
    return s.lower()

issues = []
for n in sorted(set(a) | set(b)):
    if n not in a or n not in b:
        issues.append({"number": n, "field": "missing", "a": n in a, "b": n in b}); continue
    qa, qb = a[n], b[n]
    if norm(qa.get("stem")) != norm(qb.get("stem")):
        issues.append({"number": n, "field": "stem", "a": qa.get("stem"), "b": qb.get("stem")})
    oa, ob = qa.get("options") or [], qb.get("options") or []
    if len(oa) != 4 or len(ob) != 4:
        issues.append({"number": n, "field": "option_count", "a": len(oa), "b": len(ob)})
    for i, (x, y) in enumerate(zip(oa, ob)):
        if norm(x) != norm(y):
            issues.append({"number": n, "field": f"option_{'ABCD'[i]}", "a": x, "b": y})
    if bool(qa.get("diagram")) != bool(qb.get("diagram")):
        issues.append({"number": n, "field": "diagram_presence", "a": qa.get("diagram"), "b": qb.get("diagram")})
print(json.dumps({"a_count": len(a), "b_count": len(b), "issue_count": len(issues), "issues": issues}, indent=1, ensure_ascii=False))
