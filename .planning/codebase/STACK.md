# Technology Stack

**Analysis Date:** 2026-04-26

## Languages

**Primary:**
- JavaScript (ES Modules) — Used in `scripts/update-spec.mjs` for tooling
- HTML5 — Used in `index.html` as the Docsify viewer entry point
- Markdown — Used for the actual specification content (`README.md`, `project-spec/2026-04-26.md`)

**Secondary:**
- CSS (inline `<style>` block in `index.html`) — Theming overrides for Docsify

## Runtime

**Environment:**
- Node.js >=20 (declared in `package.json` `engines` field)
- Browser (any modern evergreen browser) for the rendered Docsify site

**Package Manager:**
- npm (lockfile version 3 — `package-lock.json` present)
- Lockfile: present (`package-lock.json`)

## Frameworks

**Core (Site rendering — loaded from CDN, not npm):**
- Docsify v4 — Client-side markdown documentation site generator. Loaded via `https://cdn.jsdelivr.net/npm/docsify@4` in `index.html`
- Docsify Vue theme — `https://cdn.jsdelivr.net/npm/docsify@4/lib/themes/vue.css`

**Docsify Plugins (CDN):**
- `docsify@4/lib/plugins/search.min.js` — Full-text search (Ctrl+K)
- `docsify-pagination` — Previous/Next navigation
- `docsify-copy-code@2` — Copy-to-clipboard buttons on code blocks
- `prismjs@1` (bash + json components) — Syntax highlighting

**Testing:**
- Not detected (no test framework, no test files, no test scripts in `package.json`)

**Build/Dev:**
- `docsify-cli@4` — Local dev server, invoked via `npx docsify-cli@4 serve .` (the `npm run dev` script). Not declared as a dependency — pulled on demand.

## Key Dependencies

**Critical (from `package.json`):**
- `@anthropic-ai/sdk` ^0.90.0 — Anthropic Claude API client used by `scripts/update-spec.mjs` to fold meeting transcripts into the spec
- `dotenv` ^16.4.5 — Loads `ANTHROPIC_API_KEY` from `.env` for the update script

**Transitive (visible in `package-lock.json` and `node_modules/`):**
- `json-schema-to-ts` ^3.1.1 — Pulled in by `@anthropic-ai/sdk`
- `@babel/runtime` ^7.29.2 — Transitive dependency of `json-schema-to-ts`
- `ts-algebra` ^2.0.0 — Transitive dependency of `json-schema-to-ts`

**Optional peer:**
- `zod` ^3.25.0 || ^4.0.0 — Optional peer dependency of `@anthropic-ai/sdk` (not installed)

**Infrastructure:**
- No database client, no web framework, no build pipeline — the site is purely static.

## Configuration

**Environment:**
- `ANTHROPIC_API_KEY` is required to run `scripts/update-spec.mjs`. Loaded via `import "dotenv/config"` from a `.env` file at the repo root.
- A `.env.example` is referenced by the script's error message (`"Copy .env.example to .env and fill it in."`) and by `CONTRIBUTING.md`. Neither `.env` nor `.env.example` is currently present at the repo root.
- No `.gitignore` file is present in the working tree.

**Build:**
- `netlify.toml` — Declares `publish = "."`, empty build command, and Cache-Control headers (300s max-age) for `/README.md` and `/index.html`.
- `package.json` — Declares `"type": "module"` so all `.js`/`.mjs` files are ESM by default.
- No `tsconfig.json`, no bundler config (Webpack/Vite/esbuild), no linter config (ESLint/Biome), no formatter config (Prettier).

**Docsify runtime config (in `index.html`):**
- `homepage: 'project-spec/2026-04-26.md'` — Current spec entry
- `loadSidebar: false` — Single-file mode, sidebar generated from headings
- `subMaxLevel: 1`, `maxLevel: 2` — Only h2 headings shown in sidebar
- `executeScript: false` — Inline JS in markdown is never executed (security)
- `search` plugin: 1-day cache, depth 4, `paths: 'auto'`
- Theme color: `#2c8d4f` (MacPlants green)

## Platform Requirements

**Development:**
- Node.js 20 or newer
- npm (for `npm install`, `npm run dev`)
- An Anthropic API key (only required for the `update-spec` workflow, not for local viewing)
- A browser (for viewing the rendered site at `http://localhost:3000` after `npm run dev`)

**Production:**
- Netlify (static hosting). Auto-deploys on push to `main` per `CONTRIBUTING.md`.
- Repository: `https://github.com/jds-gardening-developer/project-spec.git` (per `.git/config`).
- No server, no database, no build step — Netlify serves the repo root verbatim.

## Project Type Summary

This is a **static documentation site** (not an application). The "stack" is intentionally minimal:
- Docsify (CDN) renders markdown in the browser at request time.
- Netlify serves the static files.
- The only Node.js code is the optional `scripts/update-spec.mjs` tool for AI-assisted spec updates.

---

*Stack analysis: 2026-04-26*
