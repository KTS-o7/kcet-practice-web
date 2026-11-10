#!/usr/bin/env python3
"""Apply a blind resolve pass to the questions built from work/ jobs.

Reads the resolve results (and the adjudication results, which take precedence) and
writes, per work/<job>/:

    resolve.json    the blind solver's answer, so assemble.py can count it as an
                    agreeing solver for the question it was solved for
    drop.json       questions that cannot be answered as printed
    overrides.json  questions whose published key is wrong, with the corrected answer

Usage:
    python3 scripts/apply_resolve.py [--results DIR] [--adjudications DIR]

Only work/ is written; corpus/ is rebuilt by scripts/assemble.py afterwards.
"""
import argparse, json, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from resolve_lib import decide, load_results  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PART_MARK = re.compile(r"\n\s*\(([a-j])\)\s")


def part_of(stem):
    m = None
    for m in PART_MARK.finditer(stem or ""):
        pass
    return m.group(1) if m else ""


def load_doc(path):
    try:
        with open(path) as fh:
            return json.load(fh)
    except (OSError, json.JSONDecodeError):
        return {}


def printed_number(qid):
    """The number printed on the paper: the trailing digits, before any part letter."""
    m = re.search(r"(\d+)([a-j]?)$", qid)
    if not m:
        raise ValueError(f"no printed number in {qid}")
    return str(int(m.group(1)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--results", default=os.path.join(ROOT, ".scratch/resolve/results"))
    ap.add_argument("--adjudications", default=os.path.join(ROOT, ".scratch/resolve/adjudicate-results"))
    args = ap.parse_args()

    import glob
    resolved = load_results(sorted(glob.glob(os.path.join(args.results, "*.json"))))
    adjudicated = load_results(sorted(glob.glob(os.path.join(args.adjudications, "*.json"))))

    # every corpus record, so each one can be matched back to its work job
    records = {}
    for path in sorted(glob.glob(os.path.join(ROOT, "corpus/questions/*/*.json"))):
        for rec in json.load(open(path)):
            records[rec["id"]] = (rec, os.path.basename(path))

    jobs = {}
    for qid, (rec, corpus_file) in records.items():
        if rec["status"] != "flagged":
            continue
        job = os.path.basename(corpus_file)[:-len(".json")]
        n = printed_number(qid)
        part = part_of(rec["stem"])
        key = f"{n}{part}" if part else n
        jobs.setdefault(job, {})[qid] = {"number": n, "part": part, "key": key, "rec": rec}

    # A comprehension's sub-questions share one printed number; their answers live in the
    # key file's "parts" mapping, not in the record.
    key_files = {}
    for job in jobs:
        path = os.path.join(ROOT, "work", job, "key.json")
        key_files[job] = json.load(open(path)).get("answers", {}) if os.path.exists(path) else {}

    def effective_key(job, n, part, rec):
        if rec.get("accepted"):
            return rec["accepted"]
        parts = (key_files.get(job, {}).get(n) or {}).get("parts") or {}
        if part and isinstance(parts.get(part), int):
            return [parts[part]]
        return []

    summary = {"publish_key": 0, "publish_corrected": 0, "drop": 0, "flag": 0, "skipped": 0}
    for job, entries in sorted(jobs.items()):
        wd = os.path.join(ROOT, "work", job)
        if not os.path.isdir(wd):
            continue
        # Start from what is already there: a question that a previous run published is
        # no longer flagged, so this run would not see it again.
        resolve = load_doc(os.path.join(wd, "resolve.json")).get("answers", {})
        drops = load_doc(os.path.join(wd, "drop.json"))
        overrides = load_doc(os.path.join(wd, "overrides.json"))
        for qid, info in sorted(entries.items()):
            rec = info["rec"]
            r = resolved.get(qid)
            if not r and qid not in adjudicated:
                summary["skipped"] += 1
                continue
            action, index, reason = decide(rec, r, adjudicated.get(qid),
                                           recorded_key=effective_key(job, info["number"], info["part"], rec))
            if action == "publish_key":
                resolve[info["key"]] = {"choice": index, "confidence": "high",
                                        "note": "blind resolve confirmed the paper's key"}
                summary["publish_key"] += 1
            elif action == "publish_corrected":
                overrides[info["number"]] = {"options": [index], "reason": reason}
                resolve[info["key"]] = {"choice": index, "confidence": "high",
                                        "note": "blind resolve confirmed the corrected answer"}
                summary["publish_corrected"] += 1
            elif action == "drop":
                drops[info["number"]] = reason or "no option carries the correct value; the question is broken as printed"
                summary["drop"] += 1
            else:
                summary["flag"] += 1
        for name, doc in (("resolve.json", {"answers": resolve}),
                          ("drop.json", drops),
                          ("overrides.json", overrides)):
            path = os.path.join(wd, name)
            if doc:
                with open(path, "w") as fh:
                    json.dump(doc, fh, indent=1, ensure_ascii=False)
                    fh.write("\n")
            elif os.path.exists(path):
                os.remove(path)
    print("apply_resolve:", json.dumps(summary))


if __name__ == "__main__":
    main()
