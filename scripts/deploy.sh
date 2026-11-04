#!/usr/bin/env bash
# Build locally, ship the single binary, restart, health-check, roll back on failure.
# Settings come from deploy.env (gitignored; see deploy.env.example). Server setup is documented privately.
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f deploy.env ] || { echo "missing deploy.env (copy deploy.env.example)" >&2; exit 1; }
set -a; . ./deploy.env; set +a
: "${HOST:?}" "${DIR:?}" "${URL:?}" "${OWNER:=deploy}"

(cd web && bun install && bunx tsc -b --noEmit && bun run build)
python3 -I scripts/assemble.py >/dev/null
mkdir -p dist
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o dist/kcet .
echo "built dist/kcet ($(du -h dist/kcet | cut -f1))"

scp -q dist/kcet "$HOST:$DIR/kcet.new"
ssh "$HOST" "set -e
  cd $DIR
  chown $OWNER:$OWNER kcet.new && chmod 755 kcet.new
  [ -f kcet ] && cp -p kcet kcet.prev
  mv kcet.new kcet
  systemctl restart kcet"

for i in $(seq 1 15); do
  if curl -fsS --max-time 5 "$URL/healthz" >/dev/null; then
    echo "healthy: $(curl -fsS "$URL/healthz")"
    exit 0
  fi
  sleep 1
done
echo "health check failed, rolling back" >&2
ssh "$HOST" "set -e; cd $DIR; [ -f kcet.prev ] && mv kcet.prev kcet && systemctl restart kcet"
exit 1
