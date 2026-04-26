# Codebase Concerns

**Analysis Date:** 2026-04-26

## Tech Debt

**Spec source-of-truth duplication (CRITICAL):**
- Issue: The PRD spec content exists in TWO places. `README.md` (1,030 lines, 72KB) and `project-spec/2026-04-26.md` (960 lines, 70KB) both contain the same 14 PRD subsection blocks (PRD-0 through PRD-6, including PRD-1.1, PRD-2.0, PRD-2.1.1, PRD-2.1.2, PRD-03, PRD-3.1–3.4, PRD-04, PRD-05, two PRD-6 entries). README.md adds a meta-readme prefix (Overview, Project Organization, Quick Start, etc., lines 1–~80) on top of the same PRD body.
- Files: `README.md`, `project-spec/2026-04-26.md`
- Impact: Edits made to one file silently diverge from the other. The Docsify viewer reads `project-spec/2026-04-26.md` (per `index.html:51`), GitHub renders `README.md`. Stakeholders viewing the deployed site will see different content than developers reading the repo on GitHub.
- Fix approach: Decide canonical location. If `project-spec/<date>.md` is the new source of truth, strip PRD content out of `README.md` so it is purely a meta-readme. Then update `scripts/update-spec.mjs:35` and `scripts/update-spec.mjs:143` to read/write the dated spec instead.

**Update-spec script targets the wrong file:**
- Issue: `scripts/update-spec.mjs:35` hardcodes `SPEC_PATH = path.resolve("README.md")` and writes output to `README.proposed.md` (line 143). After the `web-app-refactor` branch's restructure, the live spec is `project-spec/2026-04-26.md`. Running the update script today would update stale content (the README PRD copy) and leave the actual deployed spec untouched.
- Files: `scripts/update-spec.mjs:35`, `scripts/update-spec.mjs:143`
- Impact: The entire meeting-fold-in workflow is broken on the current branch. Any meeting transcript processed via this script would silently update the wrong file.
- Fix approach: Parameterise SPEC_PATH (CLI arg or env var), or update it to match the new dated-snapshot model — likely accepting a target path as a second CLI arg and writing `<spec>.proposed.md` next to it.

**Documentation drift in CONTRIBUTING.md:**
- Issue: `CONTRIBUTING.md:3` states "The single source of truth is `README.md`. Every change is just an edit to that file." Lines 36–40 instruct contributors to "Edit `README.md` directly" and explain that the structure of `README.md` is canonical. This entire model has been replaced by dated snapshots in `project-spec/`, but CONTRIBUTING.md was not updated.
- Files: `CONTRIBUTING.md` (lines 3, 36–40, 44–88, 96–98)
- Impact: New contributors will edit the wrong file, run the broken update script, and produce changes that never reach the deployed site.
- Fix approach: Rewrite CONTRIBUTING.md to describe the new dated-snapshot workflow documented in the in-progress `README.md` "Versioning Specs" section.

**Missing `.env.example` referenced by docs and script:**
- Issue: `CONTRIBUTING.md:51` instructs `cp .env.example .env`. `scripts/update-spec.mjs:42` errors with `"Copy .env.example to .env and fill it in."` There is no `.env.example` file in the repository.
- Files: missing `.env.example`
- Impact: Onboarding friction — new maintainers cannot follow the documented setup. They have to read the script source to discover that `ANTHROPIC_API_KEY` is the only required variable.
- Fix approach: Add `.env.example` with a single line: `ANTHROPIC_API_KEY=your_key_here`.

**Committed `.DS_Store`:**
- Issue: `.DS_Store` is tracked in git (visible in `git ls-files`). It was added in commit `923396c`.
- Files: `.DS_Store`
- Impact: macOS-specific noise in commits; will conflict on every push from a different macOS user; may leak directory metadata.
- Fix approach: `git rm --cached .DS_Store` and add `.DS_Store` to `.gitignore`.

## Known Bugs

**Bug already noted under Tech Debt — `update-spec.mjs` operates on the wrong file:**
- See "Update-spec script targets the wrong file" above. Symptomatic on the `web-app-refactor` branch.

**Sidebar version reference is hard-coded in `index.html`:**
- Issue: `index.html:51` sets `homepage: 'project-spec/2026-04-26.md'`. Per the new versioning model documented in the in-progress `README.md`, every new dated snapshot requires a manual edit to `index.html`. This is a manual step that will be forgotten.
- Files: `index.html:51`
- Trigger: Adding a new dated spec without updating `index.html`.
- Workaround: None automated. Documented in `README.md` (uncommitted) under "Versioning Specs" but easy to miss.

## Security Considerations

**No `.gitignore` file at all (HIGH):**
- Risk: Any future `.env`, secret, credential file, or build artifact dropped into the repo can be staged and committed by accident. `git status` already shows `node_modules/` and `package-lock.json` untracked because they happen not to have been `git add`-ed yet — there is nothing structural preventing them from being committed next time someone runs `git add -A`.
- Files: missing `.gitignore`
- Current mitigation: None. Relies on contributor discipline.
- Recommendations: Add `.gitignore` immediately covering `.env`, `.env.*`, `node_modules/`, `.DS_Store`, `README.proposed.md`, `update-summary.md`, `update-raw.md`. The last three are intermediate outputs of `scripts/update-spec.mjs:138,143–144` and should never be committed.

**ANTHROPIC_API_KEY handling:**
- Risk: `scripts/update-spec.mjs:22` uses `dotenv` to load `process.env.ANTHROPIC_API_KEY`. The key is read by the Anthropic SDK constructor on line 108. There is no `.env` file currently present and no hardcoded key in the script — the sourcing pattern is correct. However, with no `.gitignore` (see above), a future `.env` file would be at risk of accidental commit.
- Files: `scripts/update-spec.mjs:41–44`, `scripts/update-spec.mjs:108`
- Current mitigation: Script exits if env var not set. Key is never logged.
- Recommendations: Add `.env` to a new `.gitignore` before any contributor creates one locally.

**Docsify CDN dependency without subresource integrity (MEDIUM):**
- Risk: `index.html` loads six third-party scripts and one stylesheet from `cdn.jsdelivr.net` with no `integrity=` SRI hash and using floating major-version tags (`docsify@4`, `docsify-copy-code@2`, `prismjs@1`). A jsDelivr or upstream npm compromise would inject arbitrary JS into the deployed spec site.
- Files: `index.html:11, 76, 79, 80, 81, 84, 85`
- Current mitigation: `executeScript: false` is set in the Docsify config (`index.html:53`), which prevents inline JS in the markdown from running — but that does NOT mitigate a compromised Docsify itself.
- Recommendations: Either pin exact versions and add SRI hashes, or self-host the assets. At minimum pin the patch version (`docsify@4.13.1`) so an upstream malicious release does not auto-deploy.

**No CSP / security headers in `netlify.toml`:**
- Risk: `netlify.toml` configures only `Cache-Control` for `/README.md` and `/index.html`. There is no `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, or `Strict-Transport-Security` header. Combined with the unhashed CDN scripts, the attack surface is wide.
- Files: `netlify.toml:9–18`
- Current mitigation: None.
- Recommendations: Add a `[[headers]]` block for `/*` setting at least `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and a CSP that whitelists `cdn.jsdelivr.net`.

**Cache-Control mismatch:**
- Risk: `netlify.toml:11` caches `/README.md` for 5 minutes. With the new dated-snapshot model, the file actually being served as the homepage is `/project-spec/2026-04-26.md`, which has no cache-control header at all and will fall back to Netlify defaults. The README cache rule is now dead config.
- Files: `netlify.toml:9–13`
- Current mitigation: None.
- Recommendations: Replace the `/README.md` rule with `/project-spec/*.md` (or whatever the canonical URL becomes).

## Performance Bottlenecks

**Single-shot Claude call with 70KB+ input on a synchronous script:**
- Problem: `scripts/update-spec.mjs:116` calls `client.messages.create()` once with the full spec (`~72,000` chars) plus a transcript inlined into the user message. There is no streaming, no retry, no timeout, and no progress indicator beyond `console.log("Calling Claude Opus 4.7…")` at line 112.
- Files: `scripts/update-spec.mjs:108–121`
- Cause: The script is intentionally simple, but as the spec grows the round-trip latency and failure cost grow with it.
- Improvement path: Switch to streaming (`client.messages.stream`) so the operator sees progress and can abort early. Add a try/catch around the create call so a network blip writes `update-raw.md` rather than crashing with no output.

**Large markdown files served without compression headers:**
- Problem: 70KB markdown payloads served without explicit `Content-Encoding: gzip` headers (relying on Netlify defaults).
- Files: `netlify.toml`
- Cause: Netlify gzips by default, but no explicit guarantee.
- Improvement path: Verify Netlify's gzip is active for `.md`; otherwise the spec page is heavier than it needs to be on first load.

## Fragile Areas

**`scripts/update-spec.mjs` response parsing (single regex, no fallback):**
- Files: `scripts/update-spec.mjs:127–140`
- Why fragile: The script extracts `<updated_spec>` and `<change_summary>` blocks via a single non-greedy regex. If Claude wraps its output in a code fence, includes a stray closing tag, or returns the spec without the wrapper tags, the script writes `update-raw.md` and exits. There is no recovery, no second attempt, no human-friendly diagnostic.
- Safe modification: Keep the regex but add a second pass that tries fenced extraction. Log the first/last 200 chars of the response on parse failure to aid debugging.
- Test coverage: Zero — there are no tests in the repo.

**`scripts/update-spec.mjs` SYSTEM_PROMPT is the entire workflow contract:**
- Files: `scripts/update-spec.mjs:50–95`
- Why fragile: The 8 numbered "RULES" in the system prompt encode the spec-maintenance policy. Drift between this prompt and `CONTRIBUTING.md` (which currently disagrees with reality) means the LLM will optimise for stale rules.
- Safe modification: Treat the system prompt as documentation. Update it whenever the dated-snapshot model changes anything about how sections are added.
- Test coverage: None.

**`netlify.toml` publishes the entire repo root:**
- Files: `netlify.toml:5–6`
- Why fragile: `publish = "."` means everything in the repo (including `.planning/`, `transcripts/`, `scripts/`, `CONTRIBUTING.md`) is publicly served at the deployed URL. A future committed transcript containing private meeting commentary would be live on the internet.
- Safe modification: Either move public assets into a `public/` (or `dist/`) directory and set `publish = "public"`, or add Netlify `_headers`/`_redirects` rules to 404 everything except `index.html`, `README.md`, `project-spec/*`, and the assets actually needed.
- Test coverage: None.

**`web-app-refactor` branch has uncommitted, untracked changes:**
- Files: `README.md` (modified, not committed), `index.html` (modified, not committed), `project-spec/` (untracked directory containing the new dated spec), `package-lock.json` (untracked)
- Why fragile: The entire restructure to the dated-snapshot model lives only in the working tree. A `git stash drop`, `git reset --hard`, or accidental branch switch loses it. Only two commits exist on the branch (`923396c Commit`, `86d587f first commit`), neither of which contain the new layout.
- Safe modification: Commit the in-progress refactor before doing anything else. Then fix the script/CONTRIBUTING.md drift in follow-up commits.

## Scaling Limits

**Spec file size vs Claude context window:**
- Current capacity: Spec is `~72KB` / `~1,030` lines. Combined with system prompt (`~3KB`) and a typical meeting transcript (variable, could be 50–200KB), the input to `client.messages.create` is well within the 1M-token context window of Claude Opus 4.7, but the OUTPUT cap is set explicitly to 32,000 tokens at `scripts/update-spec.mjs:118`.
- Limit: `max_tokens: 32000` will truncate the returned spec once the document grows past roughly 32k output tokens (~120KB of markdown). The spec is already at ~72KB and growing.
- Scaling path: Either raise `max_tokens` toward the model maximum, or restructure the workflow so the LLM returns a diff/patch rather than the full document.

**Single-version dated-spec model accumulates files:**
- Current capacity: One file per dated snapshot, each ~70KB.
- Limit: Linear growth — after 100 versions there are 100 × 70KB = 7MB of duplicated content with tiny diffs between versions. Git handles this fine but the `project-spec/` directory becomes hard to navigate.
- Scaling path: Either trust git history (one canonical `project-spec/current.md` plus tags for each release) or add an automated index page that lists snapshots.

## Dependencies at Risk

**`@anthropic-ai/sdk` ^0.90.0:**
- Risk: Pre-1.0 SDK with caret range. Minor bumps in 0.x typically allow breaking changes.
- Impact: A `npm install` on a fresh checkout could pull a breaking 0.91+ release that renames `messages.create` or changes the response shape, silently breaking `scripts/update-spec.mjs`.
- Migration plan: Pin to an exact version (`"0.90.0"`) until the SDK reaches 1.0. Re-test after each manual bump.

**Docsify and plugins via floating tags (`docsify@4`, `docsify-pagination`, `docsify-copy-code@2`):**
- Risk: See "Docsify CDN dependency" under Security. Same risk applies to availability: a deleted upstream package or a jsDelivr outage breaks the entire site.
- Impact: Site renders blank `<div id="app">Loading the spec…</div>` (per `index.html:40`) with no fallback.
- Migration plan: Self-host the Docsify bundle, or add a build step that downloads and pins it locally.

**`docsify-pagination` plugin loaded without explicit version:**
- Risk: `index.html:80` references `docsify-pagination/dist/...` with no version pin at all — fully floating.
- Impact: Most volatile of the three CDN scripts.
- Migration plan: Pin `docsify-pagination@2.x` minimum.

## Missing Critical Features

**No automated check that the live site matches the repo:**
- Problem: Nothing verifies that the file referenced by `index.html` (`project-spec/2026-04-26.md`) actually exists, or that PRD cross-references like "(see PRD-3.3)" point at real sections. CONTRIBUTING.md line 133 explicitly notes a "Cross-link checker" as a future idea.
- Blocks: Catching dead links and missing snapshots before they ship to production.

**No CI pipeline:**
- Problem: No GitHub Actions, Netlify build hooks beyond static publish, or pre-commit hooks. The lint/check/test surface is empty.
- Blocks: Catching the issues listed in this document automatically. Every concern here was found by manual inspection.

**No way to view historical spec versions on the deployed site:**
- Problem: `index.html` points only at one version. Stakeholders who want "what did the spec say last month?" must use git on GitHub.
- Blocks: The whole point of dated snapshots — easy historical comparison.

**No `_sidebar.md` for multi-document navigation:**
- Problem: `index.html:46` sets `loadSidebar: false` ("single-file mode"). Once multiple dated specs exist in `project-spec/`, there is no in-site way to switch between them.
- Blocks: The scaling path for the dated-snapshot model.

## Test Coverage Gaps

**Zero tests in the repository:**
- What's not tested: `scripts/update-spec.mjs` end-to-end (response parsing, file I/O, error paths), the Docsify config in `index.html`, the Netlify config, every PRD cross-reference in the spec.
- Files: entire repo
- Risk: Any change to `update-spec.mjs` silently breaks the meeting-fold-in workflow. The first sign of breakage is a maintainer's `mv README.proposed.md README.md` failing because the proposed file does not exist.
- Priority: Medium — the codebase is tiny (one script, one HTML file, one config) so the cost of adding a smoke test for `update-spec.mjs` is low.

**No spec-validation tests:**
- What's not tested: Whether all `(see PRD-X.Y)` references resolve to real sections; whether each PRD section has the required subheadings (Problem, Solution, Data Model); whether Data Model tables stick to the 3-column format mandated by `scripts/update-spec.mjs:75`.
- Files: `README.md`, `project-spec/2026-04-26.md`
- Risk: The spec drifts away from its own structural rules without anyone noticing until a developer building from it gets confused.
- Priority: Low — humans are still reviewing every change manually.

---

*Concerns audit: 2026-04-26*
