# Codebase Structure

**Analysis Date:** 2026-04-26

## Directory Layout

```
project-spec/                          # Repo root
├── index.html                         # Docsify entry point — config, theme, plugin loading
├── README.md                          # Repo landing page on GitHub; explains the project
├── CONTRIBUTING.md                    # Maintainer guide (run/edit/deploy/update workflow)
├── package.json                       # npm scripts (dev, update-spec) + deps for tooling
├── package-lock.json                  # npm lockfile
├── netlify.toml                       # Netlify deploy config (publish = ".", cache headers)
├── project-spec/                      # Dated spec snapshots (the actual content the site renders)
│   └── 2026-04-26.md                  # Current spec — pointed at by Docsify's `homepage`
├── scripts/
│   └── update-spec.mjs                # Node CLI: fold a transcript into the spec via Anthropic
├── transcripts/                       # Raw meeting transcripts (input for update-spec.mjs)
│   └── .gitkeep                       # Folder is empty otherwise
├── .planning/                         # GSD planning artifacts (not part of the deployed site)
│   └── codebase/                      # Codebase analysis docs (this file lives here)
└── node_modules/                      # Installed deps for tooling (not deployed)
```

## Directory Purposes

**Repo root:**
- Purpose: Serves as the Netlify publish directory; contains all site assets at the URL paths Docsify expects
- Contains: `index.html` (entry), `README.md` (GitHub landing + Docsify-readable), config files, the snapshots and scripts folders
- Key files: `index.html`, `README.md`, `netlify.toml`, `package.json`

**`project-spec/`:**
- Purpose: Holds dated snapshots of the specification — the actual content rendered by Docsify
- Contains: Markdown files named `YYYY-MM-DD.md`, one per significant revision
- Key files: `project-spec/2026-04-26.md` (current — referenced from `index.html:51`)

**`scripts/`:**
- Purpose: Maintainer tooling that runs locally (never in production)
- Contains: Node ESM scripts
- Key files: `scripts/update-spec.mjs`

**`transcripts/`:**
- Purpose: Drop zone for raw meeting transcripts that get folded into the spec
- Contains: Markdown transcripts named `YYYY-MM-DD-<slug>.md` (per `CONTRIBUTING.md`); currently only `.gitkeep`
- Key files: None yet

**`.planning/codebase/`:**
- Purpose: Stores GSD codebase mapping documents (architecture, conventions, etc.)
- Contains: Generated analysis markdown
- Key files: `ARCHITECTURE.md`, `STRUCTURE.md`

**`node_modules/`:**
- Purpose: Installed npm dependencies for the tooling layer
- Contains: `@anthropic-ai/sdk`, `dotenv`, plus their transitive deps (`@babel`, `json-schema-to-ts`, `ts-algebra`)
- Key files: None to edit by hand

## Key File Locations

**Entry Points:**
- `index.html`: Docsify single-page entry — declares `window.$docsify` config and loads CDN scripts
- `scripts/update-spec.mjs`: CLI entry for the spec-update workflow
- `package.json` scripts (`dev`, `update-spec`): Maintainer's run targets

**Configuration:**
- `index.html` (lines 43-72): Docsify config (`name`, `homepage`, `subMaxLevel`, `maxLevel`, `search`, `pagination`, `copyCode`, `executeScript: false`)
- `index.html` (lines 13-37): Inline CSS for theme overrides (MacPlants green `#2c8d4f`, sidebar/table tweaks)
- `netlify.toml`: Build (`publish = "."`, no `command`) and Cache-Control headers for `/README.md` and `/index.html`
- `package.json`: `type: "module"`, `engines.node: ">=20"`, scripts and dependencies
- `.env` (not committed; referenced by `scripts/update-spec.mjs:22` via `dotenv/config`): holds `ANTHROPIC_API_KEY`

**Core Logic:**
- `project-spec/2026-04-26.md`: The actual spec content — PRD-numbered sections, Data Model tables, Meeting Action Items
- `scripts/update-spec.mjs`: Reads spec + transcript, calls Anthropic with a strict system prompt (lines 50-95), writes `README.proposed.md` + `update-summary.md`
- `README.md`: GitHub landing page; describes the project organisation and quick-start

**Documentation:**
- `CONTRIBUTING.md`: How to read, run locally, edit, fold meetings in, and deploy
- `README.md`: Project overview and version status

**Testing:**
- None — this is a content repo with no test suite

## Naming Conventions

**Files:**
- Spec snapshots in `project-spec/`: `YYYY-MM-DD.md` (e.g. `2026-04-26.md`)
- Transcripts in `transcripts/`: `YYYY-MM-DD-<slug>.md` (e.g. `2026-04-25-erp-walkthrough.md` per `CONTRIBUTING.md:46`)
- Scripts: `kebab-case.mjs` ESM (e.g. `update-spec.mjs`)
- Top-level docs: `UPPERCASE.md` (`README.md`, `CONTRIBUTING.md`)
- Transient outputs from the update script: `README.proposed.md`, `update-summary.md` (both at repo root, gitignored or removed after promotion)

**Directories:**
- Lowercase, single word where possible: `scripts/`, `transcripts/`, `project-spec/`
- Note: the `project-spec/` subfolder shares its name with the repo root directory — both are intentional

**Spec section identifiers:**
- `PRD-N` for top-level requirement sections (e.g. `PRD-0`, `PRD-1`)
- `PRD-N.M` for subsections (e.g. `PRD-1.1`)
- These identifiers are stable — `scripts/update-spec.mjs` system prompt explicitly forbids renaming/reordering them (lines 60-64)

## Where to Add New Code

**New spec content (small edit):**
- Edit `project-spec/2026-04-26.md` (or whatever the current dated snapshot is — check `homepage` in `index.html:51`)
- Note: `README.md` per `CONTRIBUTING.md` is treated as the source of truth, but the live `index.html` currently points to `project-spec/2026-04-26.md` — keep these in sync or pick one model

**New spec version (significant revision):**
1. Copy current snapshot: `cp project-spec/2026-04-26.md project-spec/YYYY-MM-DD.md`
2. Edit the new dated file
3. Update `homepage: 'project-spec/YYYY-MM-DD.md'` in `index.html:51`

**New meeting transcript:**
- Drop into `transcripts/` as `YYYY-MM-DD-<slug>.md`
- Run `node scripts/update-spec.mjs transcripts/YYYY-MM-DD-<slug>.md`
- Review `README.proposed.md` + `update-summary.md`, then promote or discard

**New tooling script:**
- Add to `scripts/` as `<name>.mjs` (ESM, since `package.json` declares `"type": "module"`)
- Wire up an npm script in `package.json` if it should be runnable via `npm run <name>`

**New Docsify plugin or theme tweak:**
- Add `<script src="...">` for the plugin in `index.html` (after line 81, alongside the other plugin scripts)
- Add any config under `window.$docsify` (`index.html:43`)
- Inline CSS in the `<style>` block (`index.html:13-37`)

**New deploy header / redirect:**
- Add a `[[headers]]` or `[[redirects]]` block to `netlify.toml`

## Special Directories

**`node_modules/`:**
- Purpose: npm-installed dependencies for the tooling layer (`@anthropic-ai/sdk`, `dotenv`)
- Generated: Yes (by `npm install`)
- Committed: No (untracked per `git status`)

**`transcripts/`:**
- Purpose: Inputs to `scripts/update-spec.mjs`; preserved in git as historical record per `CONTRIBUTING.md:79` (`git add ... transcripts/`)
- Generated: No
- Committed: Yes (kept alive with `.gitkeep` while empty)

**`.planning/`:**
- Purpose: GSD workflow artifacts (codebase mapping docs, plans)
- Generated: Yes (by GSD commands)
- Committed: Project decision (currently untracked per `git status`)

**`.git/`:**
- Purpose: Git metadata
- Generated: Yes
- Committed: N/A

## Transient Files (created by tooling, not committed long-term)

- `README.proposed.md` — written by `scripts/update-spec.mjs:143`; promoted with `mv` or removed
- `update-summary.md` — written by `scripts/update-spec.mjs:144`; removed after review
- `update-raw.md` — written by `scripts/update-spec.mjs:138` only when the LLM response can't be parsed

---

*Structure analysis: 2026-04-26*
