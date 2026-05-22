# Deploying Fluenci on Vercel

## Option A — One URL (recommended)

Serve the React app and API from the same Vercel project.

1. Create **one** Vercel project from `angietirado/Fluenci`.
2. **Root Directory:** leave empty (repository root).
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

## Option B — Two projects (current split setup)

| Project | Root Directory | Key env vars |
|---------|----------------|--------------|
| API (`fluenci-m5it`) | `backend` | `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL` |
| Frontend | `frontend` | `REACT_APP_API_URL=https://fluenci-m5it.vercel.app` |

Requires CORS; backend must allow your frontend `*.vercel.app` URL.
