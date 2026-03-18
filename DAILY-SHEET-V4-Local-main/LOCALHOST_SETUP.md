# Daily Sheet — Local Development Setup

Get the app running on localhost in ~5 minutes.

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 22+ | [nodejs.org](https://nodejs.org) |
| Docker | any recent | [docker.com](https://www.docker.com/products/docker-desktop/) |
| Caddy _(optional)_ | 2+ | `brew install caddy` / `apt install caddy` |

---

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url>
cd daily-sheet
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local — the defaults work out of the box for local Postgres
```

Minimum required changes in `.env.local`:
- `SESSION_SECRET` — change to any random string (32+ chars)
- Everything else works with the defaults

### 3. Start Postgres

```bash
docker compose -f deploy/docker-compose.yml up -d
# Wait a few seconds, then confirm it's healthy:
docker compose -f deploy/docker-compose.yml ps
```

### 4. Run database migrations

```bash
DATABASE_URL=postgresql://dailysheet:dailysheet@localhost:5432/dailysheet \
  npx drizzle-kit push
```

### 5. Seed development data

```bash
DATABASE_URL=postgresql://dailysheet:dailysheet@localhost:5432/dailysheet \
  npx tsx script/seed.ts
```

This creates:
- **Login:** `admin@localhost`
- **Password:** `admin1234`

### 6. Start the app

```bash
npm run dev
```

The app is available at **http://localhost:5000** (or the port in your `.env.local`).

---

## Optional: Single-Origin Proxy (Caddy)

For cookie/CORS behavior identical to production, run the Caddy proxy:

```bash
caddy run --config deploy/Caddyfile.dev
```

Then access the app at **http://localhost** (port 80). The proxy routes:
- `localhost/api/*` → Express on `:5000`
- `localhost/*` → Vite dev server on `:5173`

You do **not** need `CORS_ORIGIN` set when using this proxy.

---

## Environment Files

| File | Committed? | Purpose |
|---|---|---|
| `.env.example` | Yes | Canonical reference for all variables |
| `.env.development` | Yes | Safe defaults (no secrets) |
| `.env.local` | **No** | Your personal overrides — never commit |
| `.env.production` | **No** | Live secrets — set via CI/dashboard |

---

## Useful Commands

```bash
# Start local Postgres
docker compose -f deploy/docker-compose.yml up -d

# Stop local Postgres (keeps data)
docker compose -f deploy/docker-compose.yml down

# Wipe and restart fresh DB
docker compose -f deploy/docker-compose.yml down -v
docker compose -f deploy/docker-compose.yml up -d

# Run migrations
DATABASE_URL=postgresql://dailysheet:dailysheet@localhost:5432/dailysheet npx drizzle-kit push

# Generate migration files (preferred for production)
DATABASE_URL=... npx drizzle-kit generate
DATABASE_URL=... npx drizzle-kit migrate

# Seed dev data
DATABASE_URL=postgresql://dailysheet:dailysheet@localhost:5432/dailysheet npx tsx script/seed.ts

# Type-check
npm run check

# Full production build
npm run build

# Run the production build locally
npm run start

# Server-only build (for Render CI)
npx tsx script/build-server.ts
```

---

## Production Build (Local Test)

To verify the production artifact works before deploying:

```bash
npm run build
NODE_ENV=production \
DATABASE_URL=... \
SESSION_SECRET=... \
  node dist/index.cjs
```

The server serves both the API (`/api/*`) and the static SPA (`dist/public/`) from the same process.

---

## VPS / Self-Hosted Deployment

See `deploy/Caddyfile.prod` for the Caddy reverse proxy config and `deploy/ecosystem.config.cjs` for PM2 process management.

High-level steps:
1. Install Node 22, Caddy, PM2 on the server
2. Clone repo, `npm ci`, `npm run build`
3. Set production env vars (via `.env.local` on the server or exported shell vars)
4. `DATABASE_URL=... npx drizzle-kit migrate`
5. `pm2 start deploy/ecosystem.config.cjs`
6. `sudo caddy start --config deploy/Caddyfile.prod`

---

## Troubleshooting

**"DATABASE_URL is not set"** → Make sure `.env.local` exists and is being loaded. The `tsx` dev runner picks up `.env.local` automatically; for scripts, prefix the command with the env var.

**Cookies not persisting** → If using the Caddy proxy, ensure you're accessing the app on the Caddy port (80), not the Express port directly. Cookies are set on the proxy's origin.

**CORS errors** → `CORS_ORIGIN` should be empty when using a same-origin proxy. Only set it for split-origin deployments (e.g., Cloudflare Pages + Render).

**"relation sessions does not exist"** → Run `npx drizzle-kit push` to apply the schema before starting the app.
