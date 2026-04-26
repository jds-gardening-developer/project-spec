# Architecture

**Analysis Date:** 2026-04-26

## Pattern Overview

**Overall:** Static documentation site with a single-file Node tooling script (no build step, client-side rendered).

**Key Characteristics:**
- Zero build pipeline — `index.html` loads Docsify from a CDN and renders markdown at runtime in the browser
- Single-source-of-truth content model — one canonical markdown file (`README.md`) is the spec; dated snapshots in `project-spec/` provide the audit trail
- Detached tooling layer — `scripts/update-spec.mjs` is a one-shot Node CLI that calls the Anthropic API to fold meeting transcripts into the spec; it never runs in the browser and is not part of the deploy
- Deploy-as-serve — Netlify treats the repo root as the publish directory; there is no compiled artifact

## Layers

**Content Layer:**
- Purpose: Holds the human-readable specification and its versioned snapshots
- Location: `README.md`, `project-spec/`
- Contains: Long-form markdown documents (PRD-numbered sections, Data Model tables, action items)
- Depends on: Nothing — pure markdown
- Used by: The presentation layer (Docsify) at runtime; the tooling layer (`scripts/update-spec.mjs`) when folding in meeting outcomes

**Presentation Layer:**
- Purpose: Renders the spec in a browser as a navigable, searchable site
- Location: `index.html`
- Contains: Docsify configuration (`window.$docsify`), inline theme CSS, CDN `<script>` tags for Docsify core and plugins
- Depends on: jsdelivr CDN (`docsify@4`, `docsify-pagination`, `docsify-copy-code`, `prismjs@1`)
- Used by: End users hitting the deployed Netlify URL or running `npm run dev`

**Tooling Layer:**
- Purpose: Automates folding a meeting transcript into the spec via Claude
- Location: `scripts/update-spec.mjs`
- Contains: One Node ESM script that reads `README.md` + a transcript path, calls Anthropic, writes `README.proposed.md` and `update-summary.md` for human review
- Depends on: `@anthropic-ai/sdk`, `dotenv`, Node 20+, `ANTHROPIC_API_KEY` env var
- Used by: The spec maintainer manually via `node scripts/update-spec.mjs <transcript>`; never runs in production

**Hosting Layer:**
- Purpose: Serves the static repo root to the public internet
- Location: `netlify.toml`
- Contains: Netlify build config (`publish = "."`, empty `command`), Cache-Control headers for `/README.md` and `/index.html`
- Depends on: Netlify's static hosting + GitHub push trigger
- Used by: All deployed traffic

**Inputs Layer:**
- Purpose: Holds raw meeting transcripts that feed the tooling layer
- Location: `transcripts/` (currently only contains `.gitkeep`)
- Contains: Markdown transcripts, named by date (e.g. `2026-04-25-erp-walkthrough.md` per `CONTRIBUTING.md` convention)
- Depends on: Nothing
- Used by: `scripts/update-spec.mjs` as a CLI argument

## Data Flow

**Spec Read (end user):**

1. Browser requests the deployed Netlify URL
2. Netlify returns `index.html` from the repo root
3. The browser fetches Docsify and plugins from jsdelivr CDN
4. Docsify reads `window.$docsify.homepage` (currently `'project-spec/2026-04-26.md'`) and fetches that markdown file
5. Docsify renders the markdown into `<div id="app">`, builds the sidebar from headings (`maxLevel: 2`, only h2 / PRD-level entries), and wires up search, pagination, and copy-code plugins client-side
6. Subsequent in-page navigation is hash-routed (`#/path`) and handled entirely in the browser — no server round-trip

**Spec Update (maintainer):**

1. Maintainer drops a transcript into `transcripts/` (e.g. `transcripts/2026-04-25-erp-walkthrough.md`)
2. Maintainer runs `node scripts/update-spec.mjs transcripts/<file>.md`
3. Script reads `README.md` (resolved via `path.resolve("README.md")` — must be run from repo root) and the transcript file
4. Script POSTs both to Anthropic (`claude-opus-4-7`, `max_tokens: 32000`) wrapped in a strict system prompt that forbids structural changes
5. Script extracts `<updated_spec>` and `<change_summary>` tags from the response
6. Script writes `README.proposed.md` and `update-summary.md` to the repo root (does NOT touch `README.md`)
7. Maintainer diffs proposed vs. current, then either `mv README.proposed.md README.md` or discards
8. On `git push` to `main`, Netlify redeploys

**Versioned Snapshot:**

1. Maintainer copies the current spec to a new dated file in `project-spec/` (e.g. `cp project-spec/2026-04-26.md project-spec/2026-05-10.md`)
2. Maintainer edits the new file
3. Maintainer updates `homepage` in `index.html` to point at the new dated file
4. Old dated files remain in `project-spec/` as the audit trail

**State Management:**
- No application state — the site is read-only
- All "state" is git history (commits to `README.md` + dated files in `project-spec/`)
- Docsify caches search index for 24 hours client-side (`maxAge: 86400000`)

## Key Abstractions

**The Spec (single source of truth):**
- Purpose: Canonical product requirements document with stable PRD-numbered section identifiers
- Examples: `README.md`, `project-spec/2026-04-26.md`
- Pattern: Long markdown with hierarchical PRD-X.Y headings; Data Model tables in fixed 3-column format (Field | Type | Notes); only persisted fields listed (no derived/computed values)

**Dated Snapshot:**
- Purpose: Immutable point-in-time record of the spec
- Examples: `project-spec/2026-04-26.md`
- Pattern: Filename is `YYYY-MM-DD.md`; one snapshot per significant revision; pointed at by `homepage` in `index.html`

**Transcript Input:**
- Purpose: Raw meeting record that feeds the LLM update flow
- Examples: `transcripts/2026-04-25-erp-walkthrough.md` (per `CONTRIBUTING.md` convention; folder currently empty apart from `.gitkeep`)
- Pattern: Filename is `YYYY-MM-DD-<slug>.md`; passed as the sole CLI arg to `scripts/update-spec.mjs`

**Proposed Update (transient):**
- Purpose: LLM output staged for human review before promotion
- Examples: `README.proposed.md`, `update-summary.md` (both written to repo root by the script, neither committed long-term)
- Pattern: Promoted via `mv README.proposed.md README.md` or discarded with `rm`

**Docsify Config Object:**
- Purpose: All site-rendering behaviour (homepage, sidebar depth, search, pagination, copy-code) declared in one place
- Examples: `window.$docsify = { ... }` in `index.html` lines 43-72
- Pattern: Plain JS object literal; no separate config file

## Entry Points

**Browser (live site):**
- Location: `index.html`
- Triggers: HTTP GET on the Netlify-served root
- Responsibilities: Load Docsify + plugins from CDN, declare `window.$docsify` config, render `homepage` markdown into `#app`

**Local dev server:**
- Location: `package.json` script `dev` → `npx docsify-cli@4 serve .`
- Triggers: Maintainer runs `npm run dev`
- Responsibilities: Serves the repo root on `http://localhost:3000` with hot-reload on `README.md` saves

**Spec update CLI:**
- Location: `scripts/update-spec.mjs` (invoked via `npm run update-spec` → `node scripts/update-spec.mjs` or directly with a transcript arg)
- Triggers: Maintainer runs the script after a meeting
- Responsibilities: Validate args + env, read spec + transcript, call Anthropic, parse XML-tagged response, write `README.proposed.md` + `update-summary.md`

**Netlify deploy:**
- Location: `netlify.toml`
- Triggers: `git push` to `main` (configured in Netlify UI per `CONTRIBUTING.md`)
- Responsibilities: Publish the repo root as static files; apply Cache-Control headers to `/README.md` and `/index.html` (`max-age=300, must-revalidate`)

## Error Handling

**Strategy:** Fail fast in the tooling script with clear stderr messages and non-zero exit codes; the rendered site has no runtime error handling beyond Docsify's built-in `notFoundPage: true`.

**Patterns:**
- Missing CLI arg → `console.error` + `process.exit(1)` (`scripts/update-spec.mjs:26-29`)
- Missing transcript file → `console.error` + `process.exit(1)` (`scripts/update-spec.mjs:30-33`)
- Missing `README.md` (script run from wrong directory) → `console.error` + `process.exit(1)` (`scripts/update-spec.mjs:36-39`)
- Missing `ANTHROPIC_API_KEY` → `console.error` + `process.exit(1)` (`scripts/update-spec.mjs:41-44`)
- Malformed Anthropic response (no `<updated_spec>` tag) → write raw response to `update-raw.md` for inspection, then exit 1 (`scripts/update-spec.mjs:136-140`)
- Unknown route in browser → Docsify shows the built-in 404 page (`notFoundPage: true` in `index.html:52`)

## Cross-Cutting Concerns

**Logging:** `console.log` / `console.error` only, in `scripts/update-spec.mjs`. The script logs spec/transcript sizes, elapsed time, and token usage. The site has no logging.

**Validation:** Structural rules for the spec are enforced by the LLM system prompt in `scripts/update-spec.mjs:50-95` (don't rename PRD headings, keep Data Model tables 3-column, don't fix cosmetic issues, etc.) — there is no programmatic linter. The human is the final validator via `git diff`.

**Authentication:** None for the site (public read). The update script authenticates to Anthropic via `ANTHROPIC_API_KEY` loaded from `.env` by `dotenv/config` (`scripts/update-spec.mjs:22`).

**Caching:** Netlify Cache-Control headers (5 min `max-age` with `must-revalidate`) on `/README.md` and `/index.html` (`netlify.toml:9-18`). Docsify search index cached client-side for 24 h (`index.html:55`).

**Security:** `executeScript: false` in the Docsify config (`index.html:53`) prevents inline `<script>` blocks in markdown from executing — explicitly noted in the source as a safety measure.

---

*Architecture analysis: 2026-04-26*
