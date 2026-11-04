"""Render a job's PDFs to page PNGs + per-page text (pdftotext, or tesseract OCR when the text layer is thin).
Usage: python3 -I scripts/prep.py jobs.json   (jobs: [{id, paper_pdf, key_pdfs: [..]}], paths relative to repo root)"""
import json, os, subprocess, sys, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def run(*a):
    return subprocess.run(a, capture_output=True, text=True)

def render(pdf, outdir, prefix, rng=None):
    os.makedirs(outdir, exist_ok=True)
    if glob.glob(os.path.join(outdir, prefix + "-*.png")):
        return
    extra = ["-f", str(rng[0]), "-l", str(rng[1])] if rng else []
    run("pdftoppm", "-r", "150", "-png", *extra, pdf, os.path.join(outdir, prefix))
    for png in sorted(glob.glob(os.path.join(outdir, prefix + "-*.png"))):
        page = int(png.rsplit("-", 1)[1].split(".")[0])
        txt = run("pdftotext", "-layout", "-f", str(page), "-l", str(page), pdf, "-").stdout
        letters = sum(c.isalpha() for c in txt)
        src = "pdftotext"
        if letters < 300 or "\ufffd" in txt:
            txt = run("tesseract", png, "-", "--psm", "4").stdout
            src = "tesseract"
        with open(png[:-4] + ".txt", "w") as f:
            f.write(f"[text source: {src}]\n" + txt)

def main():
    jobs = json.load(open(sys.argv[1]))
    for j in jobs:
        wd = os.path.join(ROOT, "work", j["id"])
        if j.get("paper_pdf"):
            render(os.path.join(ROOT, j["paper_pdf"]), os.path.join(wd, "paper"), "p")
        ranges = j.get("key_ranges") or [None] * len(j.get("key_pdfs", []))
        for i, k in enumerate(j.get("key_pdfs", [])):
            render(os.path.join(ROOT, k), os.path.join(wd, "key"), f"k{i}", ranges[i])
        for i, a in enumerate(j.get("alt_pdfs", [])):
            render(os.path.join(ROOT, a), os.path.join(wd, "alt"), f"a{i}")
        if not os.path.exists(os.path.join(wd, "job.json")) or "alt_pdfs" in j:
            old = json.load(open(os.path.join(wd, "job.json"))) if os.path.exists(os.path.join(wd, "job.json")) else {}
            old.update(j)
            json.dump(old, open(os.path.join(wd, "job.json"), "w"), indent=1)
        print(j["id"], len(glob.glob(os.path.join(wd, "paper", "*.png"))), "paper pages",
              len(glob.glob(os.path.join(wd, "key", "*.png"))), "key pages", flush=True)

main()
