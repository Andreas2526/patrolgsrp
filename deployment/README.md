# Deployment Guide (Vercel + Railway)

## Frontend on Vercel

1. Import the `frontend` directory as a Vercel project (or set Root Directory to `frontend`).
2. `frontend/vercel.json` defines the Next.js build/install commands.
3. Add variables from `frontend/.env.vercel.example` in Vercel Project Settings.
4. Deploy with `scripts/deploy-vercel.sh` (requires Vercel CLI), or use the Vercel dashboard.

## Backend on Railway

1. Import this repository as a Railway service.
2. Railway uses `railway.json` to install and start the Express backend.
3. Add variables from `.env.backend.example` in Railway service variables.
4. Deploy with `scripts/deploy-railway.sh` (requires Railway CLI), or use the Railway dashboard.

## OAuth/Callback alignment checklist

- Discord OAuth Redirect URI must be exactly:
  - `https://your-backend.up.railway.app/auth/discord/callback`
- Backend variable `DISCORD_CALLBACK_URL` must match that same URI.
- Frontend variable `NEXT_PUBLIC_API_BASE_URL` should be your Railway backend base URL.
- Backend variable `NEXTJS_FRONTEND_URL` should be your Vercel frontend URL.

## Supabase keys

- Backend requires `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.
- Frontend example includes `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` for optional client-side usage.
