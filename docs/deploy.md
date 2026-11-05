# Deploying

`scripts/deploy.sh` ships **exactly the commit on GitHub's `main`**. Nothing else in your project folder goes live.

```sh
git checkout main && git pull --ff-only
scripts/deploy.sh
```

It refuses to run unless:

- the folder is on `main`,
- no tracked file has uncommitted changes, and
- your `main` is the same commit as GitHub's `main`. If not, pull or push first.

Then it:

1. Exports that commit with `git archive` into a temporary folder and builds there. It exports only the Go files, `web/` and `corpus/`, which is everything the binary embeds. Uncommitted edits, other sessions' branches, `work/`, and gitignored files can't get in.
2. Installs frontend packages from the committed `web/bun.lock` (`--frozen-lockfile`), so every build uses the same versions.
3. Stamps the commit into the binary. `https://<site>/healthz` reports it as `"version"`, so you can always see what's live.
4. Copies the binary to the server, keeps the previous one as `kcet.prev`, and restarts the service.
5. Waits until `/healthz` reports the **new** version. If it doesn't within 15 seconds, it rolls back to `kcet.prev`.

Only the binary (`$DIR/kcet`) is replaced. The database (`$DIR/data/kcet.db`) is never touched, and schema migrations are additive.

To check that a commit builds without shipping anything, run `scripts/deploy.sh --build-only`. It builds the current commit the same clean way and works on any branch.

## The question bank

Deploys ship `corpus/` as committed. **`scripts/assemble.py` is not part of deploying.**

To fix a question, edit its JSON under `corpus/questions/` (stem, options, answer or status), open a PR, merge it, then deploy.

Run `scripts/assemble.py` only after extracting new papers into `work/`:

```sh
python3 -I scripts/assemble.py
git diff --stat corpus/     # review before committing
```

`assemble.py` rebuilds the past-paper, Exemplar and NEET files from scratch, using `work/<job>/`. That folder exists only on the machine that did the extraction, and it's gitignored. So re-running assemble **undoes hand edits** to those files. Check `git diff corpus/` and re-apply any fixes it reverts before committing.

The practice-bank files (`corpus/questions/*/bank-kcet.json`) are different. Assemble only re-applies the "a blind solver must agree with the key" rule to them, so hand edits there survive.
