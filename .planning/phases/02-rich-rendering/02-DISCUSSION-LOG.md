# Phase 2: Rich Rendering - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-26
**Phase:** 2-rich-rendering
**Areas discussed:** Mermaid behavior

---

## Gray Area Selection

User was offered four gray areas for discussion (multiSelect):

| Area | Description | Selected |
|------|-------------|----------|
| PRD cross-link detection & fallback | Detection patterns and broken-link UX | |
| Schema cards: detection + layout | Detection rule and visual structure | |
| Mermaid behavior | Theme + lazy-load + parse-error UX | ✓ |
| Copy-code button UX | Scope, visibility, feedback | |

**User's choice:** Mermaid behavior (only)

After Mermaid was resolved, user was offered to discuss any of the remaining three or accept Claude's defaults documented in CONTEXT.md.

**User's choice:** "Ready for context (Claude picks defaults)" — defaults captured in CONTEXT.md under `Claude's Discretion`.

---

## Mermaid Behavior

### Q1: Mermaid theming — pick the green now, or let Phase 4 own it?

| Option | Description | Selected |
|--------|-------------|----------|
| Default theme now, Phase 4 retheme | Phase 2 ships diagrams with Mermaid's default light theme. Phase 4 owns brand styling and will pass MacPlants green via Mermaid's `themeVariables` config. Keeps Phase 2 focused on capability, no theme rework when Phase 4 lands. | ✓ |
| MacPlants green now | Configure Mermaid `themeVariables` with `#2c8d4f` accent in Phase 2 already. Phase 4 then has nothing to do for diagrams. Risk: small theme contradictions if Phase 4 makes broader brand decisions later. | |
| Mermaid default forever | Don't theme diagrams at all. Even Phase 4 leaves them alone. Simplest, but they'll look stylistically disconnected from the rest of the page. | |

**User's choice:** Default theme now, Phase 4 retheme (recommended)
**Notes:** Aligns with the project-level decision that Phase 4 owns the full brand pass.

### Q2: When should Mermaid get loaded?

| Option | Description | Selected |
|--------|-------------|----------|
| Only when a `mermaid` block is present | Scan rendered markdown for ` ```mermaid ` fences; if at least one exists, dynamically `import('mermaid')`. Today's spec has zero mermaid blocks → zero Mermaid bytes shipped. | ✓ |
| On first viewer mount | Always start the dynamic import as soon as the spec mounts, regardless of whether the document has diagrams. | |
| Lazy, on first scroll into view | IntersectionObserver per `mermaid` block; import + render only when a block scrolls into the viewport. | |

**User's choice:** Only when a `mermaid` block is present (recommended)
**Notes:** Matches the PROJECT.md "loads on demand" constraint precisely.

### Q3: When a `mermaid` block fails to parse, what should the viewer show?

| Option | Description | Selected |
|--------|-------------|----------|
| Show raw source + visible error message | Render a small error banner ('Mermaid parse error: ...') above the original fenced-code source. | ✓ |
| Show error message only | Just the error banner, no raw source. | |
| Silently render as plain code block | Swallow the error, show the source as a regular ` ```mermaid ` code block. | |

**User's choice:** Show raw source + visible error message (recommended)
**Notes:** Spec authors edit markdown directly — they need both the input and the error to fix it.

---

## Claude's Discretion

The user explicitly opted to let Claude pick defaults for the remaining three gray areas after Mermaid:

- PRD cross-link detection & fallback (D-04 through D-07 in CONTEXT.md)
- Schema cards: detection + layout (D-08 through D-12 in CONTEXT.md)
- Copy-code button UX (D-13 through D-16 in CONTEXT.md)

Defaults are documented in CONTEXT.md with reasoning so the user can review and override before `/gsd-plan-phase 2` runs.

## Deferred Ideas

None mentioned during discussion that aren't already noted in CONTEXT.md `<deferred>`:

- Clickable FK relationships in schema cards
- Cross-link checker as CI step (already v2)
- Heading anchor `#` icons on hover (belongs in Phase 3/4)
- Mermaid pan/zoom
