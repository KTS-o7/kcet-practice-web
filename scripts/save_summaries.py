"""Save per-job reconcile summaries from a finished workflow output file and print a quality table.
Usage: python3 -I scripts/save_summaries.py <workflow-output.json>"""
import json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = json.load(open(sys.argv[1]))
res = d["result"] if isinstance(d.get("result"), list) else json.loads(d["result"])
for r in res:
    j = r["id"]; wd = os.path.join(ROOT, "work", j)
    if r.get("failed") or not os.path.isdir(wd):
        print(f"{j}: FAILED"); continue
    json.dump(r.get("recon") or {}, open(os.path.join(wd, "reconcile_summary.json"), "w"), indent=1)
    try:
        k = json.load(open(os.path.join(wd, "key.json")))["answers"]; s = json.load(open(os.path.join(wd, "solve.json")))["answers"]
        keyed = [n for n, v in k.items() if v.get("options")]
        agree = sum(1 for n in keyed if s.get(n, {}).get("choice") in k[n]["options"])
        q = len(json.load(open(os.path.join(wd, "questions.json")))["questions"])
    except Exception as e:
        print(f"{j}: missing files ({e})"); continue
    v = r.get("verify") or {}
    print(f"{j}: {q} Qs, blind {agree}/{len(keyed)}, disputed {v.get('disputed')}, tfix {v.get('transcription_fixed') or []}, kfix {v.get('key_reading_fixed') or []}")
