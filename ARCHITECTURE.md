# Breezy Architecture Overview

> **A Unified, Truthful Platform for Conversational Intelligence, Grounded Research, Interactive Development, and Study**

---

## 🎯 Architecture Vision & Core Principles

Breezy Playground is designed around five core principles:
1. **Truthfulness & Transparency**: Simulated environments (such as cloud job previews or sandbox terminal actions) are explicitly labeled as previews. No fabricated metrics, false execution claims, or fake model fallback syntheses.
2. **Local-First Data Ownership**: User chat threads, research sessions, notes, and study cards reside in browser storage (IndexedDB, LocalStorage, sessionStorage) with optional cloud sync.
3. **Pluggable Multi-Provider AI Architecture**: Seamless integration across Google Gemini (`@google/genai`), Groq, SambaNova, OpenRouter, and local Ollama inference, paired with real web search grounding (Google Search, SearXNG, Tavily, Brave).
4. **Resilient Failover Without Fabrication**: If a primary AI provider fails or is rate-limited, requests gracefully cascade to configured backup providers or return an honest configuration error—never generating synthetic or mock answers.
5. **Modular Workspaces**: A unified single-page application shell hosting specialized developer and research experiences.

---

## 🏗️ System Architecture

```text
                               ┌─────────────────────────────────────────┐
                               │           User's Browser (SPA)          │
                               │                                         │
                               │   ┌─────────────────────────────────┐   │
                               │   │      Breezy App Shell (Vite)    │   │
                               │   └───────────────┬─────────────────┘   │
                               │                   │                     │
                ┌──────────────┼───────────────────┼─────────────────────┼──────────────┐
                │              │                   │                     │              │
                ▼              ▼                   ▼                     ▼              ▼
        ┌──────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
        │    Breezy    │ │   Synthexis   │ │     Build     │ │     Synap     │ │   Settings    │
        │(Conversations│ │  (Deep Multi- │ │  (Prism IDE,  │ │ (Study Notes, │ │   (BYOK &     │
        │   & Canvas)  │ │ Pass Research)│ │Runner Preview)│ │Recall Decks)  │ │ Integrations) │
        └──────┬───────┘ └───────┬───────┘ └───────┬───────┘ └───────┬───────┘ └───────┬───────┘
               │                 │                 │                 │                 │
               └─────────────────┴────────┬────────┴─────────────────┴─────────────────┘
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │        Data & Execution Engine        │
                      │  - Session Storage (IndexedDB/Local)  │
                      │  - Firebase Auth & Google Drive Sync  │
                      │  - GitHub Service (REST / PAT)        │
                      │  - Search Grounding Interface         │
                      │  - Execution Preview Service          │
                      └───────────────────┬───────────────────┘
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │    Express Proxy Server (server.ts)   │
                      │  - SSE Streaming & Provider Cascade   │
                      │  - Gemini / Groq / OpenRouter Proxy   │
                      │  - SearXNG Metasearch Proxy           │
                      └───────────────────────────────────────┘
```

---

## 🏛️ Workspaces Breakdown

### 1. Breezy (Conversational & Canvas Workspace)
* **Interactive Chat**: Streaming conversations with rich markdown rendering, message history, and thread management.
* **Canvas Prototype**: Visual workspace for organizing notes, cards, and outlines.
* **Topic Tagging**: Automatic thread indexing and fast local recall.

### 2. Synthexis (Deep Research & Grounding Engine)
* **Multi-Stage Inquiry Pipeline**: Executes structured research rounds (problem analysis, counterchecks, evidence synthesis, and structured answers).
* **Grounded Search Abstraction**: Connects live search providers including Google Search Grounding, SearXNG, Tavily, and Brave Search.
* **Evidence Graph**: Direct mapping from claims to verifiable source documents with honest citation tracking.
* **Structured Export**: Markdown export formatted with full source citations.

### 3. Build (Breezy IDE & Execution Preview)
* **Prism.js Code Editor**: Syntax highlighting for Python, TypeScript, JavaScript, HTML, CSS, and JSON.
* **Live Sandboxed Preview Runner**: Isolated iframe execution environment with live console log interception.
* **Execution Preview (Simulation)**: Explicitly labeled job lifecycle simulator for testing compute workflows without remote GPU spinning.
* **ANSI Terminal**: Terminal emulator supporting ANSI color codes, text filtering, clearing (`Cmd+K`), and navigation shortcuts.
* **GitHub Integration**: Browse repositories and commit file changes using personal access tokens.

### 4. Synap (Knowledge & Study Workspace)
* **Source-Grounded Notebooks**: Ingest reference materials and lecture documents.
* **Diagnostic Mastery**: Flags knowledge weak-spots based on review performance.
* **Spaced Repetition**: Flashcards and quizzes linked directly to study notes.

---

## 🔒 Security & Credential Model

| Scope | Location | Access Pattern |
|:---|:---|:---|
| **BYOK API Keys** | `localStorage` / Proxy | Routed server-side via Express proxy; never logged |
| **User Data** | `IndexedDB` & `localStorage` | Local-first, private to browser instance |
| **OAuth Tokens** | Memory / `sessionStorage` | Ephemeral Google/Firebase OAuth tokens |
| **GitHub PAT** | `localStorage` (`breezy_github_token`) | Client-side only; scoped for repo operations |

---

## 🛠️ Technology Stack Summary

* **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Motion, Prism.js, D3.js
* **Backend Server**: Node.js, Express (`server.ts`), Server-Sent Events (SSE) streaming proxy
* **AI Providers**: `@google/genai` (Gemini SDK), Groq, SambaNova, OpenRouter, Ollama
* **Authentication**: Firebase Authentication (Google OAuth)
* **Storage**: Local-First (IndexedDB, LocalStorage), optional Google Drive / Firebase Firestore
