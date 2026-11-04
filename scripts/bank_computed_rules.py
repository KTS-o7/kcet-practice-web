#!/usr/bin/env python3
"""Computed external rules for the systematic families in the Examon bank.

Some of Examon's answer keys are wrong by a *systematic* formula error, so checking
one question of the family settles all of them. These rules derive the correct
answer from the stem itself (using the textbook formula the rule is documented
against) and then find the option that carries it.

Each rule returns (expected_value, tolerance) or None when the stem does not match.
"""
import re


def _numbers(text):
    """All plain numbers in a string, LaTeX-stripped."""
    t = re.sub(r"\\[,;:!]", "", text)
    return [float(x) for x in re.findall(r"-?\d+(?:\.\d+)?", t)]


def meter_bridge(stem):
    """S = R(100 - l)/l, with the balance length measured from the known resistance's end.

    The NCERT meter-bridge balance condition is R/S = l/(100 - l), with l the length
    from the end adjacent to R. Cross-checked against Examon's own core-bank items,
    which use this same convention, and against the CBSE Tuts / Shaalaa / GeeksforGeeks
    derivations of the balance condition.
    """
    m = re.search(r"resistance of \$?([\d.]+)\s*\\,?\\?[Ω\\omega]*", stem)
    if not m:
        m = re.search(r"resistance of \$?([\d.]+)", stem)
    if not m:
        return None
    R = float(m.group(1))
    m2 = re.search(r"balance point is at \$?([\d.]+)\s*cm", stem)
    if not m2:
        return None
    l = float(m2.group(1))
    return (R * (100 - l) / l, 0.02, f"S = {R}*(100-{l})/{l} = {R*(100-l)/l:.4g}")


def dipole_e_over_v(stem):
    """E/V = 2/r for a short dipole on its axis.

    NCERT: on the axis E = 2kp/r^3 and V = kp/r^2, so E/V = 2/r. Examon's key
    computes 2/r with r in centimetres instead of metres, a factor of 100.
    """
    m = re.search(r"at a distance \$?([\d.]+)\s*\\,?\\?m from the dipole", stem)
    if not m:
        m = re.search(r"distance \$?([\d.]+)\s*m from the dipole", stem)
    if not m:
        return None
    r = float(m.group(1))
    return (2.0 / r, 0.02, f"E/V = 2/r = 2/{r} = {2.0/r:.4g}")


RULES = {
    "Meter bridge and unknown resistance": meter_bridge,
    "Dipole field-potential relation on axial line": dipole_e_over_v,
}


def expected_for(topic, stem):
    """(value, tolerance, derivation) for a question, or None when no rule applies."""
    fn = RULES.get(topic)
    if not fn:
        return None
    return fn(stem)


def match_option(options, value, tol=0.02):
    """Index of the option whose numeric value matches, or None.

    Tolerant to how the number is written ($12\\,\\Omega$, $12$ m$^{-1}$, 12).
    """
    best, best_err = None, None
    for i, opt in enumerate(options):
        nums = _numbers(opt)
        if not nums:
            continue
        for n in nums:
            if n == 0 and value != 0:
                continue
            err = abs(n - value) / max(abs(value), 1e-9)
            if err <= tol and (best_err is None or err < best_err):
                best, best_err = i, err
    return best
