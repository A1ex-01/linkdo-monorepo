# Web Static Deployment Design

## Goal

Publish the `apps/web` marketing site as a fully static site at
`https://linkdo.a1ex.online`, using the same Tencent Cloud Container Registry
(CCR) release tag and Docker Compose workflow as Admin and Backend.

The Web container serves only prebuilt assets with Nginx. TLS termination and
the `linkdo.a1ex.online` virtual host remain the responsibility of the
server-level Nginx configuration and are outside this change.

## Scope

- Enable Next.js static export and serve its `out/` directory from Nginx.
- Remove runtime download redirect route handlers.
- Preserve browser-side download-click reporting to `api.a1ex.online`.
- Add a Web image, Compose service, deployment environment file support,
  documentation, and configuration validation.

The site must not require a Node.js process or Next.js server after its image
has been built.

## Static Export Constraints

`apps/web` has two request-dependent route handlers:

- `/download/macos`
- `/download/windows`

They read environment variables at request time and redirect to an installer.
They cannot be part of a serverless static site, so both handlers will be
removed. Download menu options will link directly to build-time public
installer URLs.

Existing App Router Server Components do not require conversion merely because
the site is static. They do not read request-specific data, so Next.js will
render them during `next build`. Existing browser-only interactions already
live in Client Components.

Next.js image optimization requires a running server. Static export will set
`images.unoptimized` so `next/image` emits ordinary image URLs.

## Public Build Configuration

The operator creates `deploy/.env.web.production`, which is gitignored and
contains:

```dotenv
WEB_HTTP_PORT=6001
NEXT_PUBLIC_MACOS_DOWNLOAD_URL=https://static.a1ex.online/linkdo/installer/Linkdo_0.1.5_aarch64.dmg
NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL=https://static.a1ex.online/linkdo/installer/Linkdo_0.1.5_x64-setup.exe
NEXT_PUBLIC_API_BASE_URL=https://api.a1ex.online
```

All values are public:

- The first configures the localhost-only Docker port binding.
- The two installer URLs are compiled into client JavaScript and must use
  HTTPS.
- The API base URL is also compiled into the browser bundle.

The download UI reports a `POST` to
`https://api.a1ex.online/api/download-clicks` with `keepalive: true`, then
navigates to the installer URL. A failed analytics request is ignored and
never prevents a download.

## Image and Compose Design

`deploy/Dockerfile.web` will build the Web workspace from the repository root
with the three public build arguments, then copy `apps/web/out` into an
`nginx:1.27-alpine` runtime image.

The image will use `deploy/nginx/web.conf`, which:

- serves the static export;
- caches fingerprinted Next assets for one year;
- leaves HTML uncacheable so an image upgrade is visible promptly; and
- returns the generated `404.html` for missing paths.

`deploy/compose.yaml` will add:

```yaml
web:
  image: ${REGISTRY_HOST}/${CCR_NAMESPACE}/linkdo-web:${IMAGE_TAG}
  ports:
    - "127.0.0.1:${WEB_HTTP_PORT}:80"
```

It uses the existing public network only. It has no Backend dependency and
does not receive environment variables at runtime.

The server's external Nginx will later proxy
`linkdo.a1ex.online` to `127.0.0.1:${WEB_HTTP_PORT}` and own the HTTPS
certificate. That setup is intentionally excluded because the host does not
yet expose this site.

## Release Workflow

`deploy/scripts/push-images.sh <tag>` loads `.env.web.production` and builds
and pushes `linkdo-web:<tag>` alongside `linkdo-admin:<tag>` and
`linkdo-backend:<tag>`.

`deploy/scripts/deploy.sh` loads the Web environment file in addition to the
existing Admin, Backend, and image files. It then pulls and starts the Web
service as part of the normal Compose rollout. `backup-mysql.sh` also loads
the file so Compose interpolation remains consistent.

The deployment README and validation script will document and enforce the new
file, image, service, port binding, and static Nginx configuration.

## Verification

The change will be verified by:

1. Testing direct HTTPS download target selection and click-reporting URL
   behavior.
2. Running deployment-configuration validation.
3. Building `@linkdo/web` and confirming that `apps/web/out/index.html` exists
   and no Node runtime is required.
4. Building the Web Docker image and inspecting the Nginx-served output where
   available.
