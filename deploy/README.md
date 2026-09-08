# Linux deployment

This directory deploys the admin SPA, Go gateway, base/link/file services,
email worker, MySQL, Redis, and RabbitMQ as one Docker Compose stack. Only
the admin Nginx container publishes a port; it serves the SPA and forwards
`/api/*` to the gateway. MySQL, Redis, RabbitMQ, and all Go services remain
on the private Docker network.

Application images are built locally for `linux/amd64` and pushed to Tencent
Cloud CCR. The Linux host only pulls those images; it never builds source code.

The future Python agent is deliberately not included. `VITE_PUBLIC_AGENT_URL`
is reserved so the SPA can be rebuilt with its public endpoint later.

## Build and push to CCR (local machine)

Log in using a Tencent Cloud CCR temporary credential, then build and push a
versioned release. The existing namespace defaults to `ax-linkdo` and can be
overridden with `CCR_NAMESPACE`.

```bash
echo "$CCR_PASSWORD" | docker login ccr.ccs.tencentyun.com \
  --username "$CCR_USERNAME" --password-stdin

# These values are compiled into the browser bundle. Do not put private secrets here.
export VITE_CLERK_PUBLISHABLE_KEY="..."
export VITE_PUBLIC_AGENT_URL="https://agent.example.com"
export VITE_PUBLIC_AGENT_API_KEY="..."

bash deploy/scripts/push-images.sh v2026.09.08
```

This pushes both `linkdo-backend` and `linkdo-admin` to CCR with the same tag.

## First deployment (Linux host)

On a Linux host with Docker Engine and Docker Compose v2 installed, clone the
whole repository (the build uses `apps/admin`, `services/backend`, and the
backend's existing MySQL bootstrap SQL):

```bash
git clone <repository-url> /opt/linkdo
cd /opt/linkdo
cp deploy/.env.example deploy/.env
chmod 600 deploy/.env
# Edit deploy/.env: replace every change-me value, set IMAGE_TAG to the pushed
# release, and set required OSS/OAuth values.
# Log in to CCR once on this host so Docker can pull private images.
bash deploy/scripts/deploy.sh
docker compose --env-file deploy/.env -f deploy/compose.yaml ps
curl -fsS http://127.0.0.1/health
```

The mounted SQL under `services/backend/docker/mysql/init` runs only while the
named MySQL volume is first initialized. Back up production data before
removing that volume.

## Updates and operations

```bash
cd /opt/linkdo
git pull --ff-only
# Update IMAGE_TAG in deploy/.env to the release pushed to CCR.
bash deploy/scripts/deploy.sh
docker compose --env-file deploy/.env -f deploy/compose.yaml logs -f gateway
bash deploy/scripts/backup-mysql.sh
docker compose --env-file deploy/.env -f deploy/compose.yaml down
```

`down` retains named data volumes. Do not use `down -v` unless intentionally
discarding MySQL, Redis, and RabbitMQ data.

The admin image runs Vite's production bundler directly. Its repository-level
`pnpm build` additionally runs TypeScript checking and currently has unrelated
source errors, so run and repair that check separately in CI before release.

## HTTPS

This stack listens on HTTP only. Put a host-level Nginx/Caddy/Traefik reverse
proxy with certificates in front of `HTTP_PORT`, or restrict this port to an
existing load balancer. Set OAuth redirect URLs to the final public HTTPS URL.
