# Daily Sheet — Localhost-First Migration & Self-Hosting Plan

> **Scope:** Architecture, environment separation, repo structure, and deployment workflow only.  
> **No feature code is changed.**  
> Generated from the actual codebase as of March 2026.

---

## Executive Summary

Daily Sheet currently runs as a split deployment: a Vite/React SPA on Cloudflare Pages and an Express API on Render, backed by a managed PostgreSQL database. The app already has excellent bones for self-hosting — the monorepo layout, unified build, and cookie/session stack are well-chosen. The migration is primarily about:

1. Wiring a single-origin local topology so cookies and CORS work identically in every environment.
2. Replacing scattered, implicit environment assumptions with an explicit, validated `.env` matrix.
3. Adding a Docker Compose local-dev stack (Postgres + the Node server) with a documented seed/migration flow.
4. Making the build and run scripts environment-agnostic so the same artifact can land on Render, a VPS, or a local machine.

Estimated total effort for all phases: **2–4 engineering days** for one developer familiar with the codebase.

---

## Architecture Diagram

### Current (Split-Origin)

```
Browser
  │
  ├─► Cloudflare Pages (dist/public)   cdn.yourdomain.com
  │     Vite SPA — VITE_API_URL ──────────────────────────────┐
  │                                                            │
  └─► Render (dist/index.cjs)          api.yourdomain.com ◄───┘
        Express API
          │  CORS_ORIGIN=https://cdn.yourdomain.com
          │  credentials: true
          └─► Managed Postgres (Render / Neon / Supabase)
```

### Target — Localhost-First (Single Origin via Reverse Proxy)

```
Browser
  │
  └─► localhost:80  (Caddy / Nginx)
        │
        ├─ /api/*  → localhost:3000  (Express — dist/index.cjs or tsx)
        │               │
        │               └─► localhost:5432  (Postgres in Docker)
        │
        └─ /*      → localhost:5173  (Vite dev)  ← dev only
                      or dist/public              ← prod / preview

```

### Target — Production (Same Topology, Different Hosts)

```
Browser
  │
  └─► yourdomain.com  (Caddy on VPS / Cloudflare Proxy)
        │
        ├─ /api/*  → 127.0.0.1:3000  (Node process / PM2)
        │               └─► Postgres (managed or containerised)
        └─ /*      → /srv/daily-sheet/dist/public  (static)
```

Key insight: **same-origin removes all CORS and cookie-domain complexity.** The frontend talks to `/api/*` with no absolute URL; the reverse proxy routes accordingly. This works identically on localhost and production.

---

## 1. Target Architecture — Localhost-First

### Service Topology

| Service | Local host:port | Production equivalent |
|---|---|---|
| Reverse proxy | `localhost:80` (Caddy) | Caddy/Nginx on VPS or CF Tunnel |
| Express API | `localhost:3000` | Same, behind proxy |
| Vite dev server | `localhost:5173` | N/A (built to static) |
| PostgreSQL | `localhost:5432` | Managed DB or Docker on VPS |

### Port Layout

```
:80   → proxy (single entry point, eliminates CORS/cookie issues)
:3000 → Express API (never exposed publicly; only the proxy touches it)
:5173 → Vite HMR dev server (dev only; proxied to /api/* by Caddyfile)
:5432 → Postgres (local Docker; prod uses DATABASE_URL)
```

### Cookie / Session Strategy

| Setting | Local value | Production value | How to achieve |
|---|---|---|---|
| `cookie.secure` | `false` | `true` | `NODE_ENV === 'production'` guard (already implied in Express session) |
| `cookie.sameSite` | `lax` | `lax` | Same — same-origin means no cross-site friction |
| `cookie.domain` | unset | unset | Same-origin: no explicit domain needed |
| `trust proxy` | off | `1` | `app.set('trust proxy', 1)` gated on `NODE_ENV` |

Because the proxy puts frontend and API on the same origin, `credentials: true` / `withCredentials` still works, and you never need to send `CORS_ORIGIN` on localhost.

---

## 2. Repo / Project Structure Proposal

### Current structure (what exists today)

```
daily-sheet/
├── client/              # Vite React SPA
├── server/              # Express API
│   ├── fileStorage.ts   # Storage abstraction (already good)
│   ├── routes.ts
│   ├── storage.ts
│   └── db.ts
├── shared/              # Schema + shared types
├── script/
│   └── build.ts         # Unified build script
├── ios/                 # Capacitor iOS
├── dist/                # Build output (gitignored)
├── migrations/          # (should exist — drizzle-kit out dir)
├── render.yaml          # Render deploy config
├── wrangler.jsonc       # Cloudflare Pages config
├── capacitor.config.ts
├── drizzle.config.ts
├── vite.config.ts
└── package.json
```

### Proposed additions (no moves required)

```
daily-sheet/
├── ...existing layout preserved...
│
├── deploy/                          # NEW — all deployment targets
│   ├── Caddyfile.dev                # Local reverse proxy config
│   ├── Caddyfile.prod               # Production Caddy template
│   ├── nginx.conf.example           # Alternative if Nginx preferred
│   └── docker-compose.yml           # Local dev stack
│
├── script/
│   ├── build.ts                     # existing unified build
│   ├── build-server.ts              # existing server-only build (Render)
│   └── seed.ts                      # NEW — local DB seed script
│
├── migrations/                      # drizzle-kit generated (commit these)
│
├── .env.example                     # NEW — canonical reference (commit)
├── .env.local                       # NEW — gitignored local overrides
├── .env.development                 # NEW — dev defaults (safe to commit)
├── .env.production                  # EXISTING — keep, ensure completeness
└── .gitignore                       # Update to cover all .env.* except example/dev
```

### Source-of-truth vs generated files

| File | Status | Notes |
|---|---|---|
| `shared/schema.ts` | Source of truth | DB schema + TS types — never generated |
| `migrations/` | Generated + committed | `drizzle-kit generate` output; commit for auditability |
| `dist/` | Generated | Never commit; CI/CD rebuilds |
| `.env.example` | Source of truth | Commit; documents all required vars |
| `.env.local` | Generated (user) | Never commit |
| `package-lock.json` | Generated + committed | Ensures reproducible installs |
| `render.yaml` | Source of truth | Commit; describes Render service |
| `wrangler.jsonc` | Source of truth | Commit; describes CF Pages |
| `deploy/docker-compose.yml` | Source of truth | Commit; local dev stack |

---

## 3. Environment Strategy

### Variable ownership matrix

| Variable | Frontend (`VITE_*`) | Backend | Notes |
|---|---|---|---|
| `VITE_API_URL` | ✓ | — | **Set to `/api` for same-origin; absolute URL only for split-origin prod** |
| `DATABASE_URL` | — | ✓ | Full Postgres connection string |
| `SESSION_SECRET` | — | ✓ | Minimum 32 random chars |
| `CORS_ORIGIN` | — | ✓ | **Leave empty on localhost** — same-origin, no CORS needed |
| `RESEND_API_KEY` | — | ✓ | Optional — email sending |
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | — | ✓ | Optional — Replit object storage; falls back to `./uploads` disk |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | — | ✓ | Optional — AI features |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | — | ✓ | Optional |
| `NODE_ENV` | — | ✓ | `development` / `production` |
| `PORT` | — | ✓ | Default 3000; override for hosting |

### `.env` file matrix

**.env.example** — commit this; it is the canonical documentation

```bash
# ── Backend ─────────────────────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/dailysheet
SESSION_SECRET=change-me-at-least-32-random-characters
NODE_ENV=development
PORT=3000

# Leave empty on localhost (same-origin proxy). Set for split-origin prod:
CORS_ORIGIN=

# Optional integrations
RESEND_API_KEY=
DEFAULT_OBJECT_STORAGE_BUCKET_ID=
AI_INTEGRATIONS_OPENAI_API_KEY=
AI_INTEGRATIONS_OPENAI_BASE_URL=

# ── Frontend (must be prefixed VITE_) ───────────────────────
# Use /api for same-origin (local + VPS with proxy).
# Use absolute URL only for split-origin Cloudflare/Render deploy.
VITE_API_URL=/api
```

**.env.development** — commit this; safe defaults for local dev

```bash
DATABASE_URL=postgresql://dailysheet:dailysheet@localhost:5432/dailysheet
SESSION_SECRET=dev-only-secret-do-not-use-in-production
NODE_ENV=development
PORT=3000
CORS_ORIGIN=
VITE_API_URL=/api
```

**.env.local** — never commit; developer's personal overrides (API keys, local DB passwords)

**.env.production** — never commit; live secrets only. Currently contains `VITE_API_URL=https://...` — migrate this to `/api` once proxy is in place.

### Validation policy

| Environment | Policy | Mechanism |
|---|---|---|
| `development` | Warn on missing optional vars | Console warning at startup |
| `production` | Hard fail on missing required vars | `throw new Error(...)` at startup |
| `test` | Warn | Allow stubs |

The backend `server/index.ts` or a dedicated `server/env.ts` should centralize all `process.env` reads with this logic. The frontend should use `import.meta.env.VITE_*` directly, but Vite will surface missing variables automatically at build time.

---

## 4. Local Dev Orchestration

### Recommendation: Docker Compose for Postgres only, native Node for app

**Rationale:**  
- The Node/TypeScript hot-reload (`tsx watch`) experience degrades noticeably inside Docker on macOS (volume mount latency).  
- Postgres in Docker is fast, stateless, and eliminates "works on my machine" DB version drift.  
- This matches the common pattern: DB in container, app runs natively.

### `deploy/docker-compose.yml`

```yaml
version: "3.9"

services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: dailysheet
      POSTGRES_PASSWORD: dailysheet
      POSTGRES_DB: dailysheet
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dailysheet"]
      interval: 5s
      timeout: 3s
      retries: 10

volumes:
  postgres_data:
```

Start with: `docker compose -f deploy/docker-compose.yml up -d`

### `deploy/Caddyfile.dev`

```
localhost {
    # API — forward to Express
    handle /api/* {
        reverse_proxy localhost:3000
    }

    # Frontend — forward to Vite dev server
    handle {
        reverse_proxy localhost:5173
    }
}
```

Start with: `caddy run --config deploy/Caddyfile.dev`

Caddy is preferred over Nginx for local dev because it auto-provisions HTTPS (important for `Secure` cookies once you enable them) and requires zero certificate management.

### DB migration / seed workflow

```bash
# 1. Start Postgres
docker compose -f deploy/docker-compose.yml up -d db

# 2. Wait for healthy (docker compose ps confirms)

# 3. Run migrations (generates and applies schema)
DATABASE_URL=postgresql://dailysheet:dailysheet@localhost:5432/dailysheet \
  npx drizzle-kit push

# 4. (Optional) Seed with development data
DATABASE_URL=... npx tsx script/seed.ts

# 5. Start the app
npm run dev
```

The `seed.ts` script should insert a default workspace, a test admin user, and minimal reference data. This enables a cold-start bootstrap for any developer without needing a database dump.

---

## 5. Build / Run Standardization

### Unified script inventory

| Script | Command | What it does |
|---|---|---|
| `dev` | `NODE_ENV=development tsx server/index.ts` | Start API with hot-reload; pair with Vite HMR |
| `build` | `npx tsx script/build.ts` | Full build: Vite SPA + esbuild server bundle → `dist/` |
| `build:server` | `npx tsx script/build-server.ts` | Server bundle only → `dist/index.cjs` (Render CI) |
| `start` | `NODE_ENV=production node dist/index.cjs` | Serve built artifact (production) |
| `check` | `tsc` | TypeScript type-check (no emit) |
| `db:push` | `drizzle-kit push` | Apply schema to DB directly (dev) |
| `db:generate` | `drizzle-kit generate` | Generate migration SQL files |
| `db:migrate` | `drizzle-kit migrate` | Apply migration files (prod-safe) |
| `db:seed` | `npx tsx script/seed.ts` | Seed local DB with dev data |
| `lint` | `eslint client/src server shared` | Code style (add ESLint if not present) |

**Note:** `db:push` is fine for development and initial setup. For production, prefer `db:generate` + `db:migrate` so migrations are auditable and reversible.

### Backend-only vs full-stack build

| Build mode | When | Command | Output |
|---|---|---|---|
| Full-stack | Local release test, VPS deploy | `npm run build` | `dist/public/` + `dist/index.cjs` |
| Server-only | Render CI (frontend on CF Pages) | `npm run build:server` | `dist/index.cjs` only |
| Frontend-only | CF Pages CI (if split-origin retained) | `vite build` | `dist/public/` only |

### CI artifact expectations

After `npm run build`, the `dist/` directory must contain:

```
dist/
├── public/          # Vite SPA output (index.html + assets)
└── index.cjs        # Bundled Express server
```

The server reads `dist/public` from `server/static.ts` via `serveStatic`. On a VPS, the proxy serves `dist/public` directly and the server only handles `/api/*` — this is more efficient and the static serving in Express can be disabled.

---

## 6. Deployment Portability Plan

### Making deployment target-agnostic

The single most important change: **remove the absolute `VITE_API_URL` and replace it with `/api`** once a reverse proxy is in front of both frontend and backend on the same domain.

Current client API calls (via `queryClient.ts`) likely prefix with `VITE_API_URL`. The change is:

- **Localhost + VPS:** `VITE_API_URL=/api` → baked at build time → all calls go to same-origin `/api/*`
- **Split-origin (CF Pages + Render):** `VITE_API_URL=https://api.yourdomain.com` → as today

This means the same codebase, different `.env` at build time, supports both topologies.

### Reverse proxy for each target

**Local dev — Caddy (Caddyfile.dev above)**
- Handles HTTP/HTTPS automatically.
- Routes `/api/*` to Express, `/*` to Vite dev server.

**VPS production — Caddy (Caddyfile.prod)**

```
yourdomain.com {
    handle /api/* {
        reverse_proxy localhost:3000
    }
    handle {
        root * /srv/daily-sheet/dist/public
        file_server
        try_files {path} /index.html
    }
}
```

Caddy auto-provisions TLS via Let's Encrypt. `try_files` enables SPA client-side routing.

**Cloudflare Pages + Render (existing split-origin)**  
No proxy changes needed. Keep `VITE_API_URL=https://api.yourdomain.com` and `CORS_ORIGIN=https://cdn.yourdomain.com` as today.

### Storage abstraction strategy

`server/fileStorage.ts` already implements the right pattern: it checks for `DEFAULT_OBJECT_STORAGE_BUCKET_ID` and falls back to local disk (`./uploads`). This is the correct abstraction. Three environments are already supported without code changes:

| Environment | Storage backend | Config |
|---|---|---|
| Local dev | `./uploads/` on disk | No bucket ID set |
| Replit hosted | Replit Object Storage | `DEFAULT_OBJECT_STORAGE_BUCKET_ID` set |
| VPS production | Local disk or S3-compatible | Either no bucket ID (disk) or add S3 logic to `fileStorage.ts` |

For S3-compatible self-hosted storage (MinIO, Backblaze B2, etc.), add a third branch in `fileStorage.ts` keyed on `STORAGE_PROVIDER=s3` with `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`. The interface is already abstracted — only `fileStorage.ts` needs updating.

---

## 7. Risk Register + Mitigations

| # | Risk | Severity | Mitigation | Rollback |
|---|---|---|---|---|
| R1 | **Cookie/session breakage** when moving from split-origin to same-origin | High | Test login/logout in each topology before cutover. Use `NODE_ENV` to control `secure` flag. Verify `trust proxy` setting. | Revert proxy config; fall back to split-origin |
| R2 | **CORS regression** — removing `CORS_ORIGIN` breaks API calls | Medium | Same-origin eliminates CORS. If anything breaks, check `credentials: include` on frontend requests and that proxy sets correct headers. | Re-add `CORS_ORIGIN` to env |
| R3 | **ENV drift** — local `.env` diverges from production secrets | High | `.env.example` is canonical. CI should validate all required vars exist at build/deploy time. | `env.ts` validator throws on startup if required vars missing |
| R4 | **DB schema drift** — local dev uses `drizzle-kit push`, prod uses no migrations | High | Adopt `drizzle-kit generate` + `db:migrate` for all non-trivial schema changes. Commit migration files. Never push directly to prod DB. | Roll back migration SQL; Drizzle generates reversible SQL |
| R5 | **Secrets in source control** — `.env.production` committed to git | Critical | Move to CI/CD secret injection or secrets manager. Ensure `.gitignore` excludes all `.env.*` except `.env.example` and `.env.development`. | Rotate all secrets if leaked |
| R6 | **Build artifact mismatch** — frontend built with wrong `VITE_API_URL` | Medium | Make `VITE_API_URL` explicit in CI pipeline. Add a build-time check that warns if the value looks like an absolute URL in a same-origin deployment. | Rebuild with correct env var |
| R7 | **Cold-start DB on localhost** — developers waste time on setup | Low | `deploy/docker-compose.yml` + `script/seed.ts` + README quickstart eliminates this | N/A |
| R8 | **iOS/Capacitor** — native app always calls absolute API URL | Medium | `capacitor.config.ts` server URL must be kept in sync with prod API URL. Local Capacitor builds need `server.url` overridden. | Use env-specific `capacitor.config.*` |

---

## 8. Phased Implementation Roadmap

### Phase 0 — Cleanup & Safety (0.5 days) — NO USER-VISIBLE CHANGES

**Goal:** Safe foundation before any structural changes.

- [ ] Move `.env.production` out of git (`git rm --cached .env.production`); add to `.gitignore`. Store its values in Render dashboard / CI secrets.
- [ ] Create `.env.example` with all variables documented (see Section 3).
- [ ] Create `.env.development` with safe local defaults.
- [ ] Update `.gitignore`: exclude `*.env.local`, `.env.production`; keep `.env.development`, `.env.example`.
- [ ] Commit and push. Verify Render deploy still works with env vars from dashboard.

**Acceptance criteria:** No secrets in git. App still deploys to Render/CF Pages identically.

---

### Phase 1 — Local Postgres + DB workflow (0.5 days)

**Goal:** Any developer can run a fresh local database in under 5 minutes.

- [ ] Add `deploy/docker-compose.yml` (Postgres service, healthcheck, named volume).
- [ ] Add `db:generate` and `db:migrate` scripts to `package.json`.
- [ ] Create `script/seed.ts` — inserts default workspace + admin user.
- [ ] Add `db:seed` script.
- [ ] Document quickstart in `README.md` (or `LOCALHOST_SETUP.md`).
- [ ] Test: fresh machine, `docker compose up -d`, `npm run db:migrate`, `npm run db:seed`, `npm run dev` → app runs.

**Acceptance criteria:** App fully functional on localhost with local Postgres without any cloud dependency.

---

### Phase 2 — Reverse Proxy (Local Same-Origin) (0.5 days)

**Goal:** Eliminate all CORS and cookie-domain friction locally.

- [ ] Add `deploy/Caddyfile.dev`.
- [ ] Add `.env.development` entry: `VITE_API_URL=/api`.
- [ ] Verify `server/index.ts` CORS logic: on localhost with same-origin, `CORS_ORIGIN` should be empty and the CORS middleware should not block requests.
- [ ] Test: start Caddy + Express + Vite dev server → login, session persistence, API calls all work via `localhost`.
- [ ] Verify cookies: `Set-Cookie` header present, `HttpOnly`, no `Domain` attribute, `SameSite=Lax`.

**Acceptance criteria:** Full auth + API flow works via Caddy proxy on `localhost:80`. No CORS errors in browser console.

---

### Phase 3 — Build Standardization (0.5 days)

**Goal:** One build command produces a portable artifact.

- [ ] Verify `npm run build` produces `dist/public/` + `dist/index.cjs`.
- [ ] Ensure `dist/index.cjs` correctly serves `dist/public/` as static files (check `server/static.ts`).
- [ ] Test production artifact locally: `npm run build && NODE_ENV=production node dist/index.cjs` → app works on `:3000` (without proxy, just to test the bundle).
- [ ] Add `build:server` alias for `npx tsx script/build-server.ts` if not already in `package.json`.
- [ ] Add `check` (typecheck), `lint`, `db:generate`, `db:migrate`, `db:seed` scripts.

**Acceptance criteria:** `npm run build && npm run start` serves a functional production build locally.

---

### Phase 4 — VPS / Self-Hosted Production Target (1 day, optional)

**Goal:** Deploy to a plain VPS instead of Render/CF Pages.

- [ ] Add `deploy/Caddyfile.prod` (static file serving + API proxy + TLS).
- [ ] Document: install Caddy + Node 22 on VPS, clone repo, set `.env.local` with production secrets, `npm ci`, `npm run build`, `npm run db:migrate`, `pm2 start dist/index.cjs`.
- [ ] Add `deploy/ecosystem.config.cjs` for PM2 process management.
- [ ] Test: end-to-end auth, file uploads, PDF generation, email (if RESEND_API_KEY set).

**Acceptance criteria:** App runs on VPS at custom domain with HTTPS, sessions persist across server restarts (Postgres session store is already in place).

---

### Phase 5 — Storage Abstraction for Self-Hosted (0.5 days, optional)

**Goal:** File uploads work on VPS without Replit Object Storage.

- [ ] Confirm disk fallback in `fileStorage.ts` works when `DEFAULT_OBJECT_STORAGE_BUCKET_ID` is unset.
- [ ] Test file upload, PDF attachment, file streaming — all via disk path.
- [ ] (Optional) Add S3-compatible provider branch: `STORAGE_PROVIDER=s3`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`.
- [ ] Document which env vars enable which storage backend.

**Acceptance criteria:** File uploads and downloads work on localhost and VPS without any cloud storage account.

---

## 9. Verification Checklist

Run this checklist after each phase to confirm localhost parity:

### Auth / Session

- [ ] POST `/api/login` with valid credentials → 200, `Set-Cookie` header present
- [ ] GET `/api/user` → 200 with user object (confirms session persisted)
- [ ] POST `/api/logout` → session destroyed
- [ ] After logout, GET `/api/user` → 401
- [ ] Refresh browser → still logged in (session survives page reload)
- [ ] Session survives Express restart when using Postgres session store (`connect-pg-simple`)

### API / CORS

- [ ] All fetch calls use `credentials: 'include'` (check `queryClient.ts`)
- [ ] No CORS errors in browser console for any API call
- [ ] Browser DevTools → Network → confirm `Cookie` header sent on credentialed requests
- [ ] If split-origin: `Access-Control-Allow-Origin` matches frontend origin exactly

### Database

- [ ] `npm run db:migrate` runs without errors on fresh DB
- [ ] All schema entities readable/writable via the app (create a project, assign crew, etc.)
- [ ] `npm run db:seed` populates a usable dev dataset
- [ ] Drizzle schema (`shared/schema.ts`) matches actual DB columns

### File Storage

- [ ] File upload → file appears in `./uploads/` (local) or object storage (cloud)
- [ ] File download / streaming works for uploaded files
- [ ] PDF generation (Daily Sheet, Gear Request, Timesheet) — download works

### Build Consistency

- [ ] `npm run build` completes without errors
- [ ] `npm run check` (typecheck) passes with zero errors
- [ ] Built SPA at `dist/public/index.html` loads in browser
- [ ] Built server at `dist/index.cjs` starts and serves API + static files

### Environment

- [ ] Missing `DATABASE_URL` → server fails to start with clear error message
- [ ] Missing `SESSION_SECRET` → server fails to start with clear error message
- [ ] Missing optional vars (`RESEND_API_KEY`) → server starts; feature gracefully disabled
- [ ] `VITE_API_URL` correct for topology (relative `/api` for same-origin, absolute for split-origin)

---

## Open Questions

1. **Capacitor / iOS:** The iOS app requires a hard-coded API base URL in its build. Will localhost development of the iOS app target a local Express server (e.g., `http://192.168.x.x:3000`) or always use the production API? This should be clarified and a `capacitor.config.local.ts` pattern added if needed.

2. **Session store in production:** The app uses `connect-pg-simple` (Postgres session store). Confirm which Postgres instance the session store connects to in production — it should be the same as `DATABASE_URL`. If using a separate managed DB, session persistence across deploys is already covered.

3. **Email (Resend):** On localhost without a `RESEND_API_KEY`, email sending fails silently or throws. Confirm whether invite/notification flows need a local SMTP stub (e.g., Mailpit) for testing, or whether skipping emails on localhost is acceptable.

4. **Split-origin vs same-origin production:** The plan above defaults to same-origin (proxy) for both localhost and VPS. If you want to keep CF Pages + Render as the split-origin production target, Phase 2 (proxy) applies only to localhost, and `VITE_API_URL` must remain an absolute URL at Cloudflare build time. Both are supported by this plan — they are separate build-time configurations, not code changes.

5. **Migrations vs push:** `drizzle-kit push` is currently used for all schema changes. For production, push is risky (no rollback, no audit trail). Phase 1 introduces `db:generate` + `db:migrate`. Confirm the team is ready to adopt this workflow before Phase 1 is marked complete.

---

## Assumptions

- Node.js 22+ is available on the target machine.
- Docker Desktop (or equivalent) is available for local Postgres. If not, a Postgres.app or Homebrew Postgres install also works with the same `DATABASE_URL`.
- Caddy is available locally (`brew install caddy` / `apt install caddy`). Nginx is a valid alternative — the proxy rules are equivalent.
- The existing `server/static.ts` correctly resolves `dist/public` relative to the CWD of the running process. Verify this if moving the working directory.
- `.env.production` contains only `VITE_API_URL` currently (confirmed from codebase). All other production secrets are already in Render's environment dashboard.
