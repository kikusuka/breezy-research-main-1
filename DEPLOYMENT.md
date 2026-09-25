# 🚀 Breezy Research - Multi-Backend Deployment Architecture

Breezy Research uses a resilient, cost-effective multi-backend deployment strategy with automatic, bounded client-side failover:

```text
                             BREEZY RESEARCH
                                    │
                         Static Frontend (Vite)
                     (Cloudflare Pages / Vercel)
                                    │
                          ┌─────────┴─────────┐
                          │                   │
                     Cloudflare             Deno
                      Worker               Deploy
                     [PRIMARY]          [SECONDARY]
                   100k req/day          1M req/mo
                          │                   │
                          └─────────┬─────────┘
                                    │
                                 Render
                               [EMERGENCY]
```

---

## ⚡ Tier Limits & Free Tier Breakdown

* **Cloudflare Workers (Primary)**: 100,000 inbound requests/day on the free tier. Near-instant global edge invocation (<10ms).
* **Deno Deploy (Secondary)**: 1,000,000 requests/month on the free tier. Operates as an immediate zero-configuration fallback.
* **Render (Emergency Fallback)**: Free web services may sleep after 15 minutes of inactivity and take ~50s to spin up. Kept strictly as an emergency/legacy fallback.

---

## 1. Deploy the Static Frontend

The frontend is a pure static React 19 / Vite application with client-side routing.

### Build the Static Bundle
```bash
npm install
npm run build
```
The output is written to the `dist/` folder.

### Deploy to Cloudflare Pages
1. Connect your repository to **Cloudflare Pages**.
2. Set Build Command: `npm run build`
3. Set Build Output Directory: `dist`
4. Set Environment Variables:
   - `VITE_PRIMARY_API_URL`: `https://breezy-api.<your-subdomain>.workers.dev`
   - `VITE_SECONDARY_API_URL`: `https://breezy-api.deno.dev`
   - `VITE_FALLBACK_API_URL`: `https://breezy-api.onrender.com` (optional)

### Deploy to Vercel / Netlify
1. Point root to repository.
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. For single-page app (SPA) routing, ensure all paths route to `index.html`.

---

## 2. Deploy Cloudflare Worker (Primary API)

The primary API runs on Cloudflare Workers using the lightweight handler in `workers/index.ts`.

### Steps:
1. Install Wrangler CLI (if not installed):
   ```bash
   npm install -g wrangler
   ```
2. Authenticate:
   ```bash
   wrangler login
   ```
3. Set your server-side Gemini API key (encrypted secret):
   ```bash
   wrangler secret put GEMINI_API_KEY
   ```
4. Deploy the worker:
   ```bash
   wrangler deploy
   ```
5. Note your Worker URL (e.g. `https://breezy-api.<subdomain>.workers.dev`) and set it as `VITE_PRIMARY_API_URL` in your frontend environment.

---

## 3. Deploy Deno Deploy (Secondary API)

The secondary fallback runs on Deno Deploy using `deno/main.ts`.

### Steps:
1. Go to [Deno Deploy Dashboard](https://dash.deno.com/).
2. Click **New Project** and link your GitHub repository.
3. Set **Entrypoint**: `deno/main.ts`
4. Set Environment Variables in Deno Deploy Settings:
   - `GEMINI_API_KEY`: your server Gemini key
   - `ALLOWED_ORIGINS`: `*` (or your frontend domain)
5. Deploy project. Copy the resulting `https://<project-name>.deno.dev` URL and set it as `VITE_SECONDARY_API_URL` in your frontend.

---

## 4. Run / Deploy Render (Emergency Fallback & Local Dev)

The `server.ts` Express server handles local full-stack development and can be deployed directly to Render as a Web Service.

### Local Development:
```bash
npm run dev
```

### Deploy to Render:
1. Create a **Web Service** on Render.
2. Build Command: `npm run build`
3. Start Command: `npm start`
4. Set `GEMINI_API_KEY` in Render Environment Variables.

---

## 🔄 How Failover Operates

1. **Primary First**: Requests always attempt the Cloudflare Worker first.
2. **Safe Detection**: If the Worker returns `502`, `503`, `504`, or a network connection error *before* data transfer begins, the client automatically switches to the secondary Deno Deploy backend.
3. **No Duplicate Charges**: If a request has already started streaming tokens, it is not blindly retried to avoid duplicate LLM invocations.
4. **Transparent UI**: The UI subtly updates the backend chip in the TopBar and informs the user: *"Primary service unavailable. Connected to backup service."*
