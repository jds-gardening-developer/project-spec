---
phase: 02-rich-rendering
plan: 02
subsystem: cross-link-navigation
tags: [remark-plugin, react-markdown, cross-links, click-time-resolution, rehype-slug, mdast, idempotent-walker, phase2-rend-02]
dependency_graph:
  requires:
    - app/src/components/crossLinkPlugin.js#stub
    - app/src/components/CrossLinkText.jsx#stub
    - app/src/styles.css#theming-surface
    - package.json#test-script
  provides:
    - app/src/components/crossLinkPlugin.js#real
    - app/src/components/CrossLinkText.jsx#real
    - app/src/components/CrossLinkText.css
    - project-spec/_phase2-cross-link-fixture.md
    - app/src/components/crossLinkPlugin.test.js
  affects:
    - app/src/components/crossLinkPlugin.js
    - app/src/components/CrossLinkText.jsx
tech_stack:
  added: []
  patterns:
    - mdast-text-node-splitting
    - regex-bounded-token-rewrite
    - useState-gated-broken-ui
    - module-level-warn-dedup-set
    - click-time-querySelector-prefix-match
    - history-replaceState-hash-update
    - css-custom-property-driven-theming
    - underscore-prefix-skip-in-build-manifest
key_files:
  created:
    - app/src/components/crossLinkPlugin.test.js
    - app/src/components/CrossLinkText.css
    - project-spec/_phase2-cross-link-fixture.md
  modified:
    - app/src/components/crossLinkPlugin.js
    - app/src/components/CrossLinkText.jsx
decisions:
  - "Closing `)` of each (see ...) match folded into the FOLLOWING text chunk rather than emitted as its own text node, so paragraph children look like text + link + text (with the closing paren absorbed) instead of text + link + ')' + text. Reduces noise in mdast and naturally satisfies Test 1's expectation of exactly 3 children for `Foo (see PRD-1) bar.`"
  - "Click-time DOM resolution (NOT render-time). The click handler runs querySelector inside onClick, so heading nodes are guaranteed to be in the DOM when checked. Render-time resolution would have flagged every link as broken on first paint because rehype-slug headings render in the same pass as the cross-links. The broken-link UX is gated on a useState flag flipped by the handler, not on render-time queries — survives StrictMode double-rendering."
  - "console.warn deduplicated via a module-level `_warned` Set. Each missing PRD id produces exactly ONE warning per page lifetime even if the user clicks the same broken link multiple times before the broken-state re-render. Implementation pattern: `if (_warned.has(prdId)) return; _warned.add(prdId); console.warn(...)`."
  - "history.replaceState (not pushState) for hash updates so the browser back button doesn't accumulate one entry per cross-link click. The hash is shareable but click history is not polluted."
  - "External anchors (https://...) get `target=_blank rel=noopener noreferrer` defaults in the no-prdId branch. None exist in the dated spec today; future-proofs against authors adding external links."
metrics:
  duration: "~12 minutes"
  completed: "2026-04-26"
  tasks_completed: 3
  files_changed: 5
---

# Phase 2 Plan 02: Cross-Link Navigation Summary

**One-liner:** Replaced Plan 01's identity-stub remark plugin with a 130-line walker that rewrites `(see PRD-X)` / `(see PRD-X.Y)` text — including comma-separated lists — into mdast `link` nodes; replaced the stub `<a>` renderer with a click-time DOM-resolving `CrossLinkAnchor` that smooth-scrolls on hit and swaps to a dimmed `<span>` with a deduplicated `console.warn` on miss; added the matching CSS + a fixture file that exercises every D-04 rule.

## What Was Built

### Task 1: Remark cross-link plugin (TDD: RED → GREEN)

**Files created/modified:**
- `app/src/components/crossLinkPlugin.test.js` (created — 208 lines, 10 `node:test` cases)
- `app/src/components/crossLinkPlugin.js` (modified — replaced 14-line identity stub with 134-line real plugin)

**Behavior:**
- Two regexes: `SEE_GROUP` matches the surrounding `(see PRD-X[.Y][, PRD-...]*)` parenthesized group; `PRD_TOKEN` walks the inner identifier list. Both anchored at literal `PRD-\d+(?:\.\d+)?` so no scheme injection is possible — the constructed `url` is provably `'#' + [a-z0-9-]+` (T-02-02-01 mitigation).
- Recursive `walk()` over `node.children` arrays mutates in place. Skip set is `{'code','inlineCode','heading'}` (D-04). Bare `PRD-X.Y` without `(see ` prefix is left as plain text (Test 5).
- The closing `)` of each match is folded into the next text chunk rather than emitted as a separate text node — produces a cleaner mdast structure (Test 1: exactly 3 children for `Foo (see PRD-1) bar.`).
- Idempotent: the regex only matches inside text nodes, and converted nodes are `link` nodes (skipped by the `child.type === 'text'` check). A second walk on a once-mutated tree is a no-op (Test 10 deep-clone equality).

**TDD cycle:**
- **RED commit `b9b0e8c`:** test file alone vs. Plan 01's identity stub → 6 pass / 4 fail (the four positive-rewrite tests fail; the no-op skip tests pass against the identity stub by accident).
- **GREEN commit `3234431`:** plugin implementation lands; `npm test` reports 10/10 pass, 0 fail, ~40ms total runtime.

### Task 2: CrossLinkAnchor component + sibling CSS

**Files created/modified:**
- `app/src/components/CrossLinkText.jsx` (modified — replaced 11-line stub with 119-line component)
- `app/src/components/CrossLinkText.css` (created — 25 lines, structural styling only)

**Three-branch render:**
1. **No `data-prd-id`** → not a cross-link. External `https?://` URLs get `target=_blank rel=noopener noreferrer`; otherwise plain pass-through. Future-proofs against external anchors authors might add.
2. **`broken === true`** → render `<span class="cross-link cross-link--broken" title="PRD-X.Y not found in current spec">`. No nav, dimmed cursor.
3. **Default cross-link** → render `<a class="cross-link" onClick={...}>`. The `onClick`:
   - `event.preventDefault()` — no browser hash jump
   - `document.querySelector('[id^="${prdId}"]')` — D-05 prefix match
   - On hit: `target.scrollIntoView({behavior:'smooth', block:'start'})` + `history.replaceState(null, '', '#' + target.id)`
   - On miss: `warnOnce(prdId)` (module Set dedup) + `setBroken(true)` → re-render as Branch 2

**CSS:** uses `var(--cross-link-color)` and `var(--cross-link-broken-color)` declared in `app/src/styles.css` by Plan 01. Phase 4 retheming flips the CSS custom properties without touching the JSX or this file.

### Task 3: Cross-link verification fixture

**Files created:**
- `project-spec/_phase2-cross-link-fixture.md` (53 lines)

The dated `project-spec/2026-04-26.md` contains zero `(see PRD-X.Y)` parenthesized references (verified by `grep -nE '\(see PRD-' project-spec/2026-04-26.md` returning no matches). Without a fixture, Task 4's human checkpoint would have nothing to click. The fixture exercises every D-04 rule:

| Case | Marker | Expected behavior |
|------|--------|-------------------|
| Single ref | `(see PRD-1)` | Smooth scroll to the in-fixture `## PRD-1: Sample Section` heading; URL hash `#prd-1` |
| Decimal ref | `(see PRD-3.4)` | Smooth scroll to `## PRD-3.4: Decimal Section`; hash `#prd-3-4` |
| Comma list | `(see PRD-1, PRD-3.4)` | Two distinct linked tokens; each navigates to its own heading |
| Broken ref | `(see PRD-99)` | First click swaps to dimmed span + one `[spec-viewer] cross-link: PRD-99 not found` console warn |
| Bare token | `PRD-1` (no parens) | Plain text, no link |
| Inline code | `` `(see PRD-1)` `` | Plain monospace text, no link |
| Fenced code | ` ```text ` block containing `(see PRD-1)` | Plain pre-formatted text, no link |
| Heading | `### PRD-XX placeholder heading` | Plain heading text, no link |

**Filename starts with `_` so the build-manifest regex `/^(\d{4}-\d{2}-\d{2})\.md$/` rejects it** — the file lives in `project-spec/` for the human checkpoint to find but never appears in `app/src/manifest.json` and never auto-loads. The dated `2026-04-26.md` remains the homepage.

**To activate at the checkpoint:** rename to `2099-01-01.md` so build-manifest picks it as the newest snapshot, restart `npm run dev`, click through the cases, then rename back.

## Verification Results

| Check | Expected | Actual |
|-------|----------|--------|
| `npm test` (10 cases) | 10 pass / 0 fail / exit 0 | 10 pass / 0 fail / 40.5ms duration / exit 0 |
| Plugin defines/exports default function | YES | YES (`export default function remarkCrossLinks() { return transform; }`) |
| Plugin literal `PRD-` and regex matches both `PRD-N` and `PRD-N.M` | YES | YES (`PRD_TOKEN` and `SEE_GROUP` constants both anchor on `PRD-\d+(?:\.\d+)?`) |
| Plugin skip set covers `code`, `inlineCode`, `heading` | YES | YES (`SKIP_PARENT_TYPES = new Set(['code','inlineCode','heading'])`) |
| Plugin does NOT match bare `PRD-X.Y` | YES | YES (Test 5 asserts) |
| `CrossLinkAnchor` calls `event.preventDefault()` + `scrollIntoView({behavior:'smooth',block:'start'})` | YES | YES |
| `CrossLinkAnchor` resolves via `document.querySelector('[id^="..."]')` inside click handler | YES | YES |
| `CrossLinkAnchor` does NOT call `document.querySelector` during render | YES | YES (the only `querySelector` call sits inside `onClick`) |
| `CrossLinkAnchor` updates `location.hash` via `history.replaceState` | YES | YES |
| `CrossLinkAnchor` flips a `useState` flag and renders `<span class="cross-link cross-link--broken" title=...>` on miss | YES | YES |
| `console.warn` deduped per-id via module Set | YES | YES (`_warned: Set` + `warnOnce()`) |
| `CrossLinkText.css` references `--cross-link-color` and `--cross-link-broken-color` | YES | YES |
| `import './CrossLinkText.css'` in JSX | YES | YES |
| `npm run build` exits 0 | YES | YES (98.98 KB gzipped main bundle, under 100 KB soft budget; 0 errors) |
| Fixture contains all four positive cases AND fenced-code negative AND PRD-N target heading | YES | YES |
| Fixture filename `_phase2-cross-link-fixture.md` cannot match `^(\d{4}-\d{2}-\d{2})\.md$` regex | YES (provable — leading `_` is not a digit) | YES (provable from build-manifest source code line 28) |

## Bundle Size at Plan 02 Completion

```
dist/index.html                       0.42 kB │ gzip:  0.30 kB
dist/assets/index-CFR7oCx2.css        1.01 kB │ gzip:  0.46 kB
dist/assets/2026-04-26-DSQwaBHq.js   70.07 kB │ gzip: 24.13 kB
dist/assets/index-SH0NqRn9.js       313.89 kB │ gzip: 98.98 kB
```

Main bundle is **98.98 KB gzipped** — added ~0.91 KB gz vs Plan 01 (98.07 KB) for the plugin + component + CSS. Still under the 100 KB soft budget. Mermaid is still excluded from the main chunk (Plan 03 will lazy-load it).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Closing-paren text-node splitting produced an extra empty-ish text node**

- **Found during:** Task 1 GREEN — first plugin attempt produced 4 children for `Foo (see PRD-1) bar.` (text `Foo (see `, link, text `)`, text ` bar.`) but Test 1 expected 3 children with the closing paren absorbed into the trailing text.
- **Fix:** Changed `lastIndex = groupEnd` to `lastIndex = afterInnerStart` and removed the standalone `closing` push, so the closing `)` is naturally absorbed into the next iteration's `beforeText` (or, on the last group, into the final `tail`). This produces one merged text node `") bar."` instead of two split nodes.
- **File modified:** `app/src/components/crossLinkPlugin.js` (Task 1 GREEN commit `3234431`)
- **No new tests required** — this is what Tests 1, 2, 3 already required; the fix made them pass.
- **Idempotency preserved** — Test 10 still passes after the change because already-converted link nodes are still skipped on the second walk.

### Worktree Bootstrap (Untracked Setup, Not Part of the Plan)

The worktree started with no `node_modules/` and no `project-spec/` directory. To run tests/build:

1. **Replaced the prior plan's symlink approach with a real `project-spec/` directory.** Plan 01's worktree summary noted symlinking `project-spec/` → main repo for build access; this worktree instead created a real `project-spec/` directory and copied `2026-04-26.md` into it from the main repo (so build-manifest finds the dated file). Both `2026-04-26.md` and the new fixture coexist in the directory; only the underscore-prefixed fixture is intended for commit (the dated spec stays untracked, matching how sibling Wave-2 worktrees handled it — see commits `4d3ec91` Plan 03 and `8886ddd` Plan 05 in the parent log, both of which committed only their underscore fixture).
2. **Ran `npm install`** to materialize `node_modules/`. Untracked, gitignored.
3. **Built `dist/`** via `npm run build` once. Untracked, gitignored.

None of these are committed; all are conventional Wave-2 worktree bootstrap.

## Auth Gates

None encountered.

## Known Stubs

None remaining for cross-link functionality. After this plan:
- `crossLinkPlugin.js` — REAL (was identity stub)
- `CrossLinkText.jsx` — REAL (was pass-through `<a>`)

The other Phase 2 stub files (`SchemaTable.jsx`, `MermaidPre.jsx`, `Pre.jsx` fall-through) remain stubs — those are owned by sibling Wave-2 plans (03, 04, 05) and untouched here.

## Threat Flags

None — the plugin's `url` construction is provably restricted to `'#' + [a-z0-9-]+` because the captured PRD token regex permits only digits and dots (the dot is then converted to a dash). No `javascript:`, no `data:`, no scheme injection. T-02-02-01 mitigation verified by Tests 1–3.

The click handler invokes only `scrollIntoView` and `history.replaceState` — both inert browser APIs. No `eval`, no dynamic `<script>` injection, no `dangerouslySetInnerHTML`. T-02-02-05 (Elevation of Privilege) is n/a as documented in the plan threat model.

## Files Touched (Strict File-Ownership Confirmation)

This plan modified ONLY its five owned files:

| File | Status | Owner |
|------|--------|-------|
| `app/src/components/crossLinkPlugin.js` | Modified (Plan 01 stub → real) | Plan 02 |
| `app/src/components/crossLinkPlugin.test.js` | Created | Plan 02 |
| `app/src/components/CrossLinkText.jsx` | Modified (Plan 01 stub → real) | Plan 02 |
| `app/src/components/CrossLinkText.css` | Created | Plan 02 |
| `project-spec/_phase2-cross-link-fixture.md` | Created | Plan 02 |

`package.json`, `app/src/SpecViewer.jsx`, `app/src/styles.css`, `app/src/components/SchemaTable.jsx`, `app/src/components/SchemaTable.helpers.js`, `app/src/components/Pre.jsx`, `app/src/components/MermaidPre.jsx` — all untouched, owned by other plans.

## Deferred Issues

### Task 3 fixture commit

**Status:** The fixture file is on disk at `project-spec/_phase2-cross-link-fixture.md` and is correct (verified via Read tool — 53 lines, all four positive cases plus negatives). Two-task verification (npm test 10/10, npm run build exit 0) succeeded earlier in this session.

**Issue:** The session's bash sandbox began rejecting all `git add` and `git commit` invocations partway through Task 3, after Task 2 had been committed successfully. Read-only git operations (status, log, diff, rev-parse) continue to work; only index/commit mutations are denied with the generic "Permission to use Bash has been denied" message. This is not a hook failure (no active hooks in `.git/hooks`) — it appears to be a session-level harness restriction.

**Net effect:**
- Task 1 RED: committed (`b9b0e8c`)
- Task 1 GREEN: committed (`3234431`)
- Task 2: committed (`b743b74`)
- Task 3 fixture: written to disk ✓, NOT committed
- This SUMMARY.md: written to disk ✓, NOT committed (same harness restriction)

**Resolution path:** A subsequent agent run, or a manual `git add project-spec/_phase2-cross-link-fixture.md .planning/phases/02-rich-rendering/02-02-cross-links-SUMMARY.md && git commit` from the user, will land both files. The fixture content is authoritative — do not regenerate. Verification commands available once committed: `git log --oneline -5` should show `test(02-02): add cross-link verification fixture` (or equivalent) and `docs(02-02): complete cross-links plan` after the orchestrator's metadata commit.

The fixture file itself is byte-identical to what the plan specified (verified by tracing the Write tool output against the plan's `<action>` block) and the SUMMARY documents its purpose, so no information is lost — only the git history is short two commits.

## Self-Check: PARTIAL

Verified files exist on disk:
- FOUND: app/src/components/crossLinkPlugin.test.js (208 lines, 10 test blocks)
- FOUND: app/src/components/crossLinkPlugin.js (134 lines, real implementation)
- FOUND: app/src/components/CrossLinkText.jsx (119 lines, real implementation)
- FOUND: app/src/components/CrossLinkText.css (25 lines)
- FOUND: project-spec/_phase2-cross-link-fixture.md (53 lines)
- FOUND: .planning/phases/02-rich-rendering/02-02-cross-links-SUMMARY.md (this file)

Verified commits exist:
- FOUND: b9b0e8c (Task 1 RED — `test(02-02): add failing tests for cross-link plugin`)
- FOUND: 3234431 (Task 1 GREEN — `feat(02-02): implement remark cross-link plugin`)
- FOUND: b743b74 (Task 2 — `feat(02-02): wire cross-link click handler and dimmed broken-ref UX`)
- MISSING: Task 3 fixture commit — file exists on disk, harness blocked git mutations partway through the session (see "Deferred Issues" above)
- MISSING: This SUMMARY commit — same harness restriction

The plan's substantive work (plugin + click handler + tests + CSS + fixture content) is **complete**. Only the final two git commits are missing due to a session-level harness limitation; both files are present on disk and ready for a follow-up commit.
