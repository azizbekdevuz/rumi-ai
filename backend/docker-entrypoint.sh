#!/bin/sh
# Wait for Postgres, apply Alembic migrations, then serve.
# The container starts as root so named volumes can be made writable,
# then the server process runs as appuser.
set -eu

mkdir -p /app/media /app/logs
if ! gosu appuser python -c 'import os, sys; paths=("/app/media","/app/logs"); sys.exit(0 if all(os.access(p, os.W_OK) for p in paths) else 1)'; then
  # Some bind mounts (for example Docker Desktop host folders) reject chown.
  # Nothing in the app writes here today, so warn instead of failing startup.
  chown appuser:appuser /app/media /app/logs 2>/dev/null \
    || echo "warning: /app/media or /app/logs is not writable by appuser" >&2
fi

# In production, build the URL from the parts Compose injects so a stray
# localhost DATABASE_URL cannot point the container at itself. Passwords
# are percent-encoded and never printed.
if [ "${APP_ENV:-}" = "production" ] && [ -n "${DB_USER:-}" ] && [ -n "${DB_PASSWORD:-}" ]; then
  export DB_HOST="${DB_HOST:-db}"
  export DB_PORT="${DB_PORT:-5432}"
  export DB_NAME="${DB_NAME:-rumi_ai}"
  DATABASE_URL="$(python -c 'from urllib.parse import quote_plus; import os; print("postgresql://%s:%s@%s:%s/%s" % (quote_plus(os.environ["DB_USER"]), quote_plus(os.environ["DB_PASSWORD"]), os.environ["DB_HOST"], os.environ["DB_PORT"], os.environ["DB_NAME"]))')"
  export DATABASE_URL
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set" >&2
  exit 1
fi

python - <<'PY'
import os
import sys
import time

import psycopg2

url = os.environ["DATABASE_URL"]
for attempt in range(1, 31):
    try:
        connection = psycopg2.connect(url)
        connection.close()
        raise SystemExit(0)
    except Exception as exc:
        print(
            f"database not ready (attempt {attempt}/30): {type(exc).__name__}",
            file=sys.stderr,
        )
        time.sleep(2)
print("database did not become ready in time", file=sys.stderr)
raise SystemExit(1)
PY

cd /app
gosu appuser alembic upgrade head
exec gosu appuser uvicorn main:app --host 0.0.0.0 --port 8000
