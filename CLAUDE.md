<!-- HANDBOOK:start -->
## Handbook — read this first

The handbook is split across small files under [Handbook/](Handbook/) and inlined here via `@`-imports. Edit the source files, not this section.

@Handbook/about.md

@Handbook/working-style.md

@Handbook/reply-format.md
<!-- HANDBOOK:end -->

<!-- GSD:project-start source:PROJECT.md -->
## Project

**MacPlants Spec Viewer**

A small, lightweight Vite + React app that renders the MacPlants ERP project specification as an interactive documentation site. It replaces the current Docsify-based viewer, reads dated markdown snapshots from `project-spec/`, automatically displays the newest snapshot by ISO date, and adds custom interactivity (cross-link navigation, Mermaid diagrams, a styled data-model viewer) that Docsify cannot do natively. The audience is the project owner (Sigurd) and the client (MacPlants) — both reviewing requirements together.

**Core Value:** The client and the developer can read the latest spec, follow PRD cross-references in one click, and visually understand data-model relationships — all from a fast static page that mirrors today's Docsify experience and adds the interactivity Docsify lacks.

### Constraints

- **Tech stack**: Vite + React + react-markdown + remark-gfm — chosen for smallest viable footprint, no SSR, deploy-static-files simplicity
- **Markdown library**: `react-markdown` with `remark-gfm` (tables, strikethrough) — handles 95% of the spec; custom renderers for cross-links + data-model tables
- **Search library**: FlexSearch or MiniSearch (decision deferred to research/planning) — must be client-side, build-time-indexed, <20KB
- **Diagram library**: Mermaid (latest stable) — rendered via dynamic import to keep main bundle small
- **Runtime**: Node 20+ for build (already required for the existing tooling layer)
- **Deploy**: Netlify (existing; switch from `publish = "."` to `publish = "dist"`, add `command = "npm run build"`)
- **Branch**: work continues on `web-app-refactor` (already checked out; uncommitted refactor will be folded in)
- **No backend**: viewer stays a static SPA — no server, database, or auth
- **Performance**: must render the existing 70KB spec without lag; first-paint target similar to Docsify (<1s on broadband)
- **Bundle budget (soft)**: aim for <100KB gzipped main bundle excluding Mermaid (which loads on demand)
- **Brand**: keep MacPlants green `#2c8d4f` and the general visual feel from the Docsify version
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- JavaScript (ES Modules) — Used in `scripts/update-spec.mjs` for tooling
- HTML5 — Used in `index.html` as the Docsify viewer entry point
- Markdown — Used for the actual specification content (`README.md`, `project-spec/2026-04-26.md`)
- CSS (inline `<style>` block in `index.html`) — Theming overrides for Docsify
## Runtime
- Node.js >=20 (declared in `package.json` `engines` field)
- Browser (any modern evergreen browser) for the rendered Docsify site
- npm (lockfile version 3 — `package-lock.json` present)
- Lockfile: present (`package-lock.json`)
## Frameworks
- Docsify v4 — Client-side markdown documentation site generator. Loaded via `https://cdn.jsdelivr.net/npm/docsify@4` in `index.html`
- Docsify Vue theme — `https://cdn.jsdelivr.net/npm/docsify@4/lib/themes/vue.css`
- `docsify@4/lib/plugins/search.min.js` — Full-text search (Ctrl+K)
- `docsify-pagination` — Previous/Next navigation
- `docsify-copy-code@2` — Copy-to-clipboard buttons on code blocks
- `prismjs@1` (bash + json components) — Syntax highlighting
- Not detected (no test framework, no test files, no test scripts in `package.json`)
- `docsify-cli@4` — Local dev server, invoked via `npx docsify-cli@4 serve .` (the `npm run dev` script). Not declared as a dependency — pulled on demand.
## Key Dependencies
- `@anthropic-ai/sdk` ^0.90.0 — Anthropic Claude API client used by `scripts/update-spec.mjs` to fold meeting transcripts into the spec
- `dotenv` ^16.4.5 — Loads `ANTHROPIC_API_KEY` from `.env` for the update script
- `json-schema-to-ts` ^3.1.1 — Pulled in by `@anthropic-ai/sdk`
- `@babel/runtime` ^7.29.2 — Transitive dependency of `json-schema-to-ts`
- `ts-algebra` ^2.0.0 — Transitive dependency of `json-schema-to-ts`
- `zod` ^3.25.0 || ^4.0.0 — Optional peer dependency of `@anthropic-ai/sdk` (not installed)
- No database client, no web framework, no build pipeline — the site is purely static.
## Configuration
- `ANTHROPIC_API_KEY` is required to run `scripts/update-spec.mjs`. Loaded via `import "dotenv/config"` from a `.env` file at the repo root.
- A `.env.example` is referenced by the script's error message (`"Copy .env.example to .env and fill it in."`) and by `CONTRIBUTING.md`. Neither `.env` nor `.env.example` is currently present at the repo root.
- No `.gitignore` file is present in the working tree.
- `netlify.toml` — Declares `publish = "."`, empty build command, and Cache-Control headers (300s max-age) for `/README.md` and `/index.html`.
- `package.json` — Declares `"type": "module"` so all `.js`/`.mjs` files are ESM by default.
- No `tsconfig.json`, no bundler config (Webpack/Vite/esbuild), no linter config (ESLint/Biome), no formatter config (Prettier).
- `homepage: 'project-spec/2026-04-26.md'` — Current spec entry
- `loadSidebar: false` — Single-file mode, sidebar generated from headings
- `subMaxLevel: 1`, `maxLevel: 2` — Only h2 headings shown in sidebar
- `executeScript: false` — Inline JS in markdown is never executed (security)
- `search` plugin: 1-day cache, depth 4, `paths: 'auto'`
- Theme color: `#2c8d4f` (MacPlants green)
## Platform Requirements
- Node.js 20 or newer
- npm (for `npm install`, `npm run dev`)
- An Anthropic API key (only required for the `update-spec` workflow, not for local viewing)
- A browser (for viewing the rendered site at `http://localhost:3000` after `npm run dev`)
- Netlify (static hosting). Auto-deploys on push to `main` per `CONTRIBUTING.md`.
- Repository: `https://github.com/jds-gardening-developer/project-spec.git` (per `.git/config`).
- No server, no database, no build step — Netlify serves the repo root verbatim.
## Project Type Summary
- Docsify (CDN) renders markdown in the browser at request time.
- Netlify serves the static files.
- The only Node.js code is the optional `scripts/update-spec.mjs` tool for AI-assisted spec updates.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- JS scripts: `kebab-case.mjs` — e.g. `scripts/update-spec.mjs`. Always `.mjs` (the package is ESM).
- Dated spec snapshots: `YYYY-MM-DD.md` under `project-spec/` — e.g. `project-spec/2026-04-26.md`. One file per snapshot, ISO date as the filename.
- Meeting transcripts: `YYYY-MM-DD-<slug>.md` under `transcripts/` — e.g. `transcripts/2026-04-25-erp-walkthrough.md` (per `CONTRIBUTING.md` line 46).
- Output artefacts the script produces: `README.proposed.md`, `update-summary.md`, `update-raw.md` — written to the repo root, intended to be reviewed and then either renamed in or deleted.
- Top-level docs: `UPPERCASE.md` for repo-meta files (`README.md`, `CONTRIBUTING.md`).
- Local helpers: `camelCase` — e.g. `extract(tag, text)` in `scripts/update-spec.mjs:127`.
- Path / module-level constants that are configuration-like: `SCREAMING_SNAKE_CASE` — `SPEC_PATH`, `SYSTEM_PROMPT`, `USER_MESSAGE` in `scripts/update-spec.mjs:35,50,97`.
- Plain values used for flow: `camelCase` — `transcriptPath`, `spec`, `transcript`, `client`, `response`, `fullText`, `updatedSpec`, `changeSummary`, `startedAt`, `elapsed`.
- PRD numbering is canonical: `PRD-0`, `PRD-1`, `PRD-1.1`, `PRD-3.4`, `PRD-XX` (placeholder). Numbers are *immutable* once assigned (`CONTRIBUTING.md` line 40, `scripts/update-spec.mjs:62`). New sections insert in place without renumbering existing ones.
- Section headings use markdown bold inside the heading: `## **PRD-1: Plant Database & Inventory**`. This is consistent across `README.md` and `project-spec/2026-04-26.md`.
## Code Style
- ESM throughout (`package.json` line 6: `"type": "module"`). All scripts use `.mjs` extension and `import` / top-level `await`.
- Built-in modules use the `node:` prefix — `import fs from "node:fs"`, `import path from "node:path"` (`scripts/update-spec.mjs:20-21`).
- Side-effect import for env loading: `import "dotenv/config"` (line 22) — preferred over `require('dotenv').config()` or explicit `dotenv.config()`.
- Double quotes for string literals (`"node:fs"`, `"utf-8"`).
- Backtick template literals for any interpolation or multi-line string — see `SYSTEM_PROMPT` and `USER_MESSAGE` (`scripts/update-spec.mjs:50,97`).
- Top-level `await` is used directly (`scripts/update-spec.mjs:116`) — relies on ESM. Do not wrap the script in an `async function main()`.
- The Anthropic SDK is awaited inline; no `.then()` chains.
- Pre-flight checks at the top of the script: argv validation, file existence, env-var presence (`scripts/update-spec.mjs:25-44`). Each failure prints a human-readable message to `console.error` and exits with `process.exit(1)`.
- No `try/catch` around the SDK call — failures bubble up as unhandled rejections, which is acceptable for a one-shot CLI script.
- Defensive parsing: when `<updated_spec>` can't be extracted from the model response, the raw output is dumped to `update-raw.md` for inspection rather than discarded (`scripts/update-spec.mjs:136-140`).
- `console.log` for progress / success; `console.error` for failures.
- Progress log lines use a `Label   : value` shape, padded to a consistent column — see `scripts/update-spec.mjs:110-112`.
- Numeric output is formatted with `.toLocaleString()` for thousands separators, and timing with `.toFixed(1)` seconds.
- The script ends with a numbered "Next steps" block telling the user exactly what to run next (`scripts/update-spec.mjs:155-159`). Future scripts should mirror this hand-off pattern.
- Section dividers use a `// ---------- args ----------` style banner comment to break the script into phases: args, prompt, call, parse, write outputs (`scripts/update-spec.mjs:24,49,107,126,142`).
- File header is a JSDoc-style block at the top describing purpose, usage, and a worked example (`scripts/update-spec.mjs:1-17`). New scripts should start with the same shape.
- The shebang `#!/usr/bin/env node` is present even though scripts are invoked via `node` / `npm run` — keep it for direct executability.
## Environment & Config Handling
- Secrets live in `.env` at the repo root, loaded via `import "dotenv/config"`. `.env.example` is the template (referenced in `CONTRIBUTING.md` line 51 and `scripts/update-spec.mjs:43`). Note: neither `.env`, `.env.example`, nor `.gitignore` is present in the working tree at analysis time — `.env` should be created locally and never committed.
- Required env vars are validated *before* any work happens; absent vars exit 1 with a message that names the var and tells the user how to fix it (`scripts/update-spec.mjs:41-44`).
- The Anthropic client is constructed with no arguments — `new Anthropic()` — and picks up `ANTHROPIC_API_KEY` from `process.env` automatically (`scripts/update-spec.mjs:108`).
- Model identifier is hard-coded as a string literal: `model: "claude-opus-4-7"` (`scripts/update-spec.mjs:117`). When the model rolls forward, edit the literal.
- Paths are resolved with `path.resolve(...)` against the script's CWD (the repo root) — the script asserts this by checking for `README.md` and exits if not found (`scripts/update-spec.mjs:35-39`).
## NPM Scripts
- `npm run dev` — `npx docsify-cli@4 serve .` — local preview on http://localhost:3000 with hot reload.
- `npm run update-spec` — `node scripts/update-spec.mjs` — wraps the helper script. Invoked as `npm run update-spec -- transcripts/<file>.md` or directly as `node scripts/update-spec.mjs <file>`.
## Markdown / Spec Conventions
- `CONTRIBUTING.md` declares `README.md` as the single source of truth (line 3): "The single source of truth is `README.md`. Every change is just an edit to that file."
- In practice the working spec is `project-spec/2026-04-26.md` and Docsify's `homepage` points there (`index.html:51`). `README.md` mirrors that content for GitHub rendering. New dated snapshots get added under `project-spec/` and `index.html` is updated to point at them (`README.md:42-56`).
- `#` — document title only (one per file).
- `##` — PRD section: `## **PRD-N: Title**` or `## **Section Name**` for non-PRD sections like "Meeting Action Items".
- `###` — sub-section: `### **What Is It**`, `### **What It Must Do**`, `### **How We Know It's Done**`, `### **Data Model**`. These four sub-sections are the standard skeleton of a PRD.
- `####` — grouped detail under a sub-section (e.g. `#### **Plants**`, `#### **Plant Batches**`).
- Section dividers are horizontal rules: `---` between top-level PRDs.
- All `##`, `###`, and `####` headings wrap their text in `**...**` markdown bold. This is consistent — preserve it when adding sections.
- Always 3 columns: `Field | Type | Notes`. Never add a 4th column (`scripts/update-spec.mjs:74-76`, `CONTRIBUTING.md` line 98).
- List **only core persisted fields** — the columns that would actually live in the database. Computed/derived values (totals, balances, lifetime values, reserved-quantity rollups) belong in UI sections of the PRD, not the table (`README.md:88`, `project-spec/2026-04-26.md:19`).
- Field names use `snake_case` and any underscore in markdown is escaped: `created\_by`, `last\_updated\_at`, `latin\_name`. Don't "fix" these escapes — `CONTRIBUTING.md` line 98 and `scripts/update-spec.mjs:78` both forbid cosmetic edits.
- Type column uses lowercase descriptors: `string`, `integer`, `decimal`, `boolean`, `datetime`, `enum`, `date (nullable)`, `FK → Plant`.
- Multi-record relations are described in italic alongside the entity name: `**Plant Variant** *(one per pot size; a Plant has many)*`.
- Sacred. Do not rename, reorder, or remove `PRD-N` headings (`CONTRIBUTING.md` line 40, `scripts/update-spec.mjs:61-63`).
- New PRDs get a new number and slot into the appropriate place. Only add a new PRD when no existing section legitimately covers the topic.
- Speculative or to-be-numbered sections use `PRD-XX` as a placeholder (e.g. `PRD-XX: DPD Shipping Integration` in `README.md:985`).
- Items are tagged in or out of Stage 1 in the "Scope Decisions Summary" section (`README.md:1021`). Do not promote/demote between stages unless the change is explicit (`CONTRIBUTING.md` line 100).
- Lives in a dedicated `## **Meeting Action Items (Month YYYY)**` section near the end of the spec (`README.md:1004`).
- Append-only: new items are added; resolved items are removed only when a meeting closes them out (`CONTRIBUTING.md` line 99).
- Inline references use the form `(see PRD-X.Y)` — e.g. `see PRD-3.4`, `see PRD-1`. A future link checker is contemplated in `CONTRIBUTING.md:133`.
- Typos, smart quotes, escape characters (`\.`, `\+`, `\>`, `\_`), formatting tweaks. Cosmetic fixes are out of scope for normal edits and explicitly forbidden for the auto-update script (`CONTRIBUTING.md` line 98, `scripts/update-spec.mjs:77-79`).
## Docsify / Viewer Conventions
- Single-file mode — `loadSidebar: false` (`index.html:46`). The sidebar is generated from headings, not from a `_sidebar.md` file. Don't introduce one without a deliberate reason.
- `executeScript: false` (`index.html:53`) — inline JS in markdown will not be executed. Keep this off; the spec is content-only.
- `homepage` is the *current* dated spec file (`index.html:51`). When a new snapshot is created, update only this line — see the procedure in `README.md:42-56`.
- `subMaxLevel` and `maxLevel` are both pinned to 1/2 to keep the sidebar to PRD-level only (`index.html:48-49`). Click-to-expand reveals deeper levels.
- Theme color is the MacPlants green `#2c8d4f`, defined as a CSS custom property in `:root` (`index.html:14-17`). Reuse the variable rather than hard-coding the colour again.
- All assets are loaded from jsDelivr CDNs pinned to a major version (`docsify@4`, `docsify-copy-code@2`, `prismjs@1`). Don't switch to floating versions.
## Deployment Conventions
- `publish = "."` and `command = ""` — no build step. Netlify serves the repo root as static files (`netlify.toml:5-6`).
- Both `README.md` and `index.html` get a 5-minute `must-revalidate` cache so spec edits go live quickly (`netlify.toml:9-18`). Mirror this header pattern if a future asset has the same freshness requirements.
- No redirects or rewrites — Docsify handles client-side routing (`netlify.toml:20-22`).
## Conventions Stated in CONTRIBUTING.md
- Node.js 20+ required (`CONTRIBUTING.md:23`).
- `README.md` is the single source of truth (`CONTRIBUTING.md:3`).
- Section numbering is canonical — add in place, don't reshuffle (`CONTRIBUTING.md:40`).
- Transcripts go in `transcripts/` with a date-prefixed filename (`CONTRIBUTING.md:46`).
- The auto-update script writes proposals (`README.proposed.md`, `update-summary.md`) — never overwrites `README.md` directly (`CONTRIBUTING.md:62-66`).
- Don't fix cosmetic things; don't promote/demote between Stages without explicit basis; Data Model tables stay 3-column with persisted fields only (`CONTRIBUTING.md:90-100`).
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Zero build pipeline — `index.html` loads Docsify from a CDN and renders markdown at runtime in the browser
- Single-source-of-truth content model — one canonical markdown file (`README.md`) is the spec; dated snapshots in `project-spec/` provide the audit trail
- Detached tooling layer — `scripts/update-spec.mjs` is a one-shot Node CLI that calls the Anthropic API to fold meeting transcripts into the spec; it never runs in the browser and is not part of the deploy
- Deploy-as-serve — Netlify treats the repo root as the publish directory; there is no compiled artifact
## Layers
- Purpose: Holds the human-readable specification and its versioned snapshots
- Location: `README.md`, `project-spec/`
- Contains: Long-form markdown documents (PRD-numbered sections, Data Model tables, action items)
- Depends on: Nothing — pure markdown
- Used by: The presentation layer (Docsify) at runtime; the tooling layer (`scripts/update-spec.mjs`) when folding in meeting outcomes
- Purpose: Renders the spec in a browser as a navigable, searchable site
- Location: `index.html`
- Contains: Docsify configuration (`window.$docsify`), inline theme CSS, CDN `<script>` tags for Docsify core and plugins
- Depends on: jsdelivr CDN (`docsify@4`, `docsify-pagination`, `docsify-copy-code`, `prismjs@1`)
- Used by: End users hitting the deployed Netlify URL or running `npm run dev`
- Purpose: Automates folding a meeting transcript into the spec via Claude
- Location: `scripts/update-spec.mjs`
- Contains: One Node ESM script that reads `README.md` + a transcript path, calls Anthropic, writes `README.proposed.md` and `update-summary.md` for human review
- Depends on: `@anthropic-ai/sdk`, `dotenv`, Node 20+, `ANTHROPIC_API_KEY` env var
- Used by: The spec maintainer manually via `node scripts/update-spec.mjs <transcript>`; never runs in production
- Purpose: Serves the static repo root to the public internet
- Location: `netlify.toml`
- Contains: Netlify build config (`publish = "."`, empty `command`), Cache-Control headers for `/README.md` and `/index.html`
- Depends on: Netlify's static hosting + GitHub push trigger
- Used by: All deployed traffic
- Purpose: Holds raw meeting transcripts that feed the tooling layer
- Location: `transcripts/` (currently only contains `.gitkeep`)
- Contains: Markdown transcripts, named by date (e.g. `2026-04-25-erp-walkthrough.md` per `CONTRIBUTING.md` convention)
- Depends on: Nothing
- Used by: `scripts/update-spec.mjs` as a CLI argument
## Data Flow
- No application state — the site is read-only
- All "state" is git history (commits to `README.md` + dated files in `project-spec/`)
- Docsify caches search index for 24 hours client-side (`maxAge: 86400000`)
## Key Abstractions
- Purpose: Canonical product requirements document with stable PRD-numbered section identifiers
- Examples: `README.md`, `project-spec/2026-04-26.md`
- Pattern: Long markdown with hierarchical PRD-X.Y headings; Data Model tables in fixed 3-column format (Field | Type | Notes); only persisted fields listed (no derived/computed values)
- Purpose: Immutable point-in-time record of the spec
- Examples: `project-spec/2026-04-26.md`
- Pattern: Filename is `YYYY-MM-DD.md`; one snapshot per significant revision; pointed at by `homepage` in `index.html`
- Purpose: Raw meeting record that feeds the LLM update flow
- Examples: `transcripts/2026-04-25-erp-walkthrough.md` (per `CONTRIBUTING.md` convention; folder currently empty apart from `.gitkeep`)
- Pattern: Filename is `YYYY-MM-DD-<slug>.md`; passed as the sole CLI arg to `scripts/update-spec.mjs`
- Purpose: LLM output staged for human review before promotion
- Examples: `README.proposed.md`, `update-summary.md` (both written to repo root by the script, neither committed long-term)
- Pattern: Promoted via `mv README.proposed.md README.md` or discarded with `rm`
- Purpose: All site-rendering behaviour (homepage, sidebar depth, search, pagination, copy-code) declared in one place
- Examples: `window.$docsify = { ... }` in `index.html` lines 43-72
- Pattern: Plain JS object literal; no separate config file
## Entry Points
- Location: `index.html`
- Triggers: HTTP GET on the Netlify-served root
- Responsibilities: Load Docsify + plugins from CDN, declare `window.$docsify` config, render `homepage` markdown into `#app`
- Location: `package.json` script `dev` → `npx docsify-cli@4 serve .`
- Triggers: Maintainer runs `npm run dev`
- Responsibilities: Serves the repo root on `http://localhost:3000` with hot-reload on `README.md` saves
- Location: `scripts/update-spec.mjs` (invoked via `npm run update-spec` → `node scripts/update-spec.mjs` or directly with a transcript arg)
- Triggers: Maintainer runs the script after a meeting
- Responsibilities: Validate args + env, read spec + transcript, call Anthropic, parse XML-tagged response, write `README.proposed.md` + `update-summary.md`
- Location: `netlify.toml`
- Triggers: `git push` to `main` (configured in Netlify UI per `CONTRIBUTING.md`)
- Responsibilities: Publish the repo root as static files; apply Cache-Control headers to `/README.md` and `/index.html` (`max-age=300, must-revalidate`)
## Error Handling
- Missing CLI arg → `console.error` + `process.exit(1)` (`scripts/update-spec.mjs:26-29`)
- Missing transcript file → `console.error` + `process.exit(1)` (`scripts/update-spec.mjs:30-33`)
- Missing `README.md` (script run from wrong directory) → `console.error` + `process.exit(1)` (`scripts/update-spec.mjs:36-39`)
- Missing `ANTHROPIC_API_KEY` → `console.error` + `process.exit(1)` (`scripts/update-spec.mjs:41-44`)
- Malformed Anthropic response (no `<updated_spec>` tag) → write raw response to `update-raw.md` for inspection, then exit 1 (`scripts/update-spec.mjs:136-140`)
- Unknown route in browser → Docsify shows the built-in 404 page (`notFoundPage: true` in `index.html:52`)
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
