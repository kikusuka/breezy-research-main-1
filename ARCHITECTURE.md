# Breezy Architecture

Breezy is one product with a calm workspace UI and a shared backend. Synthexis is the internal multi-model research engine used by the Research workspace; it is not a separate product.

## Frontend

- React 19 + TypeScript + Vite
- Stitch HTML compositions for the landing, chat, research, models, docs, profile, and settings surfaces
- Dedicated desktop and mobile Stitch layouts where available
- A responsive Stitch shell that keeps desktop layouts usable on laptop widths without forcing phone layouts onto small laptops
- Local session/profile/configuration state

The active React shell is intentionally small. Legacy feature screens that were replaced by Stitch are not kept in the application.

## Backend

The shared router lives in `src/server-core/router.ts`.

Provider adapters live in `src/server-core/providers.ts` and currently support Gemini, Anthropic, Groq, SambaNova, OpenRouter, Ollama, and generic OpenAI-compatible endpoints.

Important rule: a provider or model is never silently substituted when the requested provider is unavailable or unconfigured.

## Research engine

`src/features/research/Research.tsx` coordinates the UI state while the backend performs the actual multi-model pipeline.

Research can use:
- Solo
- Standard / Trio
- Deep

Search grounding and evidence are reported only when the backend actually returns them.

## Build workspace

`src/features/build/Build.tsx` uses the GitHub REST API for repository browsing and file updates. It does not use a fake repository or mock commit layer.

## Deployment

- Vite frontend can be served as static assets.
- `server.ts` provides the local/Node Express runtime.
- `workers/index.ts` provides the Cloudflare Worker runtime.
- `wrangler.jsonc` contains the Worker configuration.

See `DEPLOYMENT.md` for deployment-specific instructions.
