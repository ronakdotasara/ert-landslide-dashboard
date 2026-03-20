# Deployment Guide

## Architecture

```
Vercel (frontend)  ──→  Railway / Render (backend API)  ──→  SQLite DB (persistent volume)
                                     ↑
                              ESP device (field)
```

---

## Step 1 — Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) and create a new project
2. Choose **Deploy from GitHub repo** → select your repo
3. Set the **root directory** to `backend`
4. Add these environment variables in Railway dashboard:
   ```
   PORT=3001
   NODE_ENV=production
   DEVICE_KEY=your-secret-device-key
   DB_PATH=/app/data/ert.db
   ```
5. Add a **Volume** mounted at `/app/data` for persistent SQLite storage
6. Deploy — Railway gives you a URL like `https://ert-backend-production.up.railway.app`

---

## Step 2 — Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and import your GitHub repo
2. Set **root directory** to `frontend`
3. Add this environment variable in Vercel dashboard:
   ```
   VITE_API_BASE=https://your-backend.up.railway.app
   ```
4. Also update `frontend/vercel.json` — replace `YOUR_BACKEND_URL`:
   ```json
   {
     "rewrites": [
       { "source": "/api/:path*", "destination": "https://your-backend.up.railway.app/api/:path*" },
       { "source": "/ws",         "destination": "https://your-backend.up.railway.app/ws" }
     ]
   }
   ```
5. Deploy — Vercel gives you a URL like `https://ert-dashboard.vercel.app`

---

## Step 3 — Update Firmware

In `firmware/main/config.h`, set `SERVER_URL` to your Railway backend:
```cpp
#define SERVER_URL "https://your-backend.up.railway.app"
```

---

## Alternative: Render (free tier)

1. New Web Service → connect GitHub repo → root dir: `backend`
2. Build command: `npm install`
3. Start command: `node api/server.js`
4. Add a persistent disk at `/app/data`
5. Set the same env vars as Railway above

---

## CORS

The backend already has `cors()` middleware with open origins. For production,
restrict it in `backend/api/server.js`:

```js
app.use(cors({ origin: 'https://your-dashboard.vercel.app' }));
```

---

## Local Dev (no change needed)

```bash
# Terminal 1
cd backend && npm start          # http://localhost:3001

# Terminal 2
cd frontend && npm run dev       # http://localhost:3000
```

Vite proxies `/api/*` and `/ws` to localhost:3001 automatically in dev mode.
