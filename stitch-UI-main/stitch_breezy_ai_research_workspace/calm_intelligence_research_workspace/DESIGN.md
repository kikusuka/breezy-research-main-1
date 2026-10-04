---
name: Calm Intelligence Research Workspace
colors:
  surface: '#111319'
  surface-dim: '#111319'
  surface-bright: '#36393f'
  surface-container-lowest: '#0b0e13'
  surface-container-low: '#191c21'
  surface-container: '#1d2025'
  surface-container-high: '#272a30'
  surface-container-highest: '#32353a'
  on-surface: '#e1e2e9'
  on-surface-variant: '#bcc9ce'
  inverse-surface: '#e1e2e9'
  inverse-on-surface: '#2e3036'
  outline: '#869398'
  outline-variant: '#3d494d'
  surface-tint: '#4cd6fb'
  primary: '#4cd6fb'
  on-primary: '#003642'
  primary-container: '#00b4d8'
  on-primary-container: '#00414f'
  inverse-primary: '#00677d'
  secondary: '#7bd0ff'
  on-secondary: '#00354a'
  secondary-container: '#00a6e0'
  on-secondary-container: '#00374d'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#19bc84'
  on-tertiary-container: '#00442d'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#b3ebff'
  primary-fixed-dim: '#4cd6fb'
  on-primary-fixed: '#001f27'
  on-primary-fixed-variant: '#004e5f'
  secondary-fixed: '#c4e7ff'
  secondary-fixed-dim: '#7bd0ff'
  on-secondary-fixed: '#001e2c'
  on-secondary-fixed-variant: '#004c69'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#111319'
  on-background: '#e1e2e9'
  surface-variant: '#32353a'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system embodies the ethos: *"Complicated inside. Calm outside."* 

It provides an environment engineered for profound cognitive focus, rigorous investigation, and synthesis. The audience comprises researchers, intelligence analysts, staff engineers, and domain specialists who require uncompromising clarity over generative theater.

The design movement combines **Minimalism** with **Modern Tooling Precision**:
- **Zero AI Slop:** Strictly devoid of amorphous neon gradients, particle clouds, indeterminate pulsing blobs, and simulated progress meters. Intelligence is conveyed through precision, typography, structural order, and immediate responsiveness.
- **Restrained Focus:** Deep, slate-tinted obsidian surfaces absorb optical fatigue during hours of continuous operation.
- **Deliberate Purpose:** The energetic cyan accent is drawn directly from the mascot silhouette, reserved exclusively for semantic intentionality—interactive anchors, committed states, verified sources, and operational status.

## Colors

The palette establishes an ordered tonal architecture built on deep slate-blacks, preventing the harsh optical vibration of pure black (`#000000`) while maintaining contrast ratios exceeding WCAG AAA standards.

### Surface Architecture
- **Canvas Base:** `#0E1116` — The foundational dark floor of the workspace.
- **Surface Layer 1:** `#141820` — Sidebars, contextual drawers, and passive panels.
- **Surface Layer 2:** `#1A202C` — Active workspace panels, input surfaces, and structural cards.
- **Surface Layer 3:** `#222938` — Hover elevations, floating toolbars, modal windows, and flyouts.

### Structural Lines & Borders
- **Subtle Partition:** `rgba(55, 65, 81, 0.40)` — Architectural segmentations and layout grid gutters.
- **High-Definition Boundary:** `#2D3748` — Active card frames, focused bounds, and segmented controls.

### Semantic & Accents
- **Primary Azure Cyan (`#00B4D8`):** Solely applied to confirmed CTAs, interactive highlights, and active pipeline nodes.
- **Secondary Sky Cyan (`#38BDF8`):** Interactive hover states, hyperlinks, and highlighted citations.
- **Verification Emerald (`#10B981`):** Validated evidence, connected APIs, and verified citations.
- **Amber Warning (`#F59E0B`):** Verification challenges, ungrounded claims, and pending validations.
- **Rose Alert (`#F43F5E`):** Disproved evidence, API connection failure, or rate bounds reached.

## Typography

Typography establishes an unwavering typographic rhythm between analytical synthesis and technical telemetry.

- **Primary Sans (Plus Jakarta Sans & Inter):** Plus Jakarta Sans delivers measured authority across workspace headers, workflow stage titles, and document titles. Inter serves as the primary instrument for reading, evidence evaluation, and analytical drafting due to its neutral character shapes and exceptional micro-legibility.
- **Monospace Discipline (JetBrains Mono):** Monospace is never deployed as visual decoration. It is strictly dedicated to operational metadata: model identifiers (`gpt-4o`, `claude-3-5-sonnet`, `deepseek-r1`), latency/token counters, source hashes, raw citation data, and code evaluation blocks.
- **Reading Cadence:** Body text defaults to a generous 1.57x–1.62x line height on dark backgrounds to mitigate character crowding and preserve reading stamina.

## Layout & Spacing

The workspace operates on an analytical **multi-column fluid docking architecture** designed to host complex, parallel cognitive steps without clutter.

### Layout Philosophy & Breakpoints
- **Desktop Ultrawide / Large (>1440px):** 3-tier split-pane view consisting of:
  1. *Collapsible Navigation & Run Catalog* (fixed 260px).
  2. *Investigation Pipeline & Stepper* (adaptive 380px–460px) housing progressive stages (Question -> Exploration -> Proposals -> Challenge -> Evidence -> Synthesis).
  3. *Primary Focus Canvas* (flexible fluid remaining space, max 960px reading center) housing live synthesis and source inspector.
- **Desktop Standard (1024px–1439px):** 2-pane arrangement with side-drawer access for supporting source verification.
- **Tablet & Mobile (<1023px):** Single active panel stacked hierarchy with a segmented bottom navigator switching between current pipeline stage and the synthesis doc.

### Spacing Discipline
A strict base-4 rhythm orchestrates all layout logic. Dense tabular and parameter regions adopt `space-xs` and `space-sm` for high-density information architecture, while reading panes and canvas boundaries expand cleanly into `space-lg` and `space-xl`.

## Elevation & Depth

Visual hierarchy rejects exaggerated drop shadows in favor of **structural low-contrast containment and tonal surface tiers**.

- **Surface Layering:** Depth is conveyed predominantly by luminance: `#0E1116` (recessed canvas) -> `#141820` (layout frames) -> `#1A202C` (actionable modules) -> `#222938` (overlays, popovers, and menus).
- **Crisp Outlines:** Floating elements (such as inspector toolbars, search palettes, and active cards) are outlined with a fine 1px border of `#2D3748` or `rgba(55, 65, 81, 0.40)`.
- **Restrained Ambient Shadows:** Popovers and floating context menus use a faint, ultra-diffused floor: `0 12px 32px -8px rgba(0, 0, 0, 0.65)`. Shadows are pure neutral slate without color-cast blooms or radiant neon glows.
- **Focus Rings:** Focused states do not emit colored volumetric glow. Instead, they present a crisp 1px `#00B4D8` border supplemented by a 1px offset line (`ring-1 ring-offset-2 ring-offset-[#0E1116] ring-[#00B4D8]`).

## Shapes

The design system employs a **Soft (Level 1)** geometric standard. This geometry balances software utility with precise industrial tool aesthetics.

- **Base Radius (0.25rem / 4px):** Standard controls, inputs, source chips, model parameter pills, and table cells.
- **Large Radius (0.5rem / 8px):** Structural cards, modal panels, pipeline step nodes, and composer text areas.
- **Extra Large Radius (0.75rem / 12px):** Global layout shells and floating command overlays.
- **Fully Rounded (Pill / 9999px):** Status badges (e.g., connection status dots and model tags) and quick-action filter pills.

## Components

### 1. Navigation Bar
- Grounded on `#141820` with a 1px bottom border (`rgba(55, 65, 81, 0.4)`).
- Integrates the mascot icon in clear `#00B4D8` at 28px height, paired with clean wordmark tracking.
- Global breadcrumbs reveal the active research inquiry: `Workspace / Climate Economics / Verification [Run #4]`.

### 2. Progressive Disclosure Inquiry Composer
- Default state: Clean `#1A202C` textarea with `#38BDF8` focus border and subtle hint labels.
- Progressive disclosure trigger: As user enters an inquiry, collapsible parameter drawers quietly reveal controls for Depth (Fast Scan vs. Exhaustive Verification), Reasoning Models, and Domain Scope Filters without jarring shifts.

### 3. Deep Research Workflow Stepper
Linear semantic track detailing the research state:
- `Question` -> `Exploration` -> `Proposals` -> `Challenge` -> `Evidence/Verification` -> `Synthesis`
- **Completed Step:** `#10B981` subtle outline and dot indicator.
- **Active Step:** `#00B4D8` solid marker with label in `Plus Jakarta Sans Medium`.
- **Pending Step:** `#2D3748` outline with muted body-sm text.

### 4. Source Verification Chips
- Compact, dense components with `JetBrains Mono` domain tags (e.g., `arxiv.org/2402.1098`).
- Semantic prefix: Validated (`#10B981` check icon), Challenged (`#F59E0B` triangle), or Contradicted (`#F43F5E` cross).
- Clicking expands an inline inspect card showing the raw retrieved fragment, quote confidence score, and timestamp.

### 5. Model Configuration Badges
Badges display model states with distinct, low-saturation indicators:
- **Available:** `#222938` background, `#94A3B8` text, small gray dot.
- **Connected:** Surface `#141820`, `#10B981` dot, `Inter Medium` text.
- **Configured / Active:** Solid `#00B4D8` 1px border, `#38BDF8` subtle text tint.
- **Requires API Key:** `#2D3748` border, `#F59E0B` warning pip.
- **Local:** Dedicated badge with `JetBrains Mono` label (`OLLAMA : 11434`) and slate-400 container.

### 6. Buttons & Interactive Controls
- **Primary Action:** Solid `#00B4D8` fill, `#0E1116` contrasting bold text. Hover shifts to `#38BDF8`.
- **Secondary Action:** Transparent background with 1px `#2D3748` border, hovering into `#222938` with white text.
- **Ghost / Utility:** Icon-only or plain text controls with `#94A3B8` default color, shifting to white on hover.

### 7. Form Controls & Inputs
- Dark inputs on `#141820` with 1px `#2D3748` border. No outer glow on active state—just clean 1px `#00B4D8` perimeter highlight. Checkboxes and radio buttons use square-round 4px profiles with solid cyan check fills.