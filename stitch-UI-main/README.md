# Breezy Stitch UI

This repository is the **visual source of truth** for Breezy's replacement UI.

## Keep

The useful source files are the actual Stitch HTML implementations plus the central design system:

- `stitch_breezy_ai_research_workspace/breezy_landing_page_desktop/code.html`
- `stitch_breezy_ai_research_workspace/breezy_landing_page_mobile/code.html`
- `stitch_breezy_ai_research_workspace/chat_desktop/code.html`
- `stitch_breezy_ai_research_workspace/chat_mobile/code.html`
- `stitch_breezy_ai_research_workspace/research_desktop/code.html`
- `stitch_breezy_ai_research_workspace/research_mobile/code.html`
- `stitch_breezy_ai_research_workspace/models_providers_desktop/code.html`
- `stitch_breezy_ai_research_workspace/docs_desktop/code.html`
- `stitch_breezy_ai_research_workspace/settings_desktop/code.html`
- `stitch_breezy_ai_research_workspace/profile_desktop/code.html`
- `stitch_breezy_ai_research_workspace/calm_intelligence_research_workspace/DESIGN.md`

## Not included

Screenshot exports are intentionally removed. The HTML/CSS is the source to transfer into Breezy.

## Missing screens

There is no complete Stitch source for:

- History
- Notes
- Build / IDE
- Canvas
- mobile Models
- mobile Docs
- mobile Settings
- mobile Profile

Those screens should be designed from `DESIGN.md` and the actual Breezy feature contracts, not copied from the old Breezy UI.

## Important

The Stitch HTML contains visual/demo-only values. Do **not** transplant fictional:

- user identities
- model connections
- runtime nodes
- telemetry
- benchmark numbers
- hashes
- cryptographic claims
- verification percentages
- sample research results

The final React UI must reconnect to Breezy's real services and state.
