# Testing Patterns

**Analysis Date:** 2026-04-26

## Current State: No Tests

**There are no automated tests in this repository.** This finding is explicit and intentional in the project's current shape:

- `package.json` (`/Users/sigurdwatt/Development/MacPlants/project-spec/package.json`) declares no `test` script and no test-runner dependency. The only `scripts` entries are `update-spec` and `dev` (lines 10-13). The only dependencies are `@anthropic-ai/sdk` and `dotenv` (lines 14-17).
- No test framework is installed: no `jest`, `vitest`, `mocha`, `ava`, `tap`, `node:test`, `playwright`, `cypress`, or `puppeteer` in `package.json` or `node_modules/`.
- No `*.test.*`, `*.spec.*`, `__tests__/`, or `tests/` files exist anywhere in the tree.
- No test config files: no `jest.config.*`, `vitest.config.*`, `playwright.config.*`, `.mocharc.*`.
- No CI workflow files: no `.github/workflows/`, no `.gitlab-ci.yml`, no `circle.yml`. Netlify is the only automation, and `netlify.toml` (lines 5-6) declares an empty build command.
- No coverage tooling, no `c8`, no `nyc`, no `coverage/` directory, no `.nycrc`.
- `CONTRIBUTING.md` makes no mention of testing. The "Adding more interactivity later" section (lines 125-134) flags a future cross-link checker as idea #3 but it's aspirational: *"a CI script that fails the build if a `(see PRD-X.Y)` reference points at a section that doesn't exist."*

**Why this is reasonable for the project as it stands:**

The repo's runtime surface is genuinely small:

1. `scripts/update-spec.mjs` — a one-shot CLI that calls the Anthropic API and writes two files. It is human-reviewed every run (the whole point of writing `README.proposed.md` instead of overwriting `README.md`).
2. `index.html` — a static Docsify viewer with no build step.
3. `netlify.toml` / `package.json` — declarative configuration.
4. Markdown content under `README.md` and `project-spec/`.

There is no application code to unit-test. The "deployment" is `git push` followed by Netlify serving static files.

The rest of this document describes what testing **should** look like if and when the project gains enough surface to warrant it.

---

## Recommended Test Framework (When Needed)

If tests are introduced, prefer the **Node built-in test runner** (`node:test`) plus `node:assert/strict`. Rationale:

- The project is already ESM (`package.json:6` — `"type": "module"`) and pins `node >=20` (`package.json:8`). `node:test` is stable on Node 20 and requires zero new dependencies.
- The test surface (one CLI script, possibly a future link-checker) doesn't justify adding Jest/Vitest and their config burden.
- Built-in runner is invoked as `node --test` — easy to wire into a `test` script in `package.json` and into Netlify's build command or a GitHub Actions workflow.

Suggested addition to `package.json`:

```json
"scripts": {
  "test": "node --test"
}
```

If the project later grows a richer JS surface (e.g. a custom Docsify plugin per `CONTRIBUTING.md:131`, or the schema-explorer page in idea #2), revisit and consider Vitest for its watch/UI ergonomics.

---

## Test File Organization (When Introduced)

**Location:** Co-locate test files next to the script they cover.

```
scripts/
  update-spec.mjs
  update-spec.test.mjs        # tests for update-spec.mjs
  link-check.mjs              # hypothetical future script
  link-check.test.mjs
```

**Naming:** `<name>.test.mjs`. The built-in runner picks these up automatically with `node --test`.

**Why co-located:** Keeps the test next to the thing it tests, matches the small-script ethos of this repo, and avoids inventing a `tests/` directory mirror that would be larger than the code it mirrors.

---

## What to Test

The right tests for this project are **smoke tests, contract tests, and content checks** — not exhaustive unit coverage. In rough priority order:

### 1. Script smoke test — `scripts/update-spec.mjs`

The script has clear, side-effect-free helpers and clear failure modes. Worth testing:

- **`extract(tag, text)`** (`scripts/update-spec.mjs:127`) — pure function, easiest test:
  - Returns the trimmed contents between `<tag>...</tag>`.
  - Returns `null` when the tag is missing.
  - Handles multiline content (the regex uses `[\\s\\S]*?`, line 128).
  - Case-insensitive match (`"i"` flag, line 128).
  - To make this testable, refactor `extract` into a separate module — e.g. `scripts/lib/extract.mjs` — and import it from both the script and the test. Currently the function is defined inline and the script has top-level side effects (file reads, API call) that fire on import.

- **Pre-flight validation:**
  - Missing `transcriptPath` argv → exits 1 with the usage message (`scripts/update-spec.mjs:25-29`).
  - Non-existent transcript file → exits 1 with the not-found message (lines 30-33).
  - Missing `README.md` in CWD → exits 1 (lines 35-39).
  - Missing `ANTHROPIC_API_KEY` → exits 1 (lines 41-44).
  - Test by spawning the script with `node:child_process` and asserting on exit code and stderr text. Use a temp dir as CWD.

- **Output writing:**
  - Given a mock Anthropic response containing `<updated_spec>...</updated_spec>` and `<change_summary>...</change_summary>`, the script writes `README.proposed.md` and `update-summary.md` with the right content (lines 143-144).
  - Given a response with no `<updated_spec>`, the script writes `update-raw.md` and exits 1 (lines 136-140).
  - To enable this without hitting the real API, factor out the Anthropic call behind a tiny seam (e.g. a `callModel(prompt)` function imported from `scripts/lib/model.mjs`) and mock that module in the test.

### 2. Markdown link check — across `README.md` and `project-spec/*.md`

`CONTRIBUTING.md:133` already names this as a target: a CI script that fails when `(see PRD-X.Y)` cross-references point at non-existent sections. Implementation sketch:

- A new script, e.g. `scripts/check-links.mjs`, that:
  1. Reads every `*.md` under the repo root and `project-spec/`.
  2. Extracts every `## **PRD-...**` heading to build a set of valid IDs.
  3. Greps for `(see PRD-X[.Y])` patterns and asserts each one resolves.
  4. Exits 1 on any miss; prints `file:line` for each.
- A test for the script itself feeds it fixture markdown (good and bad) and asserts the exit code.

### 3. Markdown structural check

The script's system prompt (`scripts/update-spec.mjs:60-82`) lists invariants the spec should always satisfy. A small validator could enforce them:

- Every `## **PRD-N` heading also exists with the expected sub-headings (`### **What Is It**`, `### **What It Must Do**`, `### **How We Know It's Done**`).
- Every Data Model table is 3 columns (Field | Type | Notes).
- PRD numbers are unique within a file.

This catches drift between hand edits and the convention before it reaches the deployed site.

### 4. Build / serve check

A trivial CI step that runs `npm install` and then briefly starts `npm run dev` (Docsify serve) and curls `http://localhost:3000` to confirm a 200 response and that the homepage HTML mentions "MacPlants ERP". Catches index.html regressions and broken `homepage` paths in `index.html:51`.

### 5. Lockfile / dependency check

`npm ci --dry-run` (or `npm audit --omit=dev` at low severity) in CI. Catches lockfile drift and known vulnerabilities in `@anthropic-ai/sdk` / `dotenv`.

---

## Mocking

The only meaningful external dependency is the Anthropic API.

**Recommended pattern:** thin seam, dependency injection via module import.

Refactor `scripts/update-spec.mjs:108-121` so the actual `client.messages.create(...)` call lives in `scripts/lib/model.mjs`:

```js
// scripts/lib/model.mjs
import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic();
export async function callModel({ system, user, model = "claude-opus-4-7", maxTokens = 32000 }) {
  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  return {
    text: response.content.map((b) => (b.type === "text" ? b.text : "")).join(""),
    usage: response.usage,
  };
}
```

Then in tests, use `node:test`'s built-in `mock.module(...)` (Node 22+) or `import` an alternate path via env var. Avoid pulling in `sinon` / `nock` — over-engineered for one HTTP boundary.

**What NOT to mock:**
- `node:fs`, `node:path` — use a real temp directory (`node:fs.mkdtempSync(os.tmpdir() + "/spec-")`) and read/write real files. It's faster, simpler, and tests the real I/O behaviour.
- Process exit / argv — use `node:child_process.spawnSync` to invoke the script as a subprocess. Don't try to monkey-patch `process.exit` from inside the test process.

---

## Fixtures

When the script tests are added:

```
scripts/__fixtures__/
  README.sample.md           # a minimal spec with one PRD
  transcript.sample.md       # a minimal meeting transcript
  model-response.good.txt    # mock Anthropic response with <updated_spec> and <change_summary>
  model-response.bad.txt     # response missing <updated_spec> tag
```

Keep fixtures small and human-readable. Don't snapshot the live `README.md` (it's huge — 1031 lines — and changes often).

---

## Coverage

**Current:** None measured, none required.

**Target if tests are added:** No enforced threshold. The risk profile here is "did the script blow up?" not "did we cover every branch." Optimise for confidence per minute spent, not coverage percentage.

If a number is wanted, point `c8` at the test command:

```bash
npx c8 --reporter=text node --test
```

---

## CI

**Current:** None. Netlify deploys static files on push to `main` (`CONTRIBUTING.md:117`); there is no test step before deploy.

**Recommended minimal CI** when tests exist — a single GitHub Actions workflow at `.github/workflows/check.yml`:

1. `actions/setup-node@v4` with `node-version: 20`.
2. `npm ci`.
3. `npm test`.
4. (Optional) `node scripts/check-links.mjs` once that script exists.

Run on `push` and `pull_request`. Block merges to `main` on failure once the workflow is trusted.

---

## Test Types

**Unit:** The `extract()` helper in `scripts/update-spec.mjs:127` is the only genuinely unit-testable logic. Worth a half-dozen `node:test` cases.

**Integration:** Spawning the script as a subprocess with a mocked model module and a temp-dir CWD covers the end-to-end behaviour (argv parsing → file reads → model call → file writes → exit code) in one go. Prefer this over many small unit tests.

**End-to-end:** Not applicable. There is no user-facing application.

**Content tests:** The link-checker and structural validator described above are content-quality tests. They are arguably the highest-value tests this repo could add — they protect the spec, which is the actual product.

---

## Common Patterns (When Tests Exist)

**Async testing with `node:test`:**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { extract } from "./lib/extract.mjs";

test("extract returns trimmed inner text", () => {
  assert.equal(extract("foo", "<foo>  hi  </foo>"), "hi");
});

test("extract returns null when tag missing", () => {
  assert.equal(extract("foo", "no tag here"), null);
});
```

**Subprocess testing:**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("script exits 1 when transcript missing", () => {
  const result = spawnSync("node", ["scripts/update-spec.mjs"], { encoding: "utf-8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Usage:/);
});
```

---

## Summary

This repo correctly has no tests today — there is essentially no application code, and the one helper script is human-reviewed every run. If the project grows in any of the three directions hinted at in `CONTRIBUTING.md:125-134` (Mermaid diagrams, schema explorer plugin, cross-link checker), the appropriate testing investment is a small `node --test` setup co-located with the code it tests, plus a content-validation script for the spec itself. Avoid pulling in heavy frameworks until there's something heavy to test.

---

*Testing analysis: 2026-04-26*
