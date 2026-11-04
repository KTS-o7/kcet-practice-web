#!/usr/bin/env bash
# Show the "report a problem" feedback he has sent from the app (newest first).
ssh "${HOST:-personal}" "sqlite3 -header -column /opt/kcet/data/kcet.db \"SELECT datetime(r.created_at,'unixepoch','localtime') AS at, u.username AS who, r.qid, r.note FROM reports r JOIN users u ON u.id = r.user_id ORDER BY r.created_at DESC LIMIT ${1:-50};\""
