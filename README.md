# Synthexis Workspace

> **Premium Multi-Model Research Workspace, Interactive Dialectic Audits & Sourced Synthexis Playground**

Synthexis Workspace is a unified, multi-mode developer and researcher platform. It brings conversational AI, multi-perspective technical inquiry, ephemeral code execution, and grounded knowledge analysis into a cohesive, responsive browser interface.

---

## 🏛️ Architecture & Unified Workspaces

Synthexis Workspace is structured as a single platform shell hosting specialized workspaces:

```text
                             SYNTHEXIS WORKSPACE
                                      │
                      ┌───────────────┼───────────────┐
                      │               │               │
                    Breezy        Synthexis         Build
               (Conversational   (Technical      (Cloud IDE &
                  Workspace)     Research &       Ephemeral
                                  Evidence)        Runner)
```

### 1. Breezy (Core Interactive Workspace)
* **Persistent Threads**: Instant conversation tracking stored locally and organized by topic.
* **Canvas Prototype**: Interactive layout for authoring and outlining presentations, tasks, and coursework. *(Clearly designated in preview mode while live Google Workspace OAuth sync is in active development).*
* **Design & Theme**: High-contrast, accessibility-checked Dark and Light mode support with smooth palette transitions.

### 2. Synthexis (Deep Technical Research)
* **Multi-Perspective Synthesis**: Reconciles thesis arguments, critical counter-arguments, and synthesis findings from top-tier LLMs.
* **Search Grounding Abstraction**: Pluggable provider interface supporting:
  * **SearXNG** (Self-hostable privacy-first metasearch)
  * **Tavily Search**
  * **Google Search Grounding**
  * **Brave Search**, **Serper**, and **DuckDuckGo**
* **Truthful Evidence Graph**: Maps claims directly to retrieved sources, explicitly reporting whether evidence currently supports each claim without inflated verification claims.
* **Structured Export**: Markdown export with complete citation trails and inquiry parameters.

### 3. Build (Synthexis IDE)
* **Embedded Editor**: Syntax-highlighted code editor powered by Prism.js supporting Python, TypeScript, JavaScript, JSON, CSS, and HTML.
* **Local Output & Preview**: The Build workspace shows output from real browser-local Python runs and the sandboxed HTML preview. It does not pretend to provision remote compute.

---

## 🛠️ Technology Stack & Deployment Architecture

Synthexis Workspace consists of a static React frontend with multi-tier edge backend failover:

```text
                             SYNTHEXIS WORKSPACE
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

| Layer | Technologies & Runtime |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS v4, Prism.js |
| **Primary Backend** | Cloudflare Workers (`workers/index.ts`) - V8 edge isolate, 100k req/day free |
| **Secondary Backend** | Deno Deploy (`deno/main.ts`) - 1M req/month free backup |
| **Emergency Fallback** | Node.js Express (`server.ts`) - Render Web Service / local dev |
| **AI Integration** | Google Gemini (`gemini-2.5-flash`), Groq, SambaNova, OpenRouter |
| **Persistence** | IndexedDB, LocalStorage, optional Firebase / Google Drive sync |

---

## 🔐 Security & Data Handling Model

* **Local-First Storage**: User chat threads, research sessions, and notebook data are stored in local browser storage (IndexedDB and LocalStorage).
* **Secure Key Vault Configuration**: API keys (BYOK) are stored locally in the user's browser, and are passed securely inside requests to the edge backend proxies so they are never exposed to remote logs.
* **Explicit Authentication States**: Connected services strictly differentiate between real authenticated connections (OAuth / Personal Access Tokens) and local Sandbox Demo modes.
* **Audited Scopes**: When connecting third-party services, access is requested strictly for necessary capabilities (e.g. read-only repository inspection).
* **Bounded Edge Failover**: If the primary Cloudflare Worker is rate-limited or unavailable, requests fail over to the secondary Deno Deploy backend with clear UI notification.

---

## 🚀 Getting Started & Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for complete deployment instructions.

### Prerequisites
* Node.js 18+ and npm

### 1. Installation
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:3000`.

### 4. Build Static Frontend
```bash
npm run build
```

---

## 📌 Project Standards & Guidelines

1. **Truthful UI State**: No simulated action or mock token may present itself as an active third-party connection. Prototypes and previews must be explicitly labeled.
2. **Real Metrics**: No fabricated telemetry numbers or pseudo-scientific confidence percentages. Every displayed metric must derive from a real calculation or source count.
3. **No Theatrical Terminology**: User interfaces prioritize clear, respectful, domain-appropriate language over speculative sci-fi jargon.
