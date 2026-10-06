# Breezy Playground

Breezy is a proprietary beta workspace for conversational AI, grounded multi-model research, and repository-based development.

## Product structure

- **Chat** — conversational work with the models the user actually connects.
- **Research** — Breezy's Synthexis research engine: independent perspectives, challenge, evidence, and synthesis.
- **Build** — real GitHub repository browsing and editing.
- **Canvas** — lightweight local workspace for ideas and research notes.
- **History** — locally stored research sessions.
- **Models** — provider credentials, model assignments, and routing.
- **Docs / Settings / Profile** — workspace configuration and guidance.

Synthexis is an internal engine, not a separate product or product switcher.

## Truthfulness rules

Breezy must not invent:
- connected providers or models
- live compute/nodes
- confidence or verification scores
- citations
- telemetry
- successful connection states

If a provider is not configured, the UI says so.

## Architecture

The frontend is React + TypeScript + Vite. The Stitch HTML screens live under `public/stitch/` and are loaded by `src/components/stitch/StitchFrame.tsx`.

The shared backend lives under `src/server-core/`. `server.ts` provides the Node/Express runtime and `workers/index.ts` provides the Cloudflare Worker entry point.

## Development

Requires Node.js 22+.

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run typecheck
npm test
npm run build
```

See `DEPLOYMENT.md` for deployment instructions.

Breezy is proprietary software. See `LICENSE` for the repository's terms.
