# Synap - Standalone AI-Powered Study Workspace

Welcome to **Synap**, an isolated and fully functional AI study workspace designed for deep learning, grounded note synthesis, and spaced repetition mastery.

## Features
- **Grounded Notebooks**: Create topic-specific notebooks with custom sources and notes.
- **AI-Powered Item Generation**: Generate active recall flashcards, multiple-choice quizzes, and custom study plans directly from your source material using Google Gemini (`@google/genai`).
- **SuperMemo-2 (SM-2) Spaced Repetition**: Mathematically schedule reviews using the battle-tested SM-2 algorithm with interval, repetition count, ease factor (`EF`), and predicted recall calculations.
- **Explain It Back (Feynman Technique)**: Test your comprehension by explaining concepts back in your own words, with automated verbatim quote checks against your source documents.
- **IndexedDB Client Storage**: Complete client-side database (`synap-db`) for offline persistence and fast retrieval.

---

## Quickstart (Run as a Standalone App)

1. **Extract the ZIP file** into any directory on your computer:
   ```bash
   unzip synap-codebase.zip -d synap-app
   cd synap-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5173`.

---

## Directory Structure
- `App.tsx`: Main application entry wrapper.
- `main.tsx`: React DOM mount.
- `components/`:
  - `SynapWorkspace.tsx`: Root workspace shell managing navigation, notifications, and modals.
  - `SynapNotebooksView.tsx`: Notebook overview grid with readiness percentages.
  - `SynapActiveNotebookView.tsx`: Active notebook reader, grounded chat assistant, and study item generator.
  - `SynapFlashcardView.tsx`: Spaced repetition flashcard session.
  - `SynapQuizView.tsx`: Interactive multi-choice quiz runner.
  - `SynapStudyPlanView.tsx`: Dynamic timeline and syllabus breakdown.
  - `SynapExplainItBackView.tsx`: Feynman technique comprehension tester.
  - `SynapWeakSpotsView.tsx`: Target review for items with low predicted recall.
  - `SynapProviderModal.tsx`: BYOK (Bring Your Own Key) modal for Gemini API keys.
- `services/`:
  - `synapService.ts`: Core notebook CRUD, Gemini prompt engineering, and grounded Q&A.
  - `synapDatabase.ts`: IndexedDB engine (`idb`), text chunking, and relevance search.
  - `scheduler.ts`: SM-2 algorithm, readiness computation, and quote verification.
  - `userProfileService.ts`: Local user profile preferences.
- `types/`:
  - `synap.ts`: TypeScript contracts for notebooks, sources, flashcards, quizzes, and plans.
- `icons/`:
  - `ProductLogos.tsx`: SVG vector logos.
- `tests/`:
  - `scheduler.test.ts`: Vitest test suite verifying the SM-2 algorithm.

---

## Configuring AI Key
You can click the **Provider Key** button inside Synap to enter your Google Gemini API key, stored privately in your browser's `localStorage`.
