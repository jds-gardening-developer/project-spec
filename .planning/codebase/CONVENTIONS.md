# Coding Conventions

**Analysis Date:** 2026-04-26

This repository is a documentation-first project. The "code" surface is intentionally tiny: one Node.js helper script (`scripts/update-spec.mjs`), a Docsify viewer (`index.html`), and platform manifests (`package.json`, `netlify.toml`). The bulk of the repo is markdown (`README.md`, `project-spec/2026-04-26.md`). Conventions therefore split cleanly into two domains:

1. **JavaScript conventions** — applies only to `scripts/update-spec.mjs` and any future helper scripts in `scripts/`.
2. **Markdown / spec conventions** — applies to `README.md` and dated files under `project-spec/`.

There are no linters, formatters, or `.editorconfig` files in the repo. Convention is enforced by example and by `CONTRIBUTING.md`.

---

## Naming Patterns

**Files:**
- JS scripts: `kebab-case.mjs` — e.g. `scripts/update-spec.mjs`. Always `.mjs` (the package is ESM).
- Dated spec snapshots: `YYYY-MM-DD.md` under `project-spec/` — e.g. `project-spec/2026-04-26.md`. One file per snapshot, ISO date as the filename.
- Meeting transcripts: `YYYY-MM-DD-<slug>.md` under `transcripts/` — e.g. `transcripts/2026-04-25-erp-walkthrough.md` (per `CONTRIBUTING.md` line 46).
- Output artefacts the script produces: `README.proposed.md`, `update-summary.md`, `update-raw.md` — written to the repo root, intended to be reviewed and then either renamed in or deleted.
- Top-level docs: `UPPERCASE.md` for repo-meta files (`README.md`, `CONTRIBUTING.md`).

**Functions / variables (JS):**
- Local helpers: `camelCase` — e.g. `extract(tag, text)` in `scripts/update-spec.mjs:127`.
- Path / module-level constants that are configuration-like: `SCREAMING_SNAKE_CASE` — `SPEC_PATH`, `SYSTEM_PROMPT`, `USER_MESSAGE` in `scripts/update-spec.mjs:35,50,97`.
- Plain values used for flow: `camelCase` — `transcriptPath`, `spec`, `transcript`, `client`, `response`, `fullText`, `updatedSpec`, `changeSummary`, `startedAt`, `elapsed`.

**Spec section IDs:**
- PRD numbering is canonical: `PRD-0`, `PRD-1`, `PRD-1.1`, `PRD-3.4`, `PRD-XX` (placeholder). Numbers are *immutable* once assigned (`CONTRIBUTING.md` line 40, `scripts/update-spec.mjs:62`). New sections insert in place without renumbering existing ones.
- Section headings use markdown bold inside the heading: `## **PRD-1: Plant Database & Inventory**`. This is consistent across `README.md` and `project-spec/2026-04-26.md`.

---

## Code Style

**Module system:**
- ESM throughout (`package.json` line 6: `"type": "module"`). All scripts use `.mjs` extension and `import` / top-level `await`.
- Built-in modules use the `node:` prefix — `import fs from "node:fs"`, `import path from "node:path"` (`scripts/update-spec.mjs:20-21`).
- Side-effect import for env loading: `import "dotenv/config"` (line 22) — preferred over `require('dotenv').config()` or explicit `dotenv.config()`.

**Strings:**
- Double quotes for string literals (`"node:fs"`, `"utf-8"`).
- Backtick template literals for any interpolation or multi-line string — see `SYSTEM_PROMPT` and `USER_MESSAGE` (`scripts/update-spec.mjs:50,97`).

**Semicolons:** Always present. Statement-terminating, not leading.

**Indentation:** 2 spaces.

**Async style:**
- Top-level `await` is used directly (`scripts/update-spec.mjs:116`) — relies on ESM. Do not wrap the script in an `async function main()`.
- The Anthropic SDK is awaited inline; no `.then()` chains.

**Error handling style:**
- Pre-flight checks at the top of the script: argv validation, file existence, env-var presence (`scripts/update-spec.mjs:25-44`). Each failure prints a human-readable message to `console.error` and exits with `process.exit(1)`.
- No `try/catch` around the SDK call — failures bubble up as unhandled rejections, which is acceptable for a one-shot CLI script.
- Defensive parsing: when `<updated_spec>` can't be extracted from the model response, the raw output is dumped to `update-raw.md` for inspection rather than discarded (`scripts/update-spec.mjs:136-140`).

**Logging:**
- `console.log` for progress / success; `console.error` for failures.
- Progress log lines use a `Label   : value` shape, padded to a consistent column — see `scripts/update-spec.mjs:110-112`.
- Numeric output is formatted with `.toLocaleString()` for thousands separators, and timing with `.toFixed(1)` seconds.
- The script ends with a numbered "Next steps" block telling the user exactly what to run next (`scripts/update-spec.mjs:155-159`). Future scripts should mirror this hand-off pattern.

**Comments:**
- Section dividers use a `// ---------- args ----------` style banner comment to break the script into phases: args, prompt, call, parse, write outputs (`scripts/update-spec.mjs:24,49,107,126,142`).
- File header is a JSDoc-style block at the top describing purpose, usage, and a worked example (`scripts/update-spec.mjs:1-17`). New scripts should start with the same shape.
- The shebang `#!/usr/bin/env node` is present even though scripts are invoked via `node` / `npm run` — keep it for direct executability.

---

## Environment & Config Handling

- Secrets live in `.env` at the repo root, loaded via `import "dotenv/config"`. `.env.example` is the template (referenced in `CONTRIBUTING.md` line 51 and `scripts/update-spec.mjs:43`). Note: neither `.env`, `.env.example`, nor `.gitignore` is present in the working tree at analysis time — `.env` should be created locally and never committed.
- Required env vars are validated *before* any work happens; absent vars exit 1 with a message that names the var and tells the user how to fix it (`scripts/update-spec.mjs:41-44`).
- The Anthropic client is constructed with no arguments — `new Anthropic()` — and picks up `ANTHROPIC_API_KEY` from `process.env` automatically (`scripts/update-spec.mjs:108`).
- Model identifier is hard-coded as a string literal: `model: "claude-opus-4-7"` (`scripts/update-spec.mjs:117`). When the model rolls forward, edit the literal.
- Paths are resolved with `path.resolve(...)` against the script's CWD (the repo root) — the script asserts this by checking for `README.md` and exits if not found (`scripts/update-spec.mjs:35-39`).

---

## NPM Scripts

Defined in `package.json:10-13`:

- `npm run dev` — `npx docsify-cli@4 serve .` — local preview on http://localhost:3000 with hot reload.
- `npm run update-spec` — `node scripts/update-spec.mjs` — wraps the helper script. Invoked as `npm run update-spec -- transcripts/<file>.md` or directly as `node scripts/update-spec.mjs <file>`.

Engines pinned: `"node": ">=20"` (`package.json:8`). Do not introduce features that require Node < 20.

---

## Markdown / Spec Conventions

The spec is the product of this repo. Conventions here are stricter than in the JS code because the spec is consumed by humans (stakeholders) and by Claude (the update script) — both rely on structural stability.

**Source-of-truth file:**
- `CONTRIBUTING.md` declares `README.md` as the single source of truth (line 3): "The single source of truth is `README.md`. Every change is just an edit to that file."
- In practice the working spec is `project-spec/2026-04-26.md` and Docsify's `homepage` points there (`index.html:51`). `README.md` mirrors that content for GitHub rendering. New dated snapshots get added under `project-spec/` and `index.html` is updated to point at them (`README.md:42-56`).

**Heading structure:**
- `#` — document title only (one per file).
- `##` — PRD section: `## **PRD-N: Title**` or `## **Section Name**` for non-PRD sections like "Meeting Action Items".
- `###` — sub-section: `### **What Is It**`, `### **What It Must Do**`, `### **How We Know It's Done**`, `### **Data Model**`. These four sub-sections are the standard skeleton of a PRD.
- `####` — grouped detail under a sub-section (e.g. `#### **Plants**`, `#### **Plant Batches**`).
- Section dividers are horizontal rules: `---` between top-level PRDs.

**Bold-in-heading style:**
- All `##`, `###`, and `####` headings wrap their text in `**...**` markdown bold. This is consistent — preserve it when adding sections.

**Data Model tables:**
- Always 3 columns: `Field | Type | Notes`. Never add a 4th column (`scripts/update-spec.mjs:74-76`, `CONTRIBUTING.md` line 98).
- List **only core persisted fields** — the columns that would actually live in the database. Computed/derived values (totals, balances, lifetime values, reserved-quantity rollups) belong in UI sections of the PRD, not the table (`README.md:88`, `project-spec/2026-04-26.md:19`).
- Field names use `snake_case` and any underscore in markdown is escaped: `created\_by`, `last\_updated\_at`, `latin\_name`. Don't "fix" these escapes — `CONTRIBUTING.md` line 98 and `scripts/update-spec.mjs:78` both forbid cosmetic edits.
- Type column uses lowercase descriptors: `string`, `integer`, `decimal`, `boolean`, `datetime`, `enum`, `date (nullable)`, `FK → Plant`.
- Multi-record relations are described in italic alongside the entity name: `**Plant Variant** *(one per pot size; a Plant has many)*`.

**PRD numbering:**
- Sacred. Do not rename, reorder, or remove `PRD-N` headings (`CONTRIBUTING.md` line 40, `scripts/update-spec.mjs:61-63`).
- New PRDs get a new number and slot into the appropriate place. Only add a new PRD when no existing section legitimately covers the topic.
- Speculative or to-be-numbered sections use `PRD-XX` as a placeholder (e.g. `PRD-XX: DPD Shipping Integration` in `README.md:985`).

**Stage 1 / Stage 2 split:**
- Items are tagged in or out of Stage 1 in the "Scope Decisions Summary" section (`README.md:1021`). Do not promote/demote between stages unless the change is explicit (`CONTRIBUTING.md` line 100).

**Action items:**
- Lives in a dedicated `## **Meeting Action Items (Month YYYY)**` section near the end of the spec (`README.md:1004`).
- Append-only: new items are added; resolved items are removed only when a meeting closes them out (`CONTRIBUTING.md` line 99).

**Cross-references:**
- Inline references use the form `(see PRD-X.Y)` — e.g. `see PRD-3.4`, `see PRD-1`. A future link checker is contemplated in `CONTRIBUTING.md:133`.

**What NOT to edit:**
- Typos, smart quotes, escape characters (`\.`, `\+`, `\>`, `\_`), formatting tweaks. Cosmetic fixes are out of scope for normal edits and explicitly forbidden for the auto-update script (`CONTRIBUTING.md` line 98, `scripts/update-spec.mjs:77-79`).

---

## Docsify / Viewer Conventions

`index.html` is the entire viewer. Conventions to preserve when editing it:

- Single-file mode — `loadSidebar: false` (`index.html:46`). The sidebar is generated from headings, not from a `_sidebar.md` file. Don't introduce one without a deliberate reason.
- `executeScript: false` (`index.html:53`) — inline JS in markdown will not be executed. Keep this off; the spec is content-only.
- `homepage` is the *current* dated spec file (`index.html:51`). When a new snapshot is created, update only this line — see the procedure in `README.md:42-56`.
- `subMaxLevel` and `maxLevel` are both pinned to 1/2 to keep the sidebar to PRD-level only (`index.html:48-49`). Click-to-expand reveals deeper levels.
- Theme color is the MacPlants green `#2c8d4f`, defined as a CSS custom property in `:root` (`index.html:14-17`). Reuse the variable rather than hard-coding the colour again.
- All assets are loaded from jsDelivr CDNs pinned to a major version (`docsify@4`, `docsify-copy-code@2`, `prismjs@1`). Don't switch to floating versions.

---

## Deployment Conventions

`netlify.toml`:
- `publish = "."` and `command = ""` — no build step. Netlify serves the repo root as static files (`netlify.toml:5-6`).
- Both `README.md` and `index.html` get a 5-minute `must-revalidate` cache so spec edits go live quickly (`netlify.toml:9-18`). Mirror this header pattern if a future asset has the same freshness requirements.
- No redirects or rewrites — Docsify handles client-side routing (`netlify.toml:20-22`).

Deploys are push-to-`main`. Netlify rebuilds automatically (`CONTRIBUTING.md:38, 117`).

---

## Conventions Stated in CONTRIBUTING.md

For convenience, the rules `CONTRIBUTING.md` makes explicit:

- Node.js 20+ required (`CONTRIBUTING.md:23`).
- `README.md` is the single source of truth (`CONTRIBUTING.md:3`).
- Section numbering is canonical — add in place, don't reshuffle (`CONTRIBUTING.md:40`).
- Transcripts go in `transcripts/` with a date-prefixed filename (`CONTRIBUTING.md:46`).
- The auto-update script writes proposals (`README.proposed.md`, `update-summary.md`) — never overwrites `README.md` directly (`CONTRIBUTING.md:62-66`).
- Don't fix cosmetic things; don't promote/demote between Stages without explicit basis; Data Model tables stay 3-column with persisted fields only (`CONTRIBUTING.md:90-100`).

---

*Convention analysis: 2026-04-26*
