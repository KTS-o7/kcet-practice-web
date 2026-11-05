#!/usr/bin/env bash
# Ship exactly the commit that is on GitHub's main, nothing else.
#
#   1. Refuse unless this folder is on main, has no uncommitted changes to tracked files,
#      and main here is the same commit as main on GitHub.
#   2. Build from a clean export of that commit (git archive), not from this folder,
#      so local edits, other sessions' work and gitignored files can never leak in.
#   3. Stamp the commit into the binary; after the restart, /healthz must report it.
#   4. Roll back to the previous binary if the new one doesn't come up.
#
# The database is never touched: only $DIR/kcet is replaced.
# The question bank is shipped as committed. scripts/assemble.py is NOT run here; run it by hand
# after extracting new papers, review `git diff corpus/`, and commit (see docs/deploy.md).
#
# scripts/deploy.sh --build-only   builds the current commit the same clean way and ships nothing
#                                  (works on any branch; uncommitted edits are still left out).
#
# Settings come from deploy.env (gitignored; see deploy.env.example). Server setup is documented privately.
set -euo pipefail
cd "$(dirname "$0")/.."
repo=$(pwd)
die() { echo "deploy: $*" >&2; exit 1; }
build_only=false
[ "${1:-}" = "--build-only" ] && build_only=true

[ -f deploy.env ] || die "missing deploy.env (copy deploy.env.example)"
set -a; . ./deploy.env; set +a
: "${HOST:?}" "${DIR:?}" "${URL:?}" "${OWNER:=deploy}"
BRANCH=main

# 1. Guardrails (a build-only run skips them: it ships nothing)
if ! $build_only; then
  branch=$(git rev-parse --abbrev-ref HEAD)
  [ "$branch" = "$BRANCH" ] || die "this folder is on '$branch'. Deploys only ship '$BRANCH': git checkout $BRANCH"
  if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
    git status --short --untracked-files=no >&2
    die "uncommitted changes (above). Commit them through a PR, or stash them, before deploying"
  fi
  git fetch -q origin "$BRANCH"
  local_sha=$(git rev-parse HEAD)
  remote_sha=$(git rev-parse "origin/$BRANCH")
  [ "$local_sha" = "$remote_sha" ] || die "local $BRANCH ($(git rev-parse --short HEAD)) is not GitHub's $BRANCH ($(git rev-parse --short "origin/$BRANCH")). Run: git pull --ff-only (or push)"
fi
local_sha=$(git rev-parse HEAD)
sha=$(git rev-parse --short=12 HEAD)
echo "$($build_only && echo building || echo deploying) $sha: $(git log -1 --format=%s)"

# 2. Clean build from the commit (only what the binary embeds: Go files, web/, corpus/)
build=$(mktemp -d)
trap 'rm -rf "$build"' EXIT
git archive "$local_sha" -- go.mod go.sum '*.go' web corpus | tar -x -C "$build"
(cd "$build/web" && bun install --frozen-lockfile && bunx tsc -b --noEmit && bun run build)
mkdir -p dist
(cd "$build" && GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -ldflags="-s -w -X main.version=$sha" -o "$repo/dist/kcet" .)
echo "built dist/kcet ($(du -h dist/kcet | cut -f1)) from $sha"
$build_only && { echo "build only: nothing shipped"; exit 0; }

# 3. Ship and restart
scp -q dist/kcet "$HOST:$DIR/kcet.new"
ssh "$HOST" "set -e
  cd $DIR
  chown $OWNER:$OWNER kcet.new && chmod 755 kcet.new
  [ -f kcet ] && cp -p kcet kcet.prev
  mv kcet.new kcet
  systemctl restart kcet"

# 4. The new binary must answer with the new version, or we roll back
for i in $(seq 1 15); do
  if health=$(curl -fsS --max-time 5 "$URL/healthz" 2>/dev/null) && [[ "$health" == *"\"version\":\"$sha\""* ]]; then
    echo "healthy: $health"
    exit 0
  fi
  sleep 1
done
echo "health check failed (last: ${health:-no answer}), rolling back" >&2
ssh "$HOST" "set -e; cd $DIR; [ -f kcet.prev ] && mv kcet.prev kcet && systemctl restart kcet"
exit 1
