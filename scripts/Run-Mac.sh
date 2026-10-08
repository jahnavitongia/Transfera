#!/bin/bash
set -euo pipefail
source "$(dirname "$0")/Mac-Env.sh"
if [ ! -x "$NODE_DIR/bin/node" ] || [ ! -x "$MONGO_DIR/bin/mongod" ] || [ ! -f backend/.env ]; then
  echo "Run bash scripts/Setup-Mac.sh first." >&2
  exit 1
fi
case "${1:-}" in
  database)
    mkdir -p "$STATE_DIR/database"
    echo "Starting database. Keep this Terminal open. Then start the backend in another Terminal."
    exec "$MONGO_DIR/bin/mongod" --dbpath "$STATE_DIR/database" --logpath "$STATE_DIR/mongodb.log" --logappend --bind_ip 127.0.0.1 --port 27018 ;;
  backend)
    npm run seed
    exec npm run backend ;;
  frontend) exec npm run frontend ;;
  check) exec npm run check:demo ;;
  *) echo "Use: bash scripts/Run-Mac.sh database|backend|frontend|check" >&2; exit 1 ;;
esac
