# External Integrations

**Analysis Date:** 2026-04-26

## APIs & External Services

**AI / LLM:**
- Anthropic Claude API — Used by `scripts/update-spec.mjs` to fuse meeting transcripts into the living spec
  - SDK/Client: `@anthropic-ai/sdk` ^0.90.0 (imported as `import Anthropic from "@anthropic-ai/sdk"`)
  - Model: `claude-opus-4-7` (hardcoded at `scripts/update-spec.mjs:117`)
  - Request shape: `client.messages.create({ model, max_tokens: 32000, system, messages })` at `scripts/update-spec.mjs:116-121`
  - Auth: `ANTHROPIC_API_KEY` environment variable (validated at `scripts/update-spec.mjs:41-44`; the SDK reads it implicitly via `new Anthropic()` at line 108)
  - Response parsing: extracts `<updated_spec>` and `<change_summary>` XML tags from the model response (`scripts/update-spec.mjs:127-134`)
  - Outputs: writes `README.proposed.md` and `update-summary.md` to repo root (`scripts/update-spec.mjs:143-144`)

**CDN-hosted libraries (loaded by `index.html`):**
- jsDelivr (`https://cdn.jsdelivr.net`) — Serves all client-side runtime assets:
  - `docsify@4` core
  - `docsify@4/lib/themes/vue.css`
  - `docsify@4/lib/plugins/search.min.js`
  - `docsify-pagination`
  - `docsify-copy-code@2`
  - `prismjs@1/components/prism-bash.min.js`
  - `prismjs@1/components/prism-json.min.js`

## Data Storage

**Databases:**
- None. This is a static site; all "data" is markdown in the repo.

**File Storage:**
- Local filesystem only (Git-tracked markdown files):
  - `README.md` — The canonical source of truth (~72KB)
  - `project-spec/2026-04-26.md` — Current dated spec snapshot (~70KB, served as Docsify homepage)
  - `transcripts/` — Drop folder for meeting transcripts (currently empty except `.gitkeep`)

**Caching:**
- HTTP caching only, configured in `netlify.toml`:
  - `/README.md`: `public, max-age=300, must-revalidate`
  - `/index.html`: `public, max-age=300, must-revalidate`
- Docsify search index: 1-day client-side cache (`maxAge: 86400000` in `index.html`)

## Authentication & Identity

**Auth Provider:**
- None. The published site is fully public; no login layer.
- The `update-spec.mjs` script authenticates to Anthropic via `ANTHROPIC_API_KEY` only.

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, Datadog, Rollbar, etc.).

**Logs:**
- `scripts/update-spec.mjs` uses `console.log` / `console.error` for CLI output (e.g. `scripts/update-spec.mjs:110-112`, `147-159`).
- Netlify provides deploy logs out of the box (no custom integration).

## CI/CD & Deployment

**Hosting:**
- Netlify — Configured via `netlify.toml`:
  - `publish = "."` (serves repo root)
  - `command = ""` (no build step)
  - Auto-deploys on push to `main` (per `CONTRIBUTING.md`)

**CI Pipeline:**
- None in-repo. No `.github/workflows/`, no `.gitlab-ci.yml`, no `.circleci/`. Netlify's auto-deploy is the only "pipeline."

**Source Control:**
- GitHub: `https://github.com/jds-gardening-developer/project-spec.git` (from `.git/config`)
- Branches observed: `main`, `web-app-refactor`

## Environment Configuration

**Required env vars:**
- `ANTHROPIC_API_KEY` — Required only when running `node scripts/update-spec.mjs`. Not needed for `npm run dev` or for the deployed site.

**Secrets location:**
- Loaded from a `.env` file at the repo root via `dotenv` (`import "dotenv/config"` at `scripts/update-spec.mjs:22`).
- `.env` is not currently present in the working tree; `CONTRIBUTING.md` instructs maintainers to `cp .env.example to .env` and paste in the key.
- No `.gitignore` is present in the working tree (a real risk if `.env` is later created — see CONCERNS).

## Webhooks & Callbacks

**Incoming:**
- None. There is no server.

**Outgoing:**
- None at runtime. The only outbound network call is from the local CLI tool (`scripts/update-spec.mjs`) to `api.anthropic.com` via the Anthropic SDK.

## Workflow Summary

The repo has exactly two integration touchpoints:

1. **At deploy time:** Netlify pulls from GitHub on push to `main` and serves the repo root as static files. Browsers then fetch Docsify assets from jsDelivr.

2. **During spec updates (manual, local-only):** A maintainer runs `node scripts/update-spec.mjs <transcript>`, which sends the current `README.md` plus the transcript to Anthropic Claude (`claude-opus-4-7`, max 32k output tokens) and writes proposed changes to `README.proposed.md` and `update-summary.md` for human review before any commit.

---

*Integration audit: 2026-04-26*
