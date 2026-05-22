# Deploying Fluenci on Vercel

## Option A — One URL (recommended)

Serve the React app and API from the same Vercel project.

1. Create **one** Vercel project from `angietirado/Fluenci`.
2. **Root Directory:** `./` (repository root).
3. **Framework Preset:** **Other** (not Node.js — Node.js causes "No entrypoint found").
3. **Environment variables** (same project):

   | Key | Value |
   |-----|--------|
   | `MONGO_URI` | MongoDB Atlas connection string |
   | `JWT_SECRET` | your secret |
   | `JWT_EXPIRE` | `30d` |
   | `NODE_ENV` | `production` |
   | SMTP vars | optional |

   Do **not** set `REACT_APP_API_URL` — the frontend will call `/api/v1/...` on the same domain.

4. Deploy. Your app will be at `https://your-project.vercel.app` and the API at `https://your-project.vercel.app/api/v1/...`.

5. **Important:** In any frontend-only project, **delete** `REACT_APP_API_URL` if you switch to this setup. Otherwise the old API URL stays baked into the build.

### Migrating `fluenci-m5it` from API-only to full app

1. **Settings → General → Root Directory** → clear it (use repository root, not `backend`).
2. **Environment Variables** → remove `REACT_APP_API_URL` if present.
3. Keep `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRE`, `NODE_ENV`.
4. Redeploy → open `https://fluenci-m5it.vercel.app` → you should see the **login page**, not JSON.
5. Test `https://fluenci-m5it.vercel.app/api/health` in the browser.

## Option B — Two projects (current split setup)

| Project | Root Directory | Key env vars |
|---------|----------------|--------------|
| API (`fluenci-m5it`) | `backend` | `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL` |
| Frontend | `frontend` | `REACT_APP_API_URL=https://fluenci-m5it.vercel.app` |

Requires CORS; backend must allow your frontend `*.vercel.app` URL.
