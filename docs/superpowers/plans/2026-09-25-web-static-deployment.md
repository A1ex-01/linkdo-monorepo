# Web Static Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish `apps/web` as a static Nginx image in the existing CCR and Docker Compose release workflow.

**Architecture:** Next.js generates `apps/web/out` during image build. The runtime image is Nginx only, while browser code links directly to public HTTPS installer URLs and reports clicks to the existing API. Compose exposes the container exclusively on localhost for a future TLS-terminating host Nginx virtual host.

**Tech Stack:** Next.js 16 static export, React 19, pnpm workspaces, Docker Buildx, Nginx 1.27, Docker Compose.

## Global Constraints

- `linkdo.a1ex.online` TLS and server-level Nginx configuration are out of scope.
- Runtime Web containers must not include Node.js or run `next start`.
- Static installer URLs and the API URL are public build-time `NEXT_PUBLIC_*` values.
- Installer URLs must use HTTPS.
- Click-reporting failures must never block an installer download.
- Do not commit any changes unless the user explicitly requests a commit.

---

## File Map

| File | Responsibility |
| --- | --- |
| `apps/web/next.config.ts` | Enables static export and disables server-side image optimization. |
| `apps/web/lib/macos-download.ts` | Validates public HTTPS installer URLs and resolves download destinations. |
| `apps/web/lib/macos-download.test.ts` | Exercises installer URL selection and API reporting endpoint construction. |
| `apps/web/app/_components/download-link.tsx` | Uses static HTTPS targets instead of internal redirect routes. |
| `apps/web/app/download/macos/route.ts` | Removed; requires request-time server logic. |
| `apps/web/app/download/windows/route.ts` | Removed; requires request-time server logic. |
| `deploy/Dockerfile.web` | Builds `apps/web/out` and packages it in Nginx. |
| `deploy/nginx/web.conf` | Serves the static export with cache rules and generated 404 responses. |
| `deploy/compose.yaml` | Runs `linkdo-web` on a localhost-only port. |
| `deploy/scripts/push-images.sh` | Builds and pushes the Web image with public build arguments. |
| `deploy/scripts/deploy.sh` | Loads the Web deployment environment file. |
| `deploy/scripts/backup-mysql.sh` | Loads the Web environment file for consistent Compose interpolation. |
| `deploy/tests/validate.sh` | Enforces static-Web deployment configuration. |
| `deploy/README.md` | Documents Web environment, release, and host-proxy requirements. |
| `.gitignore` | Excludes `deploy/.env.web.production`. |

## Task 1: Replace runtime download redirects with static targets

**Files:**
- Modify: `apps/web/lib/macos-download.ts`
- Modify: `apps/web/lib/macos-download.test.ts`
- Modify: `apps/web/app/_components/download-link.tsx`
- Delete: `apps/web/app/download/macos/route.ts`
- Delete: `apps/web/app/download/windows/route.ts`

**Interfaces:**
- Produces `getDownloadTargetUrl(platform, values)`, where `platform` is `"macos" | "windows"` and `values` contains optional macOS and Windows URL strings.
- `DownloadLink` consumes `NEXT_PUBLIC_MACOS_DOWNLOAD_URL`,
  `NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL`, and `NEXT_PUBLIC_API_BASE_URL`.

- [ ] **Step 1: Write a failing target-selection test**

Add the following test to `apps/web/lib/macos-download.test.ts`:

```ts
test("selects the matching secure installer URL for each platform", () => {
  const urls = {
    macos: "https://static.a1ex.online/linkdo/installer/Linkdo.dmg",
    windows: "https://static.a1ex.online/linkdo/installer/Linkdo-setup.exe",
  };

  assert.equal(
    getDownloadTargetUrl("macos", urls),
    "https://static.a1ex.online/linkdo/installer/Linkdo.dmg",
  );
  assert.equal(
    getDownloadTargetUrl("windows", urls),
    "https://static.a1ex.online/linkdo/installer/Linkdo-setup.exe",
  );
  assert.equal(getDownloadTargetUrl("macos", { ...urls, macos: "http://insecure" }), null);
});
```

Import `getDownloadTargetUrl` from `./macos-download.ts`.

- [ ] **Step 2: Run the test and verify it fails because the export is absent**

Run:

```bash
node --experimental-strip-types --test apps/web/lib/macos-download.test.ts
```

Expected: failure stating that `getDownloadTargetUrl` is not exported.

- [ ] **Step 3: Implement the minimal target selector**

In `apps/web/lib/macos-download.ts`, add:

```ts
export type DownloadPlatform = "macos" | "windows";

export function getDownloadTargetUrl(
  platform: DownloadPlatform,
  urls: { macos: string | undefined; windows: string | undefined },
) {
  return platform === "macos"
    ? getMacOSDownloadUrl(urls.macos)
    : getWindowsDownloadUrl(urls.windows);
}
```

Keep `getMacOSDownloadUrl`, `getWindowsDownloadUrl`, and
`getDownloadClickEndpoint` unchanged so their existing behavior remains
covered.

- [ ] **Step 4: Run the unit tests and verify they pass**

Run:

```bash
node --experimental-strip-types --test apps/web/lib/macos-download.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Link menu items directly to static installer URLs**

In `apps/web/app/_components/download-link.tsx`:

1. Replace `MACOS_DOWNLOAD_PATH` and `WINDOWS_DOWNLOAD_PATH` imports with
   `getDownloadTargetUrl` and `DownloadPlatform`.
2. Define public URL values immediately before the component return:

```ts
const downloadUrls = {
  macos: getDownloadTargetUrl("macos", {
    macos: process.env.NEXT_PUBLIC_MACOS_DOWNLOAD_URL,
    windows: process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL,
  }),
  windows: getDownloadTargetUrl("windows", {
    macos: process.env.NEXT_PUBLIC_MACOS_DOWNLOAD_URL,
    windows: process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL,
  }),
};
```

3. Pass `downloadUrls.macos` and `downloadUrls.windows` to `DownloadOption`.
4. Change `DownloadOption` to accept `href: string | null`. Render an anchor
   only when `href` is non-null; otherwise render a disabled `span` with the
   same visual layout, `aria-disabled="true"`, and detail text
   `"安装包暂不可用"`.
5. Preserve the existing `onSelect` call only for valid anchors, so analytics
   continues to be sent without blocking navigation.
6. Delete both `app/download/*/route.ts` files.

- [ ] **Step 6: Re-run tests and lint the changed Web source**

Run:

```bash
node --experimental-strip-types --test apps/web/lib/macos-download.test.ts
pnpm --filter @linkdo/web lint
```

Expected: both commands exit with status 0.

## Task 2: Enable and prove Next.js static export

**Files:**
- Modify: `apps/web/next.config.ts`

**Interfaces:**
- Produces a Next.js `out/` directory containing every public Web route.
- Keeps `https://static.a1ex.online` as the only remote image hostname.

- [ ] **Step 1: Configure static export**

Replace the configuration object with:

```ts
const nextConfig: NextConfig = {
  output: "export",
  transpilePackages: ["@linkdo/ui"],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.a1ex.online",
      },
    ],
  },
};
```

`unoptimized` is required because default `next/image` optimization needs a
Node server, which the final container intentionally lacks.

- [ ] **Step 2: Build with production public configuration**

Run:

```bash
NEXT_PUBLIC_MACOS_DOWNLOAD_URL=https://static.a1ex.online/linkdo/installer/Linkdo_0.1.5_aarch64.dmg \
NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL=https://static.a1ex.online/linkdo/installer/Linkdo_0.1.5_x64-setup.exe \
NEXT_PUBLIC_API_BASE_URL=https://api.a1ex.online \
pnpm --filter @linkdo/web build
```

Expected: exit status 0 and `apps/web/out/index.html` exists. A failure
mentioning either removed route handler or default image optimization means a
static-export requirement was missed.

- [ ] **Step 3: Inspect the generated output**

Run:

```bash
test -f apps/web/out/index.html
test -f apps/web/out/404.html
rg -q 'https://static\.a1ex\.online/linkdo/installer/Linkdo_0\.1\.5_aarch64\.dmg' apps/web/out
```

Expected: every command exits with status 0.

## Task 3: Add Nginx image and Compose deployment support

**Files:**
- Create: `deploy/Dockerfile.web`
- Create: `deploy/nginx/web.conf`
- Modify: `deploy/compose.yaml`
- Modify: `deploy/scripts/push-images.sh`
- Modify: `deploy/scripts/deploy.sh`
- Modify: `deploy/scripts/backup-mysql.sh`
- Modify: `deploy/tests/validate.sh`

**Interfaces:**
- Image: `${REGISTRY_HOST}/${CCR_NAMESPACE}/linkdo-web:${IMAGE_TAG}`.
- Build args: `NEXT_PUBLIC_MACOS_DOWNLOAD_URL`,
  `NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL`, `NEXT_PUBLIC_API_BASE_URL`.
- Compose variable: `WEB_HTTP_PORT`.

- [ ] **Step 1: Extend the deployment validator first**

Add these requirements to `deploy/tests/validate.sh`:

```bash
"$deploy_dir/Dockerfile.web"
"$deploy_dir/nginx/web.conf"
```

Add checks:

```bash
grep -q '^  web:' "$deploy_dir/compose.yaml"
grep -q 'linkdo-web:${IMAGE_TAG}' "$deploy_dir/compose.yaml"
grep -q -- '- "127.0.0.1:${WEB_HTTP_PORT}:80"' "$deploy_dir/compose.yaml"
grep -q 'web_env_file=.*\.env.web.production' "$deploy_dir/scripts/deploy.sh"
grep -q 'web_env_file=.*\.env.web.production' "$deploy_dir/scripts/push-images.sh"
grep -q 'output: "export"' "$root_dir/apps/web/next.config.ts"
test ! -e "$root_dir/apps/web/app/download/macos/route.ts"
test ! -e "$root_dir/apps/web/app/download/windows/route.ts"
```

- [ ] **Step 2: Run the validator and verify it fails for missing Web deployment files**

Run:

```bash
bash deploy/tests/validate.sh
```

Expected: non-zero exit with a missing `Dockerfile.web` or `web.conf` message.

- [ ] **Step 3: Create the static Web Dockerfile**

Create `deploy/Dockerfile.web`:

```dockerfile
FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN pnpm install --frozen-lockfile --filter @linkdo/web...

COPY --exclude=.env --exclude=.env.* apps/web apps/web
COPY packages/ui packages/ui

ARG NEXT_PUBLIC_MACOS_DOWNLOAD_URL
ARG NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_MACOS_DOWNLOAD_URL=$NEXT_PUBLIC_MACOS_DOWNLOAD_URL \
    NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL=$NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL \
    NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN test -n "$NEXT_PUBLIC_MACOS_DOWNLOAD_URL" \
 && test -n "$NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL" \
 && test -n "$NEXT_PUBLIC_API_BASE_URL"
RUN pnpm --filter @linkdo/web build

FROM nginx:1.27-alpine

COPY deploy/nginx/web.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/out /usr/share/nginx/html

EXPOSE 80
```

- [ ] **Step 4: Create the static Nginx configuration**

Create `deploy/nginx/web.conf`:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location /_next/static/ {
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location ~* \.html$ {
        add_header Cache-Control "no-store";
    }

    location / {
        try_files $uri $uri/ $uri.html =404;
    }

    error_page 404 /404.html;
    location = /404.html {
        internal;
        add_header Cache-Control "no-store";
    }
}
```

- [ ] **Step 5: Add the Web Compose service**

Add this service beside `admin` in `deploy/compose.yaml`:

```yaml
  web:
    image: ${REGISTRY_HOST}/${CCR_NAMESPACE}/linkdo-web:${IMAGE_TAG}
    restart: unless-stopped
    ports:
      - "127.0.0.1:${WEB_HTTP_PORT}:80"
    networks:
      - public
    logging:
      driver: local
      options:
        max-size: 10m
        max-file: "3"
```

Do not add `env_file` or a Backend dependency: all Web configuration is
compiled into the static files and browser telemetry calls the public API URL.

- [ ] **Step 6: Load Web environment configuration in scripts**

In each script, declare:

```bash
web_env_file="$deploy_dir/.env.web.production"
```

In `deploy.sh`, check the file exists and insert
`--env-file "$web_env_file"` into the `compose` array.

In `push-images.sh`, check and source the file after the Admin file, define:

```bash
web_image="$registry_host/$namespace/linkdo-web"
```

Then call:

```bash
build_and_push "$web_image" "$repo_root/deploy/Dockerfile.web" "$repo_root" \
  --build-arg "NEXT_PUBLIC_MACOS_DOWNLOAD_URL=${NEXT_PUBLIC_MACOS_DOWNLOAD_URL:-}" \
  --build-arg "NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL=${NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL:-}" \
  --build-arg "NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL:-}"
```

Add `web_image` to the final push summary.

In `backup-mysql.sh`, require `web_env_file` and add its `--env-file` argument
to the Compose command.

- [ ] **Step 7: Run the deployment validator and Docker configuration check**

Run:

```bash
bash deploy/tests/validate.sh
docker compose --env-file deploy/.env.backend.production \
  --env-file deploy/.env.admin.production \
  --env-file deploy/.env.web.production \
  --env-file deploy/.env.image \
  -f deploy/compose.yaml config >/dev/null
```

Expected: both commands exit with status 0 after the operator has supplied all
four ignored deployment environment files.

## Task 4: Document and protect the Web deployment configuration

**Files:**
- Modify: `.gitignore`
- Modify: `deploy/README.md`

**Interfaces:**
- Operator-supplied `deploy/.env.web.production` is never committed.
- The deploy README is the release runbook for the Web image.

- [ ] **Step 1: Ignore the Web production environment file**

Append:

```gitignore
deploy/.env.web.production
```

to the deployment environment entries in `.gitignore`.

- [ ] **Step 2: Update the deployment README**

Extend the environment table with:

```markdown
| `.env.web.production` | 手动维护 | Web 的 `WEB_HTTP_PORT` 与三个公开构建变量。 |
```

Add the complete required file content:

```dotenv
WEB_HTTP_PORT=6001
NEXT_PUBLIC_MACOS_DOWNLOAD_URL=https://static.a1ex.online/linkdo/installer/Linkdo_0.1.5_aarch64.dmg
NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL=https://static.a1ex.online/linkdo/installer/Linkdo_0.1.5_x64-setup.exe
NEXT_PUBLIC_API_BASE_URL=https://api.a1ex.online
```

State that these values are compiled into `linkdo-web`, contain no secrets,
and changing them requires building and pushing a new image.

Document the host reverse-proxy target:

```text
https://linkdo.a1ex.online -> http://127.0.0.1:6001
```

State explicitly that the host Nginx owns HTTPS certificates and the
container serves HTTP only on loopback.

- [ ] **Step 3: Run final static-build and deployment checks**

Run:

```bash
pnpm --filter @linkdo/web lint
pnpm --filter @linkdo/web build
bash deploy/tests/validate.sh
```

Expected: all three commands exit with status 0.
