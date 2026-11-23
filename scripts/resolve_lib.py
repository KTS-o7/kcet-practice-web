"""Decide what to do with a question that is still flagged, given a fresh blind solve
and, where the blind solve could not settle it, an adjudication.

Shared by scripts/build_bank_corpus.py (the Examon bank) and scripts/apply_resolve.py
(the questions built from work/ jobs), so both sides apply the same rule.

The rule:
  * a question is published with the answer the blind solve agrees with, and with
    nothing else;
  * an adjudication (which saw the source: the paper's page images, the official key
    cells, the publisher's worked solution) can settle a question the blind solve
    could not;
  * a corrected key is only published when the blind solve reached the same answer,
    unless an authoritative outside source (an official paper, NCERT) establishes it;
  * a question whose four options carry no correct value at all cannot be answered as
    printed, so it is dropped rather than published with a made-up key.
"""
import json

BROKEN = -1          # the solver found no correct option
UNDECIDED = -2       # the solver could not decide


def load_results(paths):
    """Read solver result files: [{"id", "correct_index", "confidence", "note", ...}]."""
    results = {}
    for path in paths:
        try:
            with open(path) as fh:
                data = json.load(fh)
        except (OSError, json.JSONDecodeError):
            continue
        if isinstance(data, dict):
            data = data.get("results", [])
        for item in data:
            if item.get("id"):
                results[item["id"]] = item
    return results


def _resolve_index(resolve):
    return resolve.get("correct_index") if resolve else None


def _adjudicated_correct(adjudication):
    """(verdict, index) of an adjudication, or (None, None)."""
    if not adjudication:
        return (None, None)
    return (adjudication.get("verdict"), adjudication.get("correct_index"))


def _broken(rec, resolve, verdict):
    """True when the question cannot be answered as printed and nothing refutes that."""
    if resolve is None:
        return False
    if _resolve_index(resolve) != BROKEN and "broken" not in (resolve.get("note") or "").lower():
        return False
    checks = rec.get("checks", {})
    dis = checks.get("disagreement") or {}
    if checks.get("flag_reason") == "no option carries the correct value":
        return True
    if verdict == "both_wrong":
        return True
    if "options do not contain" in (checks.get("adjudication_reason") or "").lower():
        return True
    if dis.get("kind") == "no_correct_option":
        return True
    return False


def decide(rec, resolve, adjudication=None, external=None, examon_key=None, recorded_key=None):
    """-> (action, index, reason)

    action: publish_key | publish_corrected | drop | flag
    """
    checks = rec.get("checks", {})
    verdict, adj_index = _adjudicated_correct(adjudication)
    resolve_index = _resolve_index(resolve)
    adj_reason = (adjudication or {}).get("reason", "")

    # 1. the adjudication has the last word on what the source says
    if verdict == "drop":
        return ("drop", None, adj_reason or "no option carries the correct value; the question is broken as printed")
    if verdict == "flag":
        return ("flag", None, adj_reason or "the adjudication could not settle it")
    if verdict == "publish_key":
        if examon_key is not None:
            return ("publish_key", examon_key, adj_reason or "the adjudication confirms the published key")
        if recorded_key:
            return ("publish_key", recorded_key[0], adj_reason or "the adjudication confirms the paper's key")
        return ("flag", None, "the adjudication confirms the published key but the key is unknown")
    if verdict == "publish_corrected":
        if not isinstance(adj_index, int) or not 0 <= adj_index <= 3:
            return ("flag", None, "the adjudication corrected the key without giving an answer")
        confirmed_by_resolve = resolve_index == adj_index
        confirmed_by_source = external is not None and external.get("examon_key_was_wrong") is True \
            and external.get("correct_index") == adj_index
        if confirmed_by_resolve or confirmed_by_source:
            return ("publish_corrected", adj_index, adj_reason or "the blind resolve agrees with the corrected answer")
        return ("flag", None, "the adjudication corrected the key but no blind solve confirms it")

    # 2. no adjudication: the blind solve decides
    if resolve is None:
        return ("flag", None, "no blind solve")
    if resolve_index == UNDECIDED:
        return ("flag", None, "the blind resolve could not decide")
    if _broken(rec, resolve, checks.get("adjudication_verdict")):
        return ("drop", None, "no option carries the correct value; the question is broken as printed")

    if examon_key is not None:
        return _decide_examon(rec, resolve, external, examon_key)
    return _decide_work(rec, resolve, recorded_key or [])


def _decide_examon(rec, resolve, external, examon_key):
    checks = rec.get("checks", {})
    idx = resolve.get("correct_index")
    adj = checks.get("adjudication_correct_index")
    verdict = checks.get("adjudication_verdict")
    published = rec.get("answer")
    computed = str(checks.get("solver") or "").startswith("computed")

    if external is not None and external.get("examon_key_was_wrong") is False:
        # An authoritative outside source confirms the published key.
        return ("publish_key", examon_key, "an external source confirms the published key")
    if external is not None and external.get("examon_key_was_wrong") is True:
        # The published key is known wrong: the corrected answer needs the blind solve.
        if idx == external.get("correct_index"):
            return ("publish_corrected", idx, "the blind resolve agrees with the externally established answer")
        return ("flag", None, "the blind resolve disagrees with the externally established answer")

    corrected = adj if isinstance(adj, int) and 0 <= adj < 4 else None
    if computed and isinstance(published, int) and published != examon_key:
        corrected = published
    if corrected is not None:
        if idx == corrected:
            return ("publish_corrected", idx, "the blind resolve agrees with the corrected answer")
        return ("flag", None, "the blind resolve disagrees with the corrected answer")

    if verdict == "both_wrong":
        return ("flag", None, "the adjudication found neither the key nor the solver right")
    if idx == examon_key:
        if isinstance(adj, int) and 0 <= adj < 4 and adj != examon_key:
            return ("flag", None, "the blind resolve agrees with the published key, the adjudication refutes it")
        return ("publish_key", examon_key, "the blind resolve agrees with the published key")
    return ("flag", None, "the blind resolve agrees with neither the published key nor the adjudication")


def _decide_work(rec, resolve, recorded_key):
    idx = resolve.get("correct_index")
    if idx in (recorded_key or []):
        return ("publish_key", idx, "the blind resolve agrees with the paper's key")
    return ("flag", None, "the blind resolve disagrees with the paper's key")
