#!/usr/bin/env bash
# Copies everything needed to rebuild kitefolio.com onto this PC, so nothing is
# lost if the server goes away (owner's request, October 2026).
#
#   bash scripts/backup-live.sh
#
# Each run makes C:\Users\binas\Kitefolio-Backups\<date>\ with:
#   database.dump    the whole live database (pg_dump, custom format; restore with pg_restore)
#   server.env       the server's settings and secrets (keep this folder private)
#   Caddyfile, docker-compose.yml, DEPLOYED_COMMIT   how the server is set up
#   code.bundle      the full git history, all branches (git clone code.bundle); newest 2 backups only
# The newest 15 backups are kept; older ones are deleted.
# Windows Task Scheduler runs it every two days ("Kitefolio backup").

set -euo pipefail

SERVER=fuccura
REMOTE_DIR=/opt/fuccura
ROOT="/c/Users/binas/Kitefolio-Backups"
KEEP=15
PROJECT="$(cd "$(dirname "$0")/.." && pwd)"

stamp="$(date +%Y-%m-%d_%H%M)"
target="$ROOT/$stamp"
mkdir -p "$target"
log() { echo "$(date '+%Y-%m-%d %H:%M') $*" | tee -a "$ROOT/backup.log"; }

log "Backup to $target"

# The database, dumped inside the db container (low priority, so visitors aren't slowed).
ssh -o ConnectTimeout=30 "$SERVER" \
  "cd $REMOTE_DIR && nice -n 19 docker compose exec -T db sh -c 'pg_dump -U \$POSTGRES_USER -d \$POSTGRES_DB -Fc'" \
  >"$target/database.dump"

# The server's own files that aren't in git.
for file in .env Caddyfile docker-compose.yml DEPLOYED_COMMIT; do
  name="$file"
  [ "$file" = ".env" ] && name="server.env"
  scp -q -o ConnectTimeout=30 "$SERVER:$REMOTE_DIR/$file" "$target/$name" || log "  could not copy $file"
done

# The code, all branches, independent of GitHub.
git -C "$PROJECT" bundle create "$target/code.bundle" --all 2>/dev/null

# A dump smaller than 100 KB means something went wrong.
size=$(wc -c <"$target/database.dump")
if [ "$size" -lt 100000 ]; then
  log "  FAILED: database dump is only $size bytes"
  exit 1
fi
log "  ok: database $((size / 1024)) KB, code $(($(wc -c <"$target/code.bundle") / 1024)) KB"

# Keep the newest backups only.
ls -1d "$ROOT"/20*/ 2>/dev/null | sort | head -n -"$KEEP" | while read -r old; do
  rm -rf "$old"
  log "  removed old backup $old"
done

# The code bundle is large (hundreds of MB) and git keeps history anyway: keep it in the newest 2 only.
ls -1d "$ROOT"/20*/ 2>/dev/null | sort | head -n -2 | while read -r old; do
  rm -f "$old/code.bundle"
done
