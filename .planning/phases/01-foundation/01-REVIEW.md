---
phase: 01-foundation
reviewed: 2026-04-26T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - .gitignore
  - app/index.html
  - app/src/App.jsx
  - app/src/SpecViewer.jsx
  - app/src/main.jsx
  - app/src/styles.css
  - app/vite.config.js
  - package.json
  - scripts/build-manifest.mjs
findings:
  critical: 0
  warning: 1
  info: 4
  total: 5
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-04-26
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Phase 01 lays down a clean Vite + React foundation: a tiny entry HTML, a `main.jsx` that fails loudly if the mount point is missing, an `App.jsx` that loads the newest snapshot from a build-time manifest with proper async cancellation, a deliberately minimal `SpecViewer` that defers cross-link / data-model / Mermaid work to later phases, and a `build-manifest.mjs` script with strict ISO-date validation, sorted output, and human-readable reporting that mirrors the existing `update-spec.mjs` style. `.gitignore` correctly covers the new build outputs and the manifest.

No bugs or security issues were found that affect correctness. The single Warning concerns Vite's dev-server filesystem scope being broader than strictly required. The Info items are small style/dependency-classification observations — none block merging.

The codebase respects every constraint called out in `CLAUDE.md`: ESM, `node:` prefix imports, double quotes in `.mjs`, top-level `await`/inline awaits, banner section comments, "Next steps" hand-off block, and the fail-fast pre-flight pattern.

## Warnings

### WR-01: Vite dev server filesystem scope is broader than necessary

**File:** `app/vite.config.js:18`
**Issue:** `server.fs.allow` is set to `path.resolve(__dirname, '..')`, which is the entire repo root. The comment correctly explains the goal (allow `../project-spec/*.md`), but the actual allow-list grants the dev server read access to *every* file under the repo, including `.env` (if a maintainer creates one per `CONTRIBUTING.md`), `transcripts/`, `scripts/`, and the legacy `index.html`. While `.env` is git-ignored and the dev server is local-only, Vite's `fs.allow` is the security boundary against `?raw` / `/@fs/` style requests during `npm run dev`. Narrowing the allow-list to just `project-spec/` (the only directory that actually needs to be glob-imported) reduces blast radius if a future plugin or middleware exposes `/@fs/` paths.

**Fix:**
```js
// app/vite.config.js
server: {
  port: 5173,
  fs: {
    // Only the spec directory needs to be importable from outside the Vite root.
    allow: [
      path.resolve(__dirname),                      // app/ itself
      path.resolve(__dirname, '..', 'project-spec') // ../project-spec
    ]
  }
}
```
Verify `import.meta.glob('../../project-spec/*.md', { query: '?raw' })` still resolves after the change (it should — the glob target is inside the narrowed allow-list).

## Info

### IN-01: `@anthropic-ai/sdk` and `dotenv` are listed as runtime dependencies but only used by the tooling script

**File:** `package.json:21-22`
**Issue:** `@anthropic-ai/sdk` (~hundreds of KB transitively) and `dotenv` are declared under `dependencies`, but they are imported only by `scripts/update-spec.mjs`, which never runs in the browser and is not part of the Vite build. With Phase 01 introducing a real bundle (Vite `npm run build`), keeping these in `dependencies` means they'll be installed on any consumer of the package and may be picked up by audit tooling as production deps. The Vite build itself won't bundle them (they're not imported from `app/src/`), so bundle size is unaffected — but the *classification* is misleading.

**Fix:** Move both to `devDependencies`:
```json
"devDependencies": {
  "@anthropic-ai/sdk": "^0.90.0",
  "dotenv": "^16.4.5",
  "@vitejs/plugin-react": "^4.3.0",
  "vite": "^5.4.0"
}
```
Skip this if there's a deployment scenario (e.g. Netlify build hook) that runs `update-spec.mjs` from a `dependencies`-only install — confirm before changing.

### IN-02: `useEffect` dependency `[newest]` is effectively constant

**File:** `app/src/App.jsx:50`
**Issue:** `newest` is derived from `manifest[0]`, where `manifest` is a static JSON import at module scope. The reference is stable for the lifetime of the module, so the effect will run exactly once on mount. The dependency array is technically correct (and React Hooks lint rules would require it), but a passing reader might wonder whether the effect re-runs on filename changes. A short comment removes the ambiguity.

**Fix:**
```jsx
// `newest` is stable for the lifetime of the module (manifest is a static import),
// so this effect runs exactly once on mount.
useEffect(() => {
  // ...existing body...
}, [newest]);
```

### IN-03: Optional chaining on `newest` in JSX is dead-defensive

**File:** `app/src/App.jsx:65`
**Issue:** `<code>project-spec/{newest?.filename}</code>` uses `?.` even though the early `if (error) return ...` path above already covers the `!newest` case (which sets `error` in the effect on first render). On the success path `newest` is guaranteed truthy, so `newest?.filename` is equivalent to `newest.filename`. Not wrong — just inconsistent with line 22 (`const newest = manifest[0];`) and line 29 (`newest.filename`) which assume non-null.

**Fix:** Drop the `?.` for consistency, or — if you want to be defensive against an empty manifest reaching render before the effect's `setError` runs — guard the whole `<header>` instead:
```jsx
<header>
  <small>
    Viewing: <code>project-spec/{newest.filename}</code>
  </small>
</header>
```
Note: on the very first render `error` is `null` and `content` is `null`, but `newest` is read synchronously from the imported manifest, so this is safe today.

### IN-04: `loaderKeyFor` is hardcoded to mirror the glob pattern in two places

**File:** `app/src/App.jsx:8-15`
**Issue:** The glob string `'../../project-spec/*.md'` and the `loaderKeyFor` template `` `../../project-spec/${filename}` `` are two independent literals that must stay in sync. If the path is ever changed (e.g. project-spec moves to `specs/` or the app moves to `app/v2/`), forgetting to update one of them produces a silent "Manifest entry … has no matching file" error rather than a build-time failure. Defining the prefix once makes the contract explicit.

**Fix:**
```jsx
const SPEC_GLOB_PREFIX = '../../project-spec';
const specLoaders = import.meta.glob(`${SPEC_GLOB_PREFIX}/*.md`, {
  query: '?raw',
  import: 'default',
});

function loaderKeyFor(filename) {
  return `${SPEC_GLOB_PREFIX}/${filename}`;
}
```
Note: Vite requires the glob argument to be statically analyzable. Template literals built from `const` string variables *are* supported in current Vite (5.x) — verify the dev server still finds the files after the change, and revert to two literals if Vite ever complains.

---

_Reviewed: 2026-04-26_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
