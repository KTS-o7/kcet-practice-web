"""Mechanical LaTeX clean-ups applied to every question before it goes into corpus/.
Fixes seen in imported data:
- matrix/cases/array rows separated by '\\ ' (control space) instead of '\\\\' -> rendered on one line
- '\\text{min^{-1}}' (superscript inside \\text) -> KaTeX parse error
- zero-width spaces (real or written as the literal text '\\u200b') and stray control characters
\\ce{...} is fine: the app loads KaTeX's mhchem extension."""
import re

_ENV = re.compile(r"(\\begin\{([a-zA-Z]*matrix|array|cases|aligned)\})(.*?)(\\end\{\2\})", re.S)
_CTRL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")
_TEXT_SUP = re.compile(r"\\text\{([^{}^]*)\^\{([^{}]*)\}\}")


def _rows(m):
    body = m.group(3)
    if "\\\\" not in body:
        body = re.sub(r"(?<!\\)\\ ", r"\\\\ ", body)
    return m.group(1) + body + m.group(4)


def fix(text):
    if not isinstance(text, str):
        return text
    t = text.replace("\u200b", "").replace("\ufeff", "").replace("\\u200b", "")
    t = _CTRL.sub("", t)
    t = _TEXT_SUP.sub(r"\\text{\1}^{\2}", t)
    return _ENV.sub(_rows, t)


def fix_question(q):
    """In-place: stem, options and any explanation-like fields."""
    for k in ("stem", "solution", "explanation", "mnemonic"):
        if k in q:
            q[k] = fix(q[k])
    q["options"] = [fix(o) for o in q.get("options") or []]
    return q
