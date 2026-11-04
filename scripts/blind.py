"""Write questions_blind.json: questions without notes/page refs, so blind solvers can't pick up hints
(e.g. 'circled option C ignored'). Usage: python3 -I scripts/blind.py work/<job>"""
import json, os, sys
wd = sys.argv[1]
qs = json.load(open(os.path.join(wd, "questions.json")))["questions"]
out = [{"number": q["number"], "stem": q["stem"], "options": q["options"], "images": q.get("images", [])} for q in qs]
json.dump({"questions": out}, open(os.path.join(wd, "questions_blind.json"), "w"), indent=1, ensure_ascii=False)
print(len(out), "questions ->", os.path.join(wd, "questions_blind.json"))
