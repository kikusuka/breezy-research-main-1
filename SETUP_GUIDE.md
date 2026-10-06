# Breezy Setup Guide

## Quick start

Requires Node.js 22+.

```bash
npm install
npm run dev
```

The development server runs on `http://localhost:3000`.

## Provider configuration

Breezy starts with no connected model unless a provider is actually configured.

Server-side environment variables can include:

- `GEMINI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GROQ_API_KEY`
- `SAMBANOVA_API_KEY`
- `OPENROUTER_API_KEY`
- `OLLAMA_BASE_URL`
- `OPENAI_COMPATIBLE_BASE_URL`

Search providers can use `SEARXNG_URL`, `TAVILY_API_KEY`, `BRAVE_API_KEY`, or `SERPER_API_KEY`.

For BYOK, users configure provider credentials in Breezy's Models workspace. Catalog entries are never treated as connected providers.

## Research

Research is the Synthexis engine inside Breezy. It can run Solo, Standard, or Deep protocols using the models and search providers that are actually configured.

## Build

Build connects to real GitHub repositories with a user-provided personal access token. Breezy does not create a fake demo repository.

## Production

```bash
npm run build
npm start
```

The frontend is built with Vite. The Node/Express server exposes the shared `/api/*` backend router, while `workers/index.ts` provides the Cloudflare Worker entry point.
