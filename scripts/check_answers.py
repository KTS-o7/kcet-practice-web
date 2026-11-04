"""Compare a solver's answers with the answer key.
  python3 -I scripts/check_answers.py work/<job> solve.json --numbers-only   -> just the disagreeing question numbers (keeps the next solver blind)
  python3 -I scripts/check_answers.py work/<job> sonnet.json                -> full comparison incl. key values"""
import json, sys, os
wd, solver = sys.argv[1], sys.argv[2]
blind = "--numbers-only" in sys.argv
key = json.load(open(os.path.join(wd, "key.json")))["answers"]
solve = json.load(open(os.path.join(wd, solver)))["answers"]
qs = [str(q["number"]) for q in json.load(open(os.path.join(wd, "questions.json")))["questions"]]
items = []
for n in sorted(qs, key=int):
    k, s = key.get(n), solve.get(n)
    if k is None:
        items.append({"number": int(n), "reason": "no key entry"}); continue
    if k.get("grace") or not k.get("options"):
        continue
    if s is None or s.get("choice") not in k["options"]:
        items.append({"number": int(n)} if blind else {"number": int(n), "key": k["options"], "solver": None if s is None else s.get("choice")})
if blind:
    print(json.dumps({"disagreeing_numbers": [i["number"] for i in items]}))
else:
    print(json.dumps({"questions": len(qs), "disagreements": len(items), "items": items}, indent=1))
