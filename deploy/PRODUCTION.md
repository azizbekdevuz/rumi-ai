# Production deployment (Ubuntu)

This is the supported production layout:

- Ubuntu host
- Docker Engine and the Docker Compose plugin
- PostgreSQL 17 (`postgres:17-alpine`) in a named volume, not published
- FastAPI in Docker, not published
- Next.js production server published only on `127.0.0.1:3003`
- Ollama on the host
- `book_verse` mounted read-only into the API container
- TLS terminated by Caddy on the host (default ingress)

`backend/docker-compose.yml` is the local development stack. It publishes Postgres, the API, nginx, and Adminer, and still uses PostgreSQL 13 so existing developer volumes keep working. Do not use it on a public machine.

The API container entrypoint waits for Postgres, runs `alembic upgrade head`, then starts Uvicorn as a non-root user. A reboot brings the stack back through the restart policy. The Docker daemon does not apply Compose `depends_on` on reboot; the entrypoint covers that race.

All commands below run from the repository root, for example `/opt/rumi-ai`. To shorten them:

```bash
alias dcp='docker compose --env-file .env.production -f docker-compose.prod.yml'
```

## 1. Install host packages

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
```

Install Docker Engine from the official Ubuntu instructions: https://docs.docker.com/engine/install/ubuntu/

```bash
docker --version
docker compose version
```

Docker Engine 20.10 or newer is required so `host-gateway` resolves `host.docker.internal`.

Install Ollama: https://ollama.com/download/linux

```bash
ollama pull nomic-embed-text:latest
ollama pull qwen2.5:3b
```

Ollama listens on `127.0.0.1` by default, and containers cannot reach that address. Bind it on all interfaces and firewall the port:

```bash
sudo mkdir -p /etc/systemd/system/ollama.service.d
sudo tee /etc/systemd/system/ollama.service.d/override.conf >/dev/null <<'EOF'
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
EOF
sudo systemctl daemon-reload
sudo systemctl enable --now ollama
sudo systemctl restart ollama
```

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw insert 1 allow from 172.16.0.0/12 to any port 11434 proto tcp
sudo ufw deny 11434/tcp
sudo ufw enable
```

The `172.16.0.0/12` rule lets Docker bridge networks reach Ollama; everything else is denied on 11434. UFW does not filter ports that Docker publishes, which is why this Compose file publishes only `127.0.0.1:3003` and nothing for Postgres, the API, or Ollama.

Install Caddy: https://caddyserver.com/docs/install#debian-ubuntu-raspberry-pi-os

## 2. Configure

Clone the repository to `/opt/rumi-ai`. The `book_verse` directory must be present next to `docker-compose.prod.yml`.

```bash
cd /opt/rumi-ai
cp .env.production.example .env.production
chmod 600 .env.production
openssl rand -hex 24   # DB_PASSWORD
openssl rand -hex 32   # SECRET_KEY
```

Fill in `.env.production`:

- `DB_PASSWORD`, `SECRET_KEY` — the generated values. These are blank in the example, so Compose refuses to start until they are set. Postgres therefore never initializes its volume with a placeholder password.
- `APP_BASE_URL` and `ALLOWED_HOSTS` — `https://your.domain`, no trailing slash
- `GOOGLE_REDIRECT_URI` / `KAKAO_REDIRECT_URI` — `https://your.domain/api/auth/google/callback` and `https://your.domain/api/auth/kakao/callback`. Register those exact URLs with the providers. Leave a provider's client id blank to disable it.
- `EMBED_MODEL` and `LLM_MODEL` — must match tags shown by `ollama list`. The example uses `nomic-embed-text:latest`. The Python default, used only when the variable is unset, is `nomic-embed-text-v2-moe:latest`.

`.env.production` is only an interpolation source. No container loads it wholesale. Each service gets an explicit list in `docker-compose.prod.yml`:

| Service | Receives |
| --- | --- |
| `db` | database name, user, password |
| `api` | database parts, `SECRET_KEY`, `ALLOWED_HOSTS`, Ollama/LLM settings, OAuth client IDs, secrets, and redirect URIs |
| `web` | `APP_BASE_URL`, `BACKEND_URL`, `TRUSTED_CLIENT_IP_HEADER`, OAuth client IDs and redirect URIs |

`web` never receives `DB_PASSWORD`, `SECRET_KEY`, or OAuth client secrets.

Production startup also rejects placeholder secrets, the default database password, `DEBUG=true`, and `USE_MOCK=true`.

## 3. Ingress and client-IP contract

Rate limiting is per client IP. The chain is:

1. The ingress overwrites a single header with the real client address.
2. The web container reads only the header named by `TRUSTED_CLIENT_IP_HEADER` (allowed values: `x-real-ip`, `cf-connecting-ip`). It accepts exactly one valid IP and sends it to the API as `X-Forwarded-For`.
3. The API (`TRUST_PROXY=true`) uses that value only when the TCP peer is a private or loopback address, the header appears once, and it holds exactly one valid IP. Otherwise it uses the TCP peer.

Client-supplied `X-Forwarded-For` is never trusted. Web is published only on `127.0.0.1`, so only the local ingress can reach it, and the API is not published at all.

### Default: Caddy on the same host

`TRUSTED_CLIENT_IP_HEADER=x-real-ip`. Use `deploy/Caddyfile.example`, which sets `header_up X-Real-IP {remote_host}`. That overwrites any client-supplied value.

```bash
sudo cp deploy/Caddyfile.example /etc/caddy/Caddyfile
sudo sed -i 's/example.com/your.domain/' /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Do not put a CDN or another proxy in front of this Caddy without also configuring Caddy `trusted_proxies` and switching the header to `{client_ip}`. Otherwise every request carries the proxy's address.

### Alternative: Cloudflare Tunnel

Use this instead of Caddy, not in addition to it. Point `cloudflared` at `http://127.0.0.1:3003` and set `TRUSTED_CLIENT_IP_HEADER=cf-connecting-ip`. Cloudflare's edge overwrites `CF-Connecting-IP`. Do not run a second ingress to port 3003 at the same time, because it would pass a client-supplied `CF-Connecting-IP` through.

After changing `TRUSTED_CLIENT_IP_HEADER`, recreate web with `dcp up -d --no-deps --force-recreate web`.

## 4. Start

```bash
dcp up -d --build
dcp ps
dcp exec -T api curl -fsS http://127.0.0.1:8000/health/ready
curl -fsS http://127.0.0.1:3003/ >/dev/null && echo web-ok
```

`/health` only means the process is up. `/health/ready` means Postgres answered `SELECT 1`. `rag.ready` can stay false while embeddings build; the site still serves, and chat runs without RAG until the index is ready. If `rag.index_error` is set, Ollama or the embedding model name is wrong.

Confirm Postgres 17 and the migration head:

```bash
dcp exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "show server_version"'
dcp exec -T api alembic current
```

`alembic current` should print `a1b2c3d4e5f6 (head)` for this revision of the repository.

## 5. Update

```bash
cd /opt/rumi-ai
dcp exec -T api alembic current | tee pre-deploy-alembic.txt
docker tag rumi-api:prod rumi-api:previous
docker tag rumi-web:prod rumi-web:previous
dcp exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  > "rumi-$(date -u +%Y%m%dT%H%M%SZ).dump"
git rev-parse HEAD > pre-deploy-commit.txt
git pull
dcp up -d --build
dcp exec -T api alembic current
```

The API entrypoint runs `alembic upgrade head` before it listens. Store the dump somewhere other than this host as well.

## 6. Rollback

Retagging images alone does not replace running containers, so every rollback ends with `--force-recreate`. `--no-deps` keeps `db` untouched.

Check whether the failed release changed the schema. Compare `dcp exec -T api alembic current` (or the API logs, if it will not start) with `pre-deploy-alembic.txt`.

### A. Schema unchanged

```bash
docker tag rumi-api:previous rumi-api:prod
docker tag rumi-web:previous rumi-web:prod
dcp up -d --no-build --no-deps --force-recreate api web
dcp exec -T api alembic current
```

### B. The failed release applied a migration

Restore the database first. The previous image runs `alembic upgrade head` on start and would fail against a revision it does not know.

```bash
dcp stop api web
dcp exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  > "rumi-failed-$(date -u +%Y%m%dT%H%M%SZ).dump"
dcp exec -T db sh -c 'dropdb -U "$POSTGRES_USER" --if-exists --force "$POSTGRES_DB" && createdb -U "$POSTGRES_USER" "$POSTGRES_DB"'
dcp exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner' \
  < rumi-YYYYMMDDTHHMMSSZ.dump
docker tag rumi-api:previous rumi-api:prod
docker tag rumi-web:previous rumi-web:prod
dcp up -d --no-build --no-deps --force-recreate api web
dcp exec -T api alembic current
```

Dropping and recreating the database, instead of `pg_restore --clean`, also removes tables that only the failed migration created. The `rumi-failed-*.dump` keeps whatever was written during the failed release. Check `pg_restore` output for errors before starting the API.

Also reset the checkout so the next `dcp up --build` does not rebuild the failed release:

```bash
git checkout "$(cat pre-deploy-commit.txt)"
```

Do not use `alembic downgrade` as the primary rollback. The pre-deploy `pg_dump` is the database rollback point.

The Postgres data volume is `rumi_prod_postgres_data`. `dcp down -v` deletes it.

## 7. What stays private

| Process | Address |
| --- | --- |
| Next.js | `127.0.0.1:3003` only |
| FastAPI | Docker network `rumi`, no published port |
| Postgres | Docker volume, no published port |
| Ollama | host port 11434, firewalled, reachable from the Docker bridge |
| Adminer / dev nginx | not in this Compose file |

Logs go to stdout (`dcp logs api web db`) with rotation. The API does not log the database URL.

FAISS is rebuilt in memory on each API start from the mounted `book_verse` files. Persisting the index is optional later work, not required for a correct deploy. Run a single API container; each replica builds its own index.
