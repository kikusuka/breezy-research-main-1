# Breezy UI Rebuild Handoff

## Purpose

This repository is being deliberately cleared of its current React UI implementation.

**The current UI is not the visual source of truth. Do not restore, restyle, or incrementally patch the deleted UI.**

The intended model is:

- **Breezy application logic remains authoritative.**
- **Stitch HTML/CSS is the visual source of truth.**
- **A replacement React UI must be built around the existing services, server-core, storage, and feature behavior.**
- **Historical commits are the fallback archive for functionality that was previously better.**
- **No Stitch demo/fake data may be copied into the live product.**

## What remains authoritative

Keep and reuse these areas:

- `src/services/`
  - provider configuration and model routing
  - effective provider truthfulness/state
  - API client
  - AI provider service
  - Ollama
  - GitHub
  - Google Drive / Docs / Workspace
  - session storage
  - user profile
  - auth
  - PDF
- `src/server-core/`
  - providers
  - router
  - search
  - evidence
  - server types
- `src/types.ts`
- `src/utils/`
- `src/data/presets.ts` where feature data is required
- existing environment/deployment configuration
- Git history

## Global shell

The final product is a calm research workspace.

### Desktop

- fixed left navigation around 256–260px
- fixed top bar around 64px
- deep slate/near-black surfaces
- restrained cyan/azure primary accent
- emerald for positive verification state
- amber/rose only for meaningful warnings or conflicts
- Plus Jakarta Sans / Inter for UI
- JetBrains Mono for operational metadata
- tonal surfaces instead of heavy cards
- small structural radii: roughly 4px / 8px / 12px
- no excessive gradients, glass, glow, floating AI decorations, or fake telemetry

### Mobile

- single active content panel
- compact top bar
- bottom navigation / drawer as appropriate
- controls collapse into progressive disclosure
- research and chat remain the primary mobile workflows

### Shell navigation

Main destinations:

1. Chat
2. Research
3. History
4. Models
5. Docs
6. Settings
7. Profile

Laboratories:

8. Build
9. Canvas

The shell must use real profile/session/configuration state.

## Screen map

### 1. Landing

**Stitch source:** landing desktop + landing mobile.

Structure:

- Breezy brand/header
- calm hero statement
- primary research inquiry composer
- depth selector:
  - Quick / Solo
  - Research / Standard
  - Deep
- primary start action
- truthful model/provider state
- example research starters
- links to History, Models, and Docs

Behavior:

- submit inquiry through the existing Breezy application flow
- do not allow a live run when no routable model exists
- display **No model connected/configured** rather than inventing a model name

### 2. Chat

**Stitch source:** chat desktop + chat mobile.

Structure:

- centered welcome/empty state
- compact Breezy identity
- starter prompts/cards
- large calm composer
- attachment control
- grounding/search control
- model/provider indicator
- conversation message area once active
- local-save/status information

Behavior to preserve:

- real chat generation
- existing chat persistence
- active provider/model routing
- attachment handling
- grounding toggle
- voice/speech behaviors where supported
- Google Drive saving where already supported
- no fake model fallback

### 3. Research

**Stitch source:** research desktop + research mobile.

Structure:

- Research Workspace heading
- primary inquiry composer
- depth control
- verification/research-mode control
- file upload
- Initiate Synthesis action
- research pipeline / stepper
- live output state
- elapsed time / usage state only when actually available
- steering controls during an active run
- final results/evidence/source sections
- notes/export/build/canvas continuation actions

Research stages represented visually:

1. Question
2. Exploration
3. Proposals
4. Challenge
5. Evidence / Verification
6. Synthesis

Behavior to preserve:

- session creation/persistence
- solo / standard / deep protocols
- configured research roles
- search engine configuration
- research method
- streaming status/token/usage events
- heartbeat where enabled
- steering
- evidence graph
- research metrics
- notes
- export
- open Build
- pin/open Canvas

**Important:** the old research screen contained substantial real functionality. Do not recreate its behavior from scratch if the services already provide it.

### 4. Models & Providers

**Stitch source:** models/providers desktop.

Structure:

- model/provider overview
- configured provider count
- model catalog count
- local Ollama state
- provider cards
- key/configuration dialog
- connection verification
- pipeline role assignment cards
- fallback configuration where supported

Research role seats:

- Architect
- Skeptic
- Verifier
- Arbiter

Truthfulness rules:

- an unconfigured provider is not connected
- an unassigned role must show **No model assigned**
- an endpoint URL alone must not imply a local model is available
- server-side Gemini availability may be shown only from actual health state
- never show fictional provider status, benchmark numbers, or model names

Use:

- `providerConfigService`
- `effectiveProviderService`
- `AVAILABLE_MODELS`
- `ollamaService`
- `apiClient`

### 5. Docs

**Stitch source:** docs desktop.

Structure:

- documentation index sidebar
- topic filter
- main reading canvas
- product / architecture / workflow sections
- compact metadata
- calm technical typography

The Docs page is explanatory UI, not a fake runtime dashboard.

Do not display:

- fake hashes
- fake verified percentages
- fictional local daemon latency
- fake cryptographic identities
- fake cluster state
- fake model connections

Where provider state is useful, derive it from the real provider services.

### 6. Settings

**Stitch source:** settings desktop.

Structure:

- System Configuration heading
- reset defaults
- commit/save action
- left section navigation
- content panel

Sections:

1. General
2. Research & Synthesis
3. Data & Privacy
4. API Keys & Storage
5. Shortcuts
6. Integrations
7. Profile

Real behavior already present includes:

- workspace name
- default landing screen
- research depth / rounds
- provider keys
- local cache cleanup
- Google Workspace integration
- GitHub token integration
- profile editing
- configurable research behavior

Never present unsupported guarantees such as hardware-backed storage, zero-log guarantees, fake runtime nodes, or fake environment state.

### 7. Profile

**Stitch source:** profile desktop exists, but its original demo identity must NOT be copied.

Structure:

- profile header
- avatar/initials
- display name
- role/title
- organization
- email
- authorization/connection state if genuinely available
- save/cancel actions

Source of truth:

- `userProfileService`

Empty profile is valid. Use:

- **Breezy user**
- **No role set**
- blank/optional organization and email

Do not invent a person, organization, ID, key fingerprint, enclave, workstation, or authorization level.

### 8. History

**No complete Stitch screen exists.**

Build a new screen using the same Stitch design language.

Structure:

- page heading
- search
- filters
- completed research sessions
- prompt/title
- excerpt
- source count
- step count
- duration when available
- continue research action
- copy reference
- Google Docs save

Source of truth:

- `sessions`
- existing session storage
- `googleDocsService`

### 9. Notes

**No complete Stitch screen exists.**

History and Notes can share the same component architecture, but Notes must have its own navigation state and copy.

Structure:

- notes heading
- search
- filters
- saved/completed research material
- concise excerpts
- continue/inspect behavior
- export/save affordances

Do not create a second fake notes database just for the UI.

### 10. Build / IDE

**No Stitch screen exists. This needs a new screen designed from the Stitch system.**

This is one of the highest-priority feature surfaces.

Preserve the existing real functionality:

- GitHub repository connection
- repository-first workflow
- real repository/file browsing
- file creation
- file editing
- commit/push flow
- Prism code rendering/highlighting
- live HTML/JS preview
- terminal/process log view
- local Python execution through Pyodide/WASM where supported
- preview console logs
- agent panel
- Puter.js agent option
- BYOK agent option
- agent provider switching
- model selection for the agent
- current file context
- real patch/edit workflow

Visual direction:

- serious lightweight IDE
- not a fake terminal demo
- not an AI chat wrapped around an editor
- file tree + editor + preview/terminal
- agent panel is secondary, not the entire UI
- repository state must be real

### 11. Canvas

**No Stitch screen exists. This needs a new screen designed from the Stitch system.**

Preserve:

- card types:
  - idea
  - research
  - code
  - task
- card search
- type filters
- create card
- edit card
- delete card
- task completion
- tags
- AI expansion
- Markdown export
- local persistence
- research-to-canvas pinning
- Google/Drive integration where already supported

Do not preload fake cards.

An empty Canvas should look intentional and calm.

## Existing visual source files in Stitch

The Stitch repository contains these useful implementations:

- `breezy_landing_page_desktop/code.html`
- `breezy_landing_page_mobile/code.html`
- `chat_desktop/code.html`
- `chat_mobile/code.html`
- `research_desktop/code.html`
- `research_mobile/code.html`
- `models_providers_desktop/code.html`
- `docs_desktop/code.html`
- `settings_desktop/code.html`
- `profile_desktop/code.html`
- `calm_intelligence_research_workspace/DESIGN.md`

The `screen.png` exports are reference images only. The next implementation should primarily use the actual HTML/CSS source.

Stitch does **not** currently provide complete screens for:

- History
- Notes
- Build / IDE
- Canvas
- mobile Models
- mobile Docs
- mobile Settings
- mobile Profile

Create those missing views using the same DESIGN.md rules, while keeping them visually cohesive rather than inventing another design language.

## Non-negotiable product rules

1. **No fake model state.**
2. **No fake user identities.**
3. **No fake telemetry.**
4. **No fake benchmark numbers.**
5. **No fake cryptographic claims.**
6. **No fake source counts or verification percentages.**
7. **No demo content presented as live product data.**
8. **No UI component should bypass the existing provider/session/API services just to make a visual demo work.**
9. **Stitch supplies visual structure; Breezy supplies real behavior.**
10. **Do not patch the deleted UI back into existence. Build the new UI from the Stitch source files.**

## Integration boundary

Use this boundary:

```
Stitch-derived UI
      ↓
React UI/controller layer
      ↓
existing Breezy services
      ↓
apiClient / server-core
      ↓
Cloudflare Worker / external providers
```

The UI should not contain duplicated business logic or scattered raw API calls.

## Historical functionality rule

Before implementing a missing replacement, inspect Git history when necessary.

A good rule is:

```
current real functionality
+
best historical implementation
+
Stitch visual source
=
replacement UI
```

Never resurrect old mock/demo behavior just because it looked polished.

## Deployment

Keep the existing deployment architecture:

- static Vite frontend
- Cloudflare Pages
- Cloudflare Worker/API
- configured primary/secondary/fallback API URLs

Do not replace the deployment architecture merely because the UI is being rebuilt.

## Handoff sequence

1. Add the Stitch HTML/CSS assets into this repository.
2. Convert the relevant Stitch screens into React components.
3. Reconnect them to the existing services and application state.
4. Implement the four missing major views: History, Notes, Build, Canvas.
5. Add the missing mobile variants.
6. Compare each screen visually against Stitch.
7. Run a final fake-data/truthfulness audit.
8. Browser-test the final product.

The old UI is intentionally absent after this reset. That is expected.
