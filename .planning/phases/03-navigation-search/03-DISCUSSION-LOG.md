# Phase 3: Navigation & Search - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-26
**Phase:** 03-navigation-search
**Areas discussed:** Sidebar layout & behavior

---

## Sidebar layout & behavior

### Q1: How should H3 sub-headings behave under each H2 PRD entry?

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-expand for active section only | Scroll-spy: as user scrolls through the spec, H3s under the currently-visible PRD expand; H3s under inactive PRDs stay collapsed. Matches Docsify's behavior — the goal stated in ROADMAP. | ✓ |
| Always expanded everywhere | Every H2 shows all its H3s at all times. Long sidebar (~50+ H3 entries visible at once). No scroll-spy logic needed. | |
| Click H2 to toggle | User explicitly clicks an H2 to expand/collapse its H3s; multiple sections can stay open. More user control, less automatic feel. | |

**User's choice:** Auto-expand for active section only (Recommended)
**Notes:** Aligns with ROADMAP's explicit goal "matches the existing Docsify behavior."

---

### Q2: How should the sidebar behave on narrow viewports (mobile / <768px)?

| Option | Description | Selected |
|--------|-------------|----------|
| Drawer with hamburger toggle | Sidebar hidden by default; tap a hamburger button in the header to slide it in from the left. Modern doc-site pattern; reading area gets full width. | ✓ |
| Persistent (always visible) | Sidebar stays in place at all viewport sizes. Simpler, but eats screen real estate on small screens — spec body becomes very narrow. | |
| Hidden below threshold | Sidebar disappears entirely below 768px with no toggle. User navigates via in-page anchors only. Simplest implementation; least navigable. | |

**User's choice:** Drawer with hamburger toggle (Recommended)

---

### Q3: How should the active-section indicator look (Phase 4 will add brand color later)?

| Option | Description | Selected |
|--------|-------------|----------|
| Left accent bar | A 3-4px vertical bar on the left edge of the active entry, plus bolded text. Phase 4 colors the bar with #2c8d4f. Clear visual anchor that mirrors VS Code / Docusaurus. | ✓ |
| Bold text only | Active entry just bolds the text — no bar, no background. Minimal; less clear at a glance. | |
| Filled background | Active entry gets a tinted background pill. Phase 4 themes the fill color. More prominent but heavier visually. | |

**User's choice:** Left accent bar (Recommended)

---

### Q4: What should appear at the very top of the sidebar?

| Option | Description | Selected |
|--------|-------------|----------|
| Site title 'MacPlants ERP' + spec date | Top: 'MacPlants ERP' (BRD-04, picked up structurally; Phase 4 styles it) and a smaller line showing 'Viewing: 2026-04-26'. | |
| Just the site title | 'MacPlants ERP' only. Spec date stays in the body header where Phase 1 put it. | |
| Nothing — jump straight to nav | First sidebar entry is the first PRD heading. Defer all branding and titling to Phase 4. | ✓ |

**User's choice:** Nothing — jump straight to nav
**Notes:** Reinforces the "Phase 3 stays structurally neutral; Phase 4 owns branding" principle the user has been consistent about across phases.

---

## Routing question (after Sidebar batch)

### Q5: Other 3 areas need locked decisions before planning — discuss them or let Claude pick defaults?

| Option | Description | Selected |
|--------|-------------|----------|
| Claude picks defaults for the other 3 | Lock reasonable defaults for search library, search UI, hash deep-link. Documented in CONTEXT.md as Claude's Discretion. | ✓ |
| Discuss search library only | Drill into FlexSearch vs MiniSearch tradeoffs. Other two stay Claude's Discretion. | |
| Discuss all three | One batch of questions covering all three remaining areas. | |
| More questions about sidebar | Continue with sidebar follow-ups. | |

**User's choice:** Claude picks defaults for the other 3

---

## Claude's Discretion

The user delegated the following decisions to Claude (see CONTEXT.md D-05 through D-15):

- **Search library** — MiniSearch picked over FlexSearch (smaller bundle, idiomatic JS, sufficient scope)
- **Search index timing** — Build-time JSON index via `scripts/build-search-index.mjs`, wired into predev/prebuild hooks
- **Search index granularity** — One record per heading (H1/H2/H3) with body text up to next equal-or-higher heading
- **Search UI shape** — Modal overlay, ~640px desktop / full-width mobile, click-outside dismisses
- **Search keyboard** — Cmd+K (mac) / Ctrl+K (other), Esc dismisses, ↑↓ navigate, Enter selects
- **Search result format** — Heading bold + parent PRD context grey + 1-line snippet with highlighted matches; max 20 results
- **Search empty state** — Nothing shown until user types
- **Search selection behavior** — Dismiss modal, update hash, smooth-scroll
- **Hash deep-link timing** — Single-shot effect after first content render
- **Hash deep-link unknown handling** — Silently do nothing; no error banner

## Deferred Ideas

- Heading anchor `#` icons on hover (Phase 4 territory)
- Sidebar drawer state persistence in localStorage (out of scope)
- Search filters by Stage 1/2 (tied to v2 FILT-01)
- Multi-version search (tied to v2 VER-01)
- Recently-viewed sections / breadcrumbs (v2)
- Additional keyboard shortcuts beyond Cmd+K (post-v1 interaction polish)
