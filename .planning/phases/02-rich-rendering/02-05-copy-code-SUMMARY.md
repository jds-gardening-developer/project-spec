---
phase: 02-rich-rendering
plan: 05
subsystem: ui
tags: [react, clipboard, copy-button, react-markdown, components-prop, css-custom-properties, fenced-code-blocks, mermaid-exclusion]
dependency_graph:
  requires:
    - app/src/components/Pre.jsx#dispatcher
    - app/src/styles.css#theming-surface
    - app/src/components/MermaidPre.jsx#stub
  provides:
    - app/src/components/CopyButton.jsx
    - app/src/components/CopyButton.css
    - app/src/components/Pre.jsx#wrapped-non-mermaid
    - project-spec/_phase2-codeblock-fixture.md
  affects:
    - app/src/components/Pre.jsx
tech_stack:
  added: []
  patterns:
    - react-hook-clipboard-feedback
    - css-custom-properties-consumed
    - module-level-warn-dedupe
    - jsx-language-class-dispatch
key_files:
  created:
    - app/src/components/CopyButton.jsx
    - app/src/components/CopyButton.css
    - project-spec/_phase2-codeblock-fixture.md
  modified:
    - app/src/components/Pre.jsx
key_decisions:
  - "Inline SVG icons (clipboard / check) — no extra icon dependency. Stroke uses currentColor so the CSS custom property `--copy-button-color` (and its --color-success variant) drives the visual state without prop-threading."
  - "Module-level `_warned` flag dedupes the `console.warn` on missing-clipboard so a page with N copy buttons fires at most one warning per page-load (D-16: silent + warn, not noisy)."
  - "Wrapper `<div className=\"copy-button-wrapper\" style={{position: 'relative'}}>` uses inline style for the single positional declaration. Avoids dragging in a second CSS file just for one rule; Phase 4 may consolidate."
  - "CopyButton's `text` prop is computed by walking the <pre>'s React children to find the <code>'s string children. react-markdown@9 contract: each fence produces `<pre><code className=\"language-X\">{rawSource}</code></pre>`."
  - "Fixture file uses underscore prefix so build-manifest's `^YYYY-MM-DD.md$` regex skips it. Verified: manifest contains 1 entry (top: `2026-04-26.md`); no leaked underscore entries."
patterns_established:
  - "CSS-custom-property consumption pattern: components reference `var(--name)` defined in styles.css; Phase 4 brand pass overrides values without touching component code (D-19)."
  - "Underscore-prefixed verification fixtures live under `project-spec/` for human-checkpoint use; same pattern as Plan 02 (cross-link) and Plan 03 (mermaid)."
requirements_completed:
  - REND-05
metrics:
  duration: "~15 minutes"
  completed: "2026-04-26"
  tasks_completed: 3
  tasks_pending_human_verify: 1
  files_changed: 4
---

# Phase 2 Plan 05: Copy-Code Button Summary

**Implemented REND-05: every non-mermaid fenced code block now renders a top-right copy button that writes the block's text to the clipboard via `navigator.clipboard.writeText`, swaps to a checkmark for 1500ms on success, and silently `console.warn`s once when the clipboard API is unavailable.**

## Performance

- **Duration:** ~15 min (including worktree setup: project-spec/ rehydration, npm install)
- **Started:** 2026-04-26T20:38:52Z (worktree base reset to wave-1 commit `1789c1d`)
- **Completed:** 2026-04-26T20:53:51Z
- **Tasks executed:** 3 of 4 (Task 4 is `checkpoint:human-verify`, gated for post-wave UAT)
- **Files changed:** 4 (3 created, 1 modified)

## Accomplishments

- **CopyButton component** (`app/src/components/CopyButton.jsx`) with `useState`-backed 1500ms feedback, async clipboard write, deduped `console.warn` fallback, and inline SVG icons.
- **CopyButton CSS** (`app/src/components/CopyButton.css`) consuming the three Plan 01 CSS custom properties (`--copy-button-color`, `--copy-button-color-success`, `--copy-button-background`) — Phase 4 hand-off surface preserved.
- **Pre.jsx dispatcher** extended: mermaid branch unchanged; non-mermaid branch wraps `<pre>` in a `position: relative` wrapper with the `CopyButton` adjacent. D-13 mermaid-exclusion rule enforced by the existing className check.
- **Fenced-code-block fixture** at `project-spec/_phase2-codeblock-fixture.md` exercising all four cases (bash + json show button; mermaid + inline code do NOT).
- **Build still under budget:** 98.64 KB gzipped main bundle (vs Plan 01 baseline 98.07 KB). Net delta from this plan: +0.57 KB gz for the CopyButton component + CSS.

## Task Commits

Each task was committed atomically (`--no-verify` per parallel-executor protocol):

1. **Task 1: Implement CopyButton component (clipboard write + checkmark feedback + fallback)** — `6259052` (feat)
2. **Task 2: Wire CopyButton into Pre.jsx and verify mermaid exclusion** — `877f7a6` (feat)
3. **Task 3: Add fenced-code-block verification fixture** — `8886ddd` (test)
4. **Task 4: Human verification — Copy buttons appear and work, mermaid blocks excluded** — pending (checkpoint:human-verify, gated for post-wave UAT)

## Files Created/Modified

### Created

- `app/src/components/CopyButton.jsx` — `CopyButton({text})` React component. Module-level dedupe flag (`_warned`) for the missing-API warn. Inline `<svg>` clipboard + check icons. Calls `navigator.clipboard.writeText(text)` inside an async click handler; on success sets `copied=true` for 1500ms; on guard-fail or `writeText` rejection silently warns once.
- `app/src/components/CopyButton.css` — `.copy-button` absolutely positioned (top: 6px / right: 6px), 28×28px, opacity 0.6 → 1 on hover/focus, `--copy-button-color` for default, `--copy-button-color-success` while `.copy-button--copied` is on the element.
- `project-spec/_phase2-codeblock-fixture.md` — Throwaway verification fixture: one bash block, one json block, one mermaid `flowchart LR`, plus an inline-`code` paragraph. Underscore prefix excludes it from `build-manifest.mjs`'s `^YYYY-MM-DD.md$` regex (verified: `app/src/manifest.json` contains 1 entry, top is `2026-04-26.md`, no underscore leaks).

### Modified

- `app/src/components/Pre.jsx` — Added `import { CopyButton } from './CopyButton.jsx'`. Added `getCodeText(children)` helper that walks the `<code>`'s string children. Non-mermaid branch now returns `<div className="copy-button-wrapper" style={{position: 'relative'}}><CopyButton text={text} /><pre>{children}</pre></div>`. Mermaid branch unchanged from Plan 01.

## Decisions Made

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Inline SVG icons over an icon library | `react-markdown` already pulls in plenty; an icon dep would balloon the bundle. Two 16-viewBox SVGs are <500 bytes total. | Implemented |
| Module-level `_warned` flag | A page rendering the dated spec (post Phase 4) may have dozens of code blocks; a console-spammed warn-per-click would be noisy. D-16 says silent — warn once captures both intents. | Implemented |
| Inline `style={{position: 'relative'}}` on the wrapper | Single declaration; adding a second CSS file or a `.copy-button-wrapper` class in CopyButton.css for one rule isn't worth the indirection. Phase 4 may consolidate. | Implemented |
| `getCodeText` filters non-string children | Defensive against react-markdown variants that might inject `<span>` syntax-highlight wrappers in a future plugin pass. Currently react-markdown@9 + remark-gfm passes a single string. | Implemented |

## Deviations from Plan

None — plan executed exactly as written.

## Plan 01 Hand-off Surfaces Consumed

The CopyButton consumes exactly the three CSS custom properties Plan 01 declared:

| Property | Default | Purpose |
|----------|---------|---------|
| `--copy-button-color` | `#6a737d` (neutral grey) | Default icon stroke / hover border |
| `--copy-button-color-success` | `#28a745` (green) | Checkmark icon while in `.copy-button--copied` state |
| `--copy-button-background` | `transparent` | Button surface (kept transparent so the button blends into the `<pre>`'s own background) |

Plan 01 declared 14 CSS custom properties; Plan 05 consumes 3 of them. The other 11 are owned by Plans 02 / 03 / 04 (cross-link, mermaid, schema-card).

## Pre.jsx Concurrency Audit (Wave-2 Conflict Check)

Plan 01's frontmatter declared Pre.jsx the dispatcher's only non-stub seam — touched by Plan 01 (created) and Plan 05 (extended). Plan 03 (mermaid) was supposed to touch only `MermaidPre.jsx`, NOT `Pre.jsx`.

Verified post-execution:

```
$ git log --oneline app/src/components/Pre.jsx
877f7a6 feat(02-05): wire CopyButton into Pre.jsx for non-mermaid fences   ← this plan
3b310f1 feat(02-01): add Phase 2 renderer stubs and cross-link plugin scaffold   ← Plan 01
```

Two commits, exactly the predicted authors. No Plan 03 commit on Pre.jsx — the foundation seam contract held. (Plan 03's mermaid commits live in this worktree's branch tree elsewhere; this worktree's Pre.jsx history confirms only Plans 01 and 05 modified the file in the wave-1 → wave-2 lineage.)

## Verification Results

| Check | Expected | Actual |
|-------|----------|--------|
| `app/src/components/CopyButton.jsx` exists | YES | YES |
| Calls `navigator.clipboard.writeText` | YES | YES (literal substring) |
| Guards `typeof navigator === 'undefined'`, `!navigator.clipboard`, `typeof navigator.clipboard.writeText !== 'function'` | YES | YES |
| `console.warn` on missing API contains `clipboard API unavailable` | YES | YES |
| 1500ms feedback (literal `1500` in source) | YES | YES (`FEEDBACK_MS = 1500`) |
| `app/src/components/CopyButton.css` references all 3 custom properties | YES | YES |
| `app/src/components/CopyButton.css` position absolute top-right | YES | YES (`top: 6px; right: 6px`) |
| `Pre.jsx` imports `CopyButton` and `MermaidBlock` | YES | YES |
| Mermaid branch still uses `language-mermaid` className check | YES | YES |
| Non-mermaid branch wraps `<pre>` in `.copy-button-wrapper` with `position: 'relative'` | YES | YES |
| `npm run build` exits 0 | YES | YES (98.64 KB gz, +0.57 KB vs Plan 01 baseline) |
| Fixture contains bash + json + mermaid + inline-code cases | YES | YES |
| `app/src/manifest.json` does NOT contain any underscore-prefixed entry | YES | YES (1 entry: `2026-04-26.md`) |
| `app/src/manifest.json[0].filename === '2026-04-26.md'` | YES | YES |

## Bundle Size Delta

```
Plan 01 (post-wave-1) baseline:
  dist/assets/index-Cc7HcDzV.js       311.68 kB │ gzip: 98.07 kB
  dist/assets/index-BvAgDrrp.css        0.70 kB │ gzip:  0.35 kB

Plan 05 (this plan):
  dist/assets/index-__T2tWZu.js       313.19 kB │ gzip: 98.64 kB   (+0.57 kB gz)
  dist/assets/index-DBtT5dCy.css        1.32 kB │ gzip:  0.57 kB   (+0.22 kB gz)
```

Both are dwarfed by the dated-spec asset chunk (`24.13 kB gz`). Comfortably under the 100 kB gz soft budget.

## Known Stubs

None. Plan 05 has no remaining stubs in its files; the only stub still in the components directory is `MermaidPre.jsx` (Plan 03's territory) — out of scope.

## Auth Gates

None encountered. Clipboard API access is automatic on HTTPS / localhost; no permission prompt in modern browsers for `writeText`.

## Pending Human Verification (Task 4)

This plan defines a `checkpoint:human-verify` (gated, blocking). The orchestrator should perform — or coordinate — the following browser checks **after Wave 2 plans land on the integration branch**:

1. Activate the fixture (rename `project-spec/_phase2-codeblock-fixture.md` → `project-spec/2099-01-02.md`), restart `npm run dev`.
2. Verify the bash and JSON blocks each show a top-right copy button at ~60% opacity.
3. Click each button; confirm the icon swaps to a checkmark for ~1.5s and the clipboard contains the exact source text (newlines + indentation preserved).
4. Verify the mermaid block renders as an SVG diagram with NO copy button (D-13 enforcement).
5. Verify inline backtick code receives no copy button.
6. Simulate clipboard API unavailability via DevTools (`Object.defineProperty(navigator, 'clipboard', {value: undefined, configurable: true})`); click the button; confirm a single `[spec-viewer] clipboard API unavailable` warning and no second warning on a second click.
7. Cleanup: rename the fixture back to `_phase2-codeblock-fixture.md`.

The fixture file is committed; no special activation scripting is required — just the rename + dev-server restart.

## Phase 4 Hand-off Note

The button currently uses neutral grey (`#6a737d`) + standard green (`#28a745`) for the default and success states. Phase 4 may want to adopt MacPlants green (`#2c8d4f`) for the success state — overriding `--copy-button-color-success` in the brand-pass `:root` block achieves this without touching `app/src/components/CopyButton.{jsx,css}`. Same pattern for the default-state color (`--copy-button-color`) if a brand-tinted neutral is preferred.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries beyond what the plan's `<threat_model>` documents (T-02-05-01 through T-02-05-05). Clipboard write-only (no read), no `eval`, no `document.execCommand`, no programmatic-script trust changes.

## Self-Check: PASSED

Verified files exist:
- FOUND: app/src/components/CopyButton.jsx
- FOUND: app/src/components/CopyButton.css
- FOUND: app/src/components/Pre.jsx (modified)
- FOUND: project-spec/_phase2-codeblock-fixture.md

Verified commits exist:
- FOUND: 6259052 (Task 1: CopyButton component)
- FOUND: 877f7a6 (Task 2: Pre.jsx wiring)
- FOUND: 8886ddd (Task 3: fixture)

Verified build:
- FOUND: `npm run build` exit 0, 303 modules transformed, main bundle 98.64 KB gz (under 100 KB soft budget).

Verified manifest:
- FOUND: 1 entry, top = `2026-04-26.md`, no underscore-prefixed leaks.
