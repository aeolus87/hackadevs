# hackadevs

pnpm monorepo: Fastify API (`apps/server`), Vite + React (`apps/web`), shared packages (`packages/*`).

## Requirements

- Node.js 22+ (aligned with CI; use `nvm`, `fnm`, or `asdf` to match)
- [pnpm](https://pnpm.io) 9 (`corepack enable && corepack prepare pnpm@9.15.9 --activate`)

## Setup

```bash
cp .env.example .env
pnpm install
pnpm build
```

`apps/server` loads `.env` from the **repository root** using a path derived from the server entry file (not `process.cwd()`), so the file is found whether you run from the repo root or `apps/server`. `apps/web` reads `VITE_*` from the same file (Vite exposes them to the client).

## Dependencies

When adding or upgrading packages, **check current stable versions** (registry or release notes) instead of copying old semver ranges blindly. Prefer `pnpm add <pkg>@latest` (or an explicit version you have verified) for new deps, then run `pnpm lint` and `pnpm typecheck`. Renovate/Dependabot opens weekly PRs; review breaking changes before merging.

## Develop

```bash
pnpm dev
```

Or one app at a time:

```bash
make dev:server
make dev:web
```

## API shape

HTTP JSON routes live under **`/api`** (e.g. `GET /api/health`). Route handlers use [TypeBox](https://github.com/sinclairzx81/typebox) schemas via `@fastify/type-provider-typebox` so request/response shapes stay validated and typed.

## Web API client

- `apps/web/src/utils/api.routes.ts` — `BASE_URL` should include the `/api` suffix (see `.env.example`), plus `SOCKET_SERVER` (origin without `/api`)
- `apps/web/src/utils/axios.instance.ts` — shared Axios client, `Authorization` from `localStorage` key `hackadevs.auth` (Zustand-persist shape)
- `apps/web/src/hooks/` — e.g. `useApiHealth` calling `GET /health` relative to `BASE_URL` (i.e. `/api/health` when `VITE_API_URL` ends with `/api`)

Override the API base with `VITE_API_URL` (see `.env.example`).

## Database (optional)

Postgres for local development:

```bash
make db:up
```

Defaults match `.env.example` (`DATABASE_URL`). The API does not connect to Postgres until you add a client.

## Running Judge0 locally

```bash
docker compose -f docker-compose.judge0.yml up -d
```

Wait about 30 seconds for Judge0 to initialise, then set `JUDGE0_API_URL=http://localhost:2358` in `.env`.

Test: `curl http://localhost:2358/system_info`

## Quality checks

```bash
pnpm lint
pnpm format
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm test:e2e:coverage   # server Vitest coverage, then Playwright
```

Install Playwright browser once: `make test:e2e-install`.

E2E uses `scripts/playwright-serve.mjs`: API on port **4010** (`FRONTEND_URL=http://127.0.0.1:3123`), Vite on **3123** (`VITE_API_URL=http://127.0.0.1:4010/api`), so it does not collide with a normal dev server on **3000**/**4000**. Set `PLAYWRIGHT_SKIP_WEBSERVER=1` if you already have the app running and want Playwright to attach only.

## Clean

- `pnpm clean` — remove `dist` and `.turbo`
- `pnpm clean:all` — also remove all `node_modules`

## Workspace layout

| Path              | Package                                    |
| ----------------- | ------------------------------------------ |
| `apps/server`     | `@hackadevs/server`                        |
| `apps/web`        | `@hackadevs/web`                           |
| `packages/config` | `@hackadevs/config` (Zod env)              |
| `packages/core`   | `@hackadevs/core` (shared types/constants) |
