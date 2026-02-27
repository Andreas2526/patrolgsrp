# PatrolGSRP

## Overview
PatrolGSRP is a full-stack Discord-authenticated operations app built with:

- **Backend:** Node.js + Express
- **Frontend:** Next.js (App Router)
- **Database:** Supabase Postgres
- **Auth:** Discord OAuth 2.0 + JWT session tokens
- **Authorization:** Role-based access control (Officer, Supervisor, Admin)

The backend handles Discord OAuth sign-in, user/session validation, and protected APIs. The frontend initiates Discord login and stores the returned session token for authenticated requests.

---

## Setup

### Prerequisites
- Node.js 18+
- npm
- Docker + Docker Compose (optional, for local containerized stack)
- Discord Developer application (for OAuth credentials)
- Supabase project (or local Postgres compatible setup)

### 1) Install dependencies
From the repository root:

```bash
npm install
cd frontend && npm install
```

### 2) Configure environment files
Create environment files from examples:

```bash
cp .env.example .env
cp .env.backend.example .env.backend
cp frontend/.env.vercel.example frontend/.env.local
```

Then fill in required values (see **Environment Variables** below).

### 3) Run locally (Node processes)
Backend (from repo root):

```bash
npm start
```

Frontend (from `frontend/`):

```bash
npm run dev
```

Default local URLs:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

### 4) Run locally (Docker Compose)

```bash
docker compose up --build
```

This starts:
- Postgres (`supabase-db`) on `localhost:54322`
- Backend on `localhost:3001`
- Frontend on `localhost:3000`

---

## Environment Variables

### Backend variables
Use `.env.example` for local development and `.env.backend.example` for production-style deployment.

| Variable | Required | Purpose |
|---|---|---|
| `NODE_ENV` | Yes | Runtime environment (`development` / `production`). |
| `PORT` | Yes | Backend listen port (default `3001`). |
| `NEXTJS_FRONTEND_URL` | Yes | Frontend base URL used for OAuth redirects. |
| `DISCORD_CLIENT_ID` | Yes | Discord OAuth application client ID. |
| `DISCORD_CLIENT_SECRET` | Yes | Discord OAuth application secret. |
| `DISCORD_CALLBACK_URL` | Yes | OAuth callback URL served by backend (`/auth/discord/callback`). Must match Discord app redirect URI exactly. |
| `JWT_SESSION_SECRET` | Yes | Secret used to sign/verify JWT session tokens. |
| `SUPABASE_URL` | Yes | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key used by backend for DB operations. |
| `DISCORD_ADMIN_ROLE_ID` | Optional | Discord role ID mapped to Admin access. |
| `DISCORD_SUPERVISOR_ROLE_ID` | Optional | Discord role ID mapped to Supervisor access. |
| `DISCORD_OFFICER_ROLE_ID` | Optional | Discord role ID mapped to Officer access. |

### Frontend variables
Use `frontend/.env.local` locally (or `frontend/.env.vercel.example` as template for Vercel).

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Public backend URL used for auth/API requests. |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Optional future client-side Supabase usage. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Optional future client-side Supabase usage. |

---

## Deployment

This project is configured for:

- **Frontend on Vercel** (`frontend/vercel.json`)
- **Backend on Railway** (`railway.json`)

### Recommended flow
1. Deploy backend to Railway.
2. Set backend env vars from `.env.backend.example`.
3. Deploy frontend to Vercel with root directory `frontend`.
4. Set frontend env vars from `frontend/.env.vercel.example`.
5. Verify OAuth callback alignment across Discord, backend, and frontend config.

### Helpful scripts
- `scripts/deploy-railway.sh`
- `scripts/deploy-vercel.sh`

For step-by-step deployment notes, see `deployment/README.md`.

---

## Database

The repository includes SQL migration(s) in `supabase/migrations/` to bootstrap core tables:

- `users`
- `zones`
- `audit_logs`

The included migration also adds indexes for common query patterns (roles, timestamps, FK lookups).

For local Postgres bootstrapping, Docker Compose mounts migrations into the DB container via:

- `./supabase/migrations:/docker-entrypoint-initdb.d:ro`

> Note: Ensure your API logic and schema are kept in sync when evolving tables/columns.

---

## Discord OAuth

### OAuth flow summary
1. Frontend sends user to backend login endpoint: `GET /auth/discord/login`
2. Backend redirects to Discord authorization URL.
3. Discord redirects to backend callback: `GET /auth/discord/callback`
4. Backend exchanges `code` for token, fetches Discord profile, upserts user in database, signs JWT session token.
5. Backend redirects to frontend callback with token query parameter.
6. Frontend stores token and uses it for authenticated API calls.

### Critical configuration rule
`DISCORD_CALLBACK_URL` **must exactly match** the Redirect URI configured in the Discord Developer Portal.

---

## API Usage

Base URL (local): `http://localhost:3001`

### Public endpoints

- `GET /auth/discord/login`  
  Starts Discord OAuth flow.

- `GET /auth/discord/callback`  
  Handles Discord redirect and completes sign-in.

- `GET /zones`  
  Returns zones list.

### Authenticated endpoints
Provide session token via:
- `Authorization: Bearer <token>` header, or
- `session_token` cookie.

- `GET /auth/session/me`  
  Returns authenticated user profile.

### Role-protected endpoints
- `GET /auth/protected/officer` (Officer+)
- `GET /auth/protected/supervisor` (Supervisor+)
- `GET /auth/protected/admin` (Admin only)
- `POST /zones` (Supervisor+)
- `DELETE /zones/:id` (Supervisor+)

### Example request

```bash
curl -H "Authorization: Bearer <JWT_TOKEN>" \
  http://localhost:3001/auth/session/me
```

---

## Roles

The RBAC model supports three privilege levels:

1. **Officer**
2. **Supervisor**
3. **Admin**

Access can be granted through:
- The persisted user role in the database, and/or
- Discord role IDs mapped via environment variables.

Role hierarchy is inclusive:
- Admin includes Supervisor and Officer permissions.
- Supervisor includes Officer permissions.

---

## License

No license file is currently included in this repository.

If this project is intended for open-source distribution, add a `LICENSE` file (for example, MIT, Apache-2.0, or GPL-3.0) and update this section accordingly.
