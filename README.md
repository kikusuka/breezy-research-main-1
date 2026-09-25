# Breezy Playground

> **Weightless AI Workspace, Deep Technical Research, Cloud Code Engineering & Grounded Study Engine**

Breezy Playground is a unified, multi-mode developer and researcher platform. It brings conversational AI, multi-perspective technical inquiry, ephemeral code execution, and grounded knowledge analysis into a cohesive, responsive browser interface.

---

## 🏛️ Architecture & Unified Workspaces

Breezy Playground is structured as a single platform shell hosting specialized workspaces:

```text
                             BREEZY PLAYGROUND
                                     │
      ┌──────────────────┬───────────┴───────────┬──────────────────┐
      │                  │                       │                  │
    Breezy           Synthexis                 Build              Synap
(Conversational    (Technical Research      (Cloud IDE &      (Study & Knowledge
   Workspace)      & Evidence Engine)    Ephemeral Runner)         Engine)
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

### 3. Build (Breezy IDE)
* **Embedded Editor**: Syntax-highlighted code editor powered by Prism.js supporting Python, TypeScript, JavaScript, JSON, CSS, and HTML.
* **Simulated ANSI Terminal**: Real-time log streamer supporting ANSI color escape codes, live text filter search, auto-scrolling, and keyboard shortcuts (`Cmd+K` / `Ctrl+K` to clear, `Cmd+Shift+Down` to jump to bottom).
* **Execution Preview (Simulation)**: Simulated cloud-runner workflow for testing the Build workspace UI and job lifecycle previews. No remote code execution or remote GPU provisioning occurs.

### 4. Synap (Knowledge & Study Workspace)
* **Source-Grounded Notebooks**: Ingest documents, text files, and reference notes.
* **Weak-Spot Diagnostic**: Evaluates mastery levels and flags topics requiring review.
* **Recall & Spaced Repetition**: Flashcards and quizzes linked directly to study items.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS v4, Motion, D3.js |
| **Backend Server** | Node.js, Express (`server.ts`), Server-Sent Events (SSE) streaming proxy |
| **AI Integration** | `@google/genai` (Gemini 2.5 / 3.x), Groq, SambaNova, OpenRouter |
| **Code Highlighting** | Prism.js |
| **Persistence** | IndexedDB, LocalStorage, optional Firebase / Google Drive sync |

---

## 🔐 Security & Data Handling Model

* **Local-First Storage**: User chat threads, research sessions, and notebook data are stored in local browser storage (IndexedDB and LocalStorage).
* **Transparent Credentials**: API keys (BYOK) are routed via the Express backend server proxy to prevent exposure.
* **Explicit Authentication States**: Connected services strictly differentiate between real authenticated connections (OAuth / Personal Access Tokens) and local Sandbox Demo modes.
* **Audited Scopes**: When connecting third-party services, access is requested strictly for necessary capabilities (e.g. read-only repository inspection).
* **Transparent Model Failover**: If a requested AI model is temporarily rate-limited or unavailable, the backend gracefully switches to a compatible fallback model and explicitly notifies the user in the response stream.

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18+ and npm

### 1. Installation
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the project root:
```env
# Optional server-side Gemini API key for default workspace queries
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: SearXNG endpoint for self-hosted search
SEARXNG_URL=https://your-searxng-instance.example.com
```

### 3. Run Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:3000`.

### 4. Production Build
```bash
npm run build
npm start
```

---

## 📌 Project Standards & Guidelines

1. **Truthful UI State**: No simulated action or mock token may present itself as an active third-party connection. Prototypes and previews must be explicitly labeled.
2. **Real Metrics**: No fabricated telemetry numbers or pseudo-scientific confidence percentages. Every displayed metric must derive from a real calculation or source count.
3. **No Theatrical Terminology**: User interfaces prioritize clear, respectful, domain-appropriate language over speculative sci-fi jargon.
