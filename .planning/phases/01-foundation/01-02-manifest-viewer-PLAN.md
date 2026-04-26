---
phase: 01-foundation
plan: 02
type: execute
wave: 2
depends_on:
  - 01-01
files_modified:
  - scripts/build-manifest.mjs
  - app/src/manifest.json
  - app/src/App.jsx
  - app/src/SpecViewer.jsx
  - package.json
autonomous: true
requirements:
  - VIEW-02
  - VIEW-03
  - REND-01
must_haves:
  truths:
    - "A build-time script scans project-spec/*.md, sorts by ISO date descending, and emits app/src/manifest.json"
    - "On first paint at http://localhost:5173/, the viewer auto-loads the markdown file with the most recent ISO date"
    - "The 70KB spec content renders without lag, with GFM tables, fenced code blocks, and strikethrough displayed correctly"
    - "Adding a hypothetical newer dated file (e.g. project-spec/2026-05-10.md) and re-running npm run dev causes the viewer to auto-switch to it"
    - "The manifest script is wired into npm run dev and npm run build via npm predev/prebuild hooks so it runs automatically"
  artifacts:
    - path: "scripts/build-manifest.mjs"
      provides: "Node ESM script that lists project-spec/*.md, validates ISO date filenames, sorts descending, writes manifest JSON"
      min_lines: 40
      contains: "project-spec"
    - path: "app/src/manifest.json"
      provides: "Build-time output: array of { date, filename } sorted newest-first"
      contains: "2026-04-26"
    - path: "app/src/SpecViewer.jsx"
      provides: "React component that takes markdown content as a prop and renders it via react-markdown + remark-gfm"
      contains: "react-markdown"
    - path: "app/src/App.jsx"
      provides: "Imports manifest.json, picks the newest entry, lazy-loads its content via Vite glob, renders SpecViewer"
      contains: "manifest"
    - path: "package.json"
      provides: "predev/prebuild npm hooks running build-manifest before Vite"
      contains: "predev"
  key_links:
    - from: "scripts/build-manifest.mjs"
      to: "app/src/manifest.json"
      via: "fs.writeFileSync after fs.readdirSync of project-spec/"
      pattern: "writeFileSync.*manifest\\.json"
    - from: "package.json#scripts.predev"
      to: "scripts/build-manifest.mjs"
      via: "npm predev hook runs the script before vite"
      pattern: "predev.*build-manifest"
    - from: "app/src/App.jsx"
      to: "app/src/manifest.json"
      via: "import manifest from './manifest.json'"
      pattern: "import.*manifest.*manifest\\.json"
    - from: "app/src/App.jsx"
      to: "../../project-spec/*.md"
      via: "import.meta.glob with ?raw query, lazy"
      pattern: "import\\.meta\\.glob"
    - from: "app/src/App.jsx"
      to: "app/src/SpecViewer.jsx"
      via: "<SpecViewer markdown={content} />"
      pattern: "<SpecViewer"
    - from: "app/src/SpecViewer.jsx"
      to: "remark-gfm"
      via: "remarkPlugins={[remarkGfm]}"
      pattern: "remarkGfm"
---

<convention_deviation>
**Quote style deviation acknowledged.**

`CONVENTIONS.md` / `CLAUDE.md` mandates double quotes for string literals. This rule was inferred from `scripts/update-spec.mjs` and applies to the **Node tooling layer** (ESM scripts, build tools).

**JSX/React frontend code in `app/`** uses **single quotes** per React community convention and Prettier defaults. This split is intentional:

- Node tooling (`scripts/build-manifest.mjs` in this plan, Task 1): double quotes — matches existing `scripts/update-spec.mjs` convention. Verified in the Task 1 file content (`import fs from "node:fs"` etc.).
- React/JSX (`app/src/SpecViewer.jsx`, `app/src/App.jsx` in this plan): single quotes — matches React/Vite ecosystem norms.

This split should be reflected in `CONVENTIONS.md` when it is updated for the React layer (deferred to Phase 4 or a project-level cleanup). For Phase 1, the deviation is intentional and not a defect.
</convention_deviation>

<objective>
Wire the foundation that every later phase builds on: a build-time manifest of dated markdown files, and a React viewer that renders the newest one with GitHub-flavored markdown support (tables, fenced code, strikethrough).

Purpose: Phase 1's killer outcome — open http://localhost:5173 and see the current spec rendered. No cross-links yet (Phase 2), no sidebar (Phase 3), no theming (Phase 4), no production build (Phase 5). Just: newest file auto-loads and reads cleanly.

Output: A `build-manifest.mjs` script wired into `predev`/`prebuild`, an `app/src/manifest.json` artifact, a `<SpecViewer>` component using react-markdown + remark-gfm, and an updated `<App>` that picks the newest entry from the manifest and renders its content.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/01-foundation/01-01-scaffold-PLAN.md
@.planning/phases/01-foundation/01-01-SUMMARY.md
@.planning/codebase/CONVENTIONS.md
@scripts/update-spec.mjs
@app/src/App.jsx
@app/src/main.jsx
@app/vite.config.js
@package.json

<interfaces>
<!-- Outputs from Plan 01 (already on disk) that this plan extends. -->

`app/vite.config.js` (from Plan 01):
- `root: __dirname` (= `app/`)
- `server.fs.allow: [path.resolve(__dirname, '..')]` — already extends to repo root, so `import.meta.glob('../../project-spec/*.md', { query: '?raw' })` from `app/src/App.jsx` IS allowed. No vite.config.js edits needed in this plan.

`app/src/App.jsx` (from Plan 01):
- Currently a placeholder with no imports. This plan REPLACES the body with manifest + viewer wiring.

`scripts/update-spec.mjs` conventions to mirror in `scripts/build-manifest.mjs`:
- ESM, `.mjs` extension, `"type": "module"` (already set in package.json)
- `import fs from "node:fs"`, `import path from "node:path"` — `node:` prefix mandatory
- Top-level `await` allowed; do NOT wrap in `async function main()`
- Double-quoted strings (Node tooling layer convention — see `<convention_deviation>` above)
- File header JSDoc-style block describing purpose/usage
- `console.log` for progress, `console.error` + `process.exit(1)` for failures
- Numbered "Next steps" hand-off block at the end

`project-spec/` directory contents (input to manifest script):
- Currently: `2026-04-26.md` (one file, ~70KB)
- Future: more `YYYY-MM-DD.md` files appended
- Filenames are STRICTLY `YYYY-MM-DD.md` per CONVENTIONS.md line 87. The manifest script must skip anything that doesn't match this pattern (log + skip, do not crash).

Vite glob import contract (used in Task 4):
```js
// Vite resolves this at build time; key = absolute import path, value = a function returning Promise<string>.
const specs = import.meta.glob('../../project-spec/*.md', { query: '?raw', import: 'default' });
// specs['../../project-spec/2026-04-26.md']() => Promise<string of file contents>
```

react-markdown 9.x API (the version pinned in Plan 01):
```jsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

<ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownString}</ReactMarkdown>
// react-markdown 9.x: children prop receives the markdown string; default sanitization is on (no rehype-raw, no dangerouslyAllowAll).
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Create scripts/build-manifest.mjs — scans project-spec/*.md, sorts by ISO date desc, emits app/src/manifest.json</name>
  <files>scripts/build-manifest.mjs</files>
  <read_first>
    - scripts/update-spec.mjs (mirror its file-header comment style, node: imports, top-level await, console.log/error patterns, numbered "Next steps" tail block — see CONVENTIONS.md lines 96-113)
    - .planning/codebase/CONVENTIONS.md (lines 86-113 — naming and code style)
    - project-spec/ (run `ls project-spec/` to confirm `2026-04-26.md` is the only current file)
  </read_first>
  <action>
Create `scripts/build-manifest.mjs` with EXACTLY the following content. This script:

1. Resolves `project-spec/` relative to the repo root (one level up from `scripts/`). Hardcoded — no CLI args.
2. `fs.readdirSync` the directory, filters to filenames matching `/^\d{4}-\d{2}-\d{2}\.md$/`. Non-matching files are logged and skipped (not fatal).
3. Validates that AT LEAST ONE matching file exists; exits 1 with a clear message if not.
4. Builds an array `[{ date, filename }]` sorted by `date` descending using `b.date.localeCompare(a.date)`.
5. Path-traversal hardening: assert `path.basename(entry) === entry` for every filename.
6. Writes the manifest to `app/src/manifest.json` (relative to repo root) as pretty-printed JSON with a trailing newline.
7. Logs progress in `Label   : value` shape, ends with a numbered "Next steps" block — matches scripts/update-spec.mjs style.

```js
#!/usr/bin/env node
/**
 * build-manifest.mjs — Build-time scan of dated spec snapshots.
 *
 * Reads project-spec/YYYY-MM-DD.md files, sorts by ISO date descending,
 * and writes app/src/manifest.json. Wired into `npm run dev` and `npm run build`
 * via the `predev` / `prebuild` hooks in package.json so it runs automatically.
 *
 * Usage:
 *   node scripts/build-manifest.mjs
 *
 * Output:
 *   app/src/manifest.json — [{ "date": "YYYY-MM-DD", "filename": "YYYY-MM-DD.md" }, ...]
 *   sorted newest-first.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ---------- paths ----------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const SPEC_DIR = path.resolve(REPO_ROOT, "project-spec");
const MANIFEST_PATH = path.resolve(REPO_ROOT, "app/src/manifest.json");

const ISO_DATE_RE = /^(\d{4}-\d{2}-\d{2})\.md$/;

// ---------- pre-flight ----------

if (!fs.existsSync(SPEC_DIR)) {
  console.error(`build-manifest: project-spec/ not found at ${SPEC_DIR}`);
  process.exit(1);
}

const stat = fs.statSync(SPEC_DIR);
if (!stat.isDirectory()) {
  console.error(`build-manifest: ${SPEC_DIR} is not a directory`);
  process.exit(1);
}

// ---------- scan ----------

const allEntries = fs.readdirSync(SPEC_DIR);

const matched = [];
const skipped = [];

for (const entry of allEntries) {
  if (path.basename(entry) !== entry) {
    skipped.push({ entry, reason: "filename contains path separators (refused)" });
    continue;
  }
  const m = entry.match(ISO_DATE_RE);
  if (!m) {
    skipped.push({ entry, reason: "filename does not match YYYY-MM-DD.md" });
    continue;
  }
  matched.push({ date: m[1], filename: entry });
}

if (matched.length === 0) {
  console.error("build-manifest: no YYYY-MM-DD.md files found in project-spec/");
  console.error(`Scanned ${allEntries.length} entries; ${skipped.length} skipped.`);
  for (const s of skipped) console.error(`  - ${s.entry}: ${s.reason}`);
  process.exit(1);
}

matched.sort((a, b) => b.date.localeCompare(a.date));

// ---------- write ----------

fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
fs.writeFileSync(MANIFEST_PATH, JSON.stringify(matched, null, 2) + "\n", "utf-8");

// ---------- report ----------

console.log(`build-manifest: scanned ${allEntries.length} entries`);
console.log(`build-manifest: matched  ${matched.length} dated files`);
console.log(`build-manifest: skipped  ${skipped.length} non-matching entries`);
console.log(`build-manifest: newest   ${matched[0].date}`);
console.log(`build-manifest: wrote    ${path.relative(REPO_ROOT, MANIFEST_PATH)}`);

if (skipped.length > 0) {
  console.log("");
  console.log("Skipped entries (non-fatal):");
  for (const s of skipped) console.log(`  - ${s.entry}: ${s.reason}`);
}

console.log("");
console.log("Next steps:");
console.log("  1) Vite (npm run dev) will import this manifest from app/src/manifest.json.");
console.log("  2) Add a new project-spec/YYYY-MM-DD.md and re-run npm run dev to refresh.");
```

After writing, make the file executable: `chmod +x scripts/build-manifest.mjs` (mirrors update-spec.mjs).
  </action>
  <verify>
    <automated>node scripts/build-manifest.mjs && test -f app/src/manifest.json && node -e "const m = require('./app/src/manifest.json'); if (!Array.isArray(m)) process.exit(1); if (m.length === 0) process.exit(1); if (m[0].date !== '2026-04-26') process.exit(2); if (m[0].filename !== '2026-04-26.md') process.exit(3); for (let i = 1; i < m.length; i++) { if (m[i-1].date < m[i].date) process.exit(4); }"</automated>
  </verify>
  <acceptance_criteria>
    - File `scripts/build-manifest.mjs` exists
    - First line is `#!/usr/bin/env node`
    - Contains `import fs from "node:fs"` (with `node:` prefix)
    - Contains `import path from "node:path"`
    - Contains the literal regex `/^(\d{4}-\d{2}-\d{2})\.md$/`
    - Contains `path.basename(entry) !== entry` (path-traversal check)
    - Contains `b.date.localeCompare(a.date)` (descending sort)
    - Contains `fs.writeFileSync` writing to a path ending in `manifest.json`
    - Running `node scripts/build-manifest.mjs` exits 0
    - After running, `app/src/manifest.json` exists and is valid JSON
    - manifest.json is an array
    - manifest.json[0].date equals `2026-04-26`
    - manifest.json[0].filename equals `2026-04-26.md`
    - manifest.json is sorted descending by `date` (verified by the loop in the verify command)
  </acceptance_criteria>
  <done>scripts/build-manifest.mjs exists, runs cleanly, and produces app/src/manifest.json with the current dated spec sorted newest-first.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Wire build-manifest into npm via predev/prebuild hooks</name>
  <files>package.json</files>
  <read_first>
    - package.json (current state after Plan 01 — confirm `dev`, `build`, `dev:docsify`, `update-spec` scripts are present)
  </read_first>
  <action>
Edit `package.json` to add `predev` and `prebuild` npm script hooks that run the manifest builder before Vite. Replace the entire `scripts` block with EXACTLY:

```json
  "scripts": {
    "predev": "node scripts/build-manifest.mjs",
    "dev": "vite",
    "prebuild": "node scripts/build-manifest.mjs",
    "build": "vite build",
    "preview": "vite preview",
    "dev:docsify": "npx docsify-cli@4 serve .",
    "build-manifest": "node scripts/build-manifest.mjs",
    "update-spec": "node scripts/update-spec.mjs"
  },
```

Notes:
- `predev` runs automatically before `dev` (npm convention).
- `prebuild` runs automatically before `build` (npm convention).
- `build-manifest` is a manually-runnable alias.
- All other scripts (`dev`, `build`, `preview`, `dev:docsify`, `update-spec`) preserved unchanged.

Do NOT modify any other field in package.json (deps, devDeps, engines, name, etc.). Do NOT run `npm install` again — no new packages.
  </action>
  <verify>
    <automated>node -e "const p = require('./package.json'); if (p.scripts.predev !== 'node scripts/build-manifest.mjs') process.exit(1); if (p.scripts.prebuild !== 'node scripts/build-manifest.mjs') process.exit(2); if (p.scripts['build-manifest'] !== 'node scripts/build-manifest.mjs') process.exit(3); if (p.scripts.dev !== 'vite') process.exit(4); if (p.scripts['dev:docsify'] !== 'npx docsify-cli@4 serve .') process.exit(5); if (!p.dependencies.react) process.exit(6);"</automated>
  </verify>
  <acceptance_criteria>
    - `package.json` `scripts.predev` equals exactly `node scripts/build-manifest.mjs`
    - `package.json` `scripts.prebuild` equals exactly `node scripts/build-manifest.mjs`
    - `package.json` `scripts["build-manifest"]` equals exactly `node scripts/build-manifest.mjs`
    - `package.json` `scripts.dev` is preserved as `vite`
    - `package.json` `scripts["dev:docsify"]` is preserved as `npx docsify-cli@4 serve .`
    - `package.json` `scripts["update-spec"]` is preserved as `node scripts/update-spec.mjs`
    - `package.json` `dependencies.react` is unchanged (verifies no accidental dep edits)
    - No top-level keys removed (name, version, type, engines, dependencies, devDependencies all still present)
  </acceptance_criteria>
  <done>npm predev and prebuild hooks run scripts/build-manifest.mjs before Vite. Manual `npm run build-manifest` also available.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Create app/src/SpecViewer.jsx — react-markdown + remark-gfm renderer</name>
  <files>app/src/SpecViewer.jsx</files>
  <read_first>
    - app/src/App.jsx (current placeholder — confirm it's about to be replaced)
    - package.json (confirm react-markdown ^9.0.1 and remark-gfm ^4.0.0 are installed)
  </read_first>
  <action>
Create `app/src/SpecViewer.jsx` with EXACTLY:

```jsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * SpecViewer — renders a markdown string with GitHub-flavored markdown support.
 *
 * Phase 1 scope:
 *   - GFM tables, fenced code, strikethrough (REND-01)
 *   - Default react-markdown sanitization (no rehype-raw, no HTML passthrough)
 *
 * Out of scope here (later phases):
 *   - Cross-link rewriting (Phase 2 / REND-02)
 *   - Data-model card renderer (Phase 2 / REND-03)
 *   - Mermaid blocks (Phase 2 / REND-04)
 *   - Copy-code buttons (Phase 2 / REND-05)
 *   - Syntax highlighting
 *   - Theming (Phase 4)
 */
export default function SpecViewer({ markdown }) {
  if (typeof markdown !== 'string') {
    return <p>Loading…</p>;
  }
  if (markdown.length === 0) {
    return <p>(spec file is empty)</p>;
  }
  return (
    <article className="spec-viewer">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </article>
  );
}
```

Notes:
- DO NOT pass `rehypePlugins={[rehypeRaw]}` or any other HTML-passthrough plugin. react-markdown's default escapes raw HTML, which is the security posture this project requires.
- DO NOT add custom `components={{...}}` overrides — Phase 2 owns custom renderers, Phase 4 owns theming.
- The `className="spec-viewer"` is a hook for Phase 4 styling; it has no styles in Phase 1 and that is intentional.
- The two early-return guards exist because the markdown is loaded asynchronously by `<App>` — during the initial render the prop is `undefined` for one tick.
- Quote style: single quotes per the `<convention_deviation>` block at the top of this plan.
  </action>
  <verify>
    <automated>test -f app/src/SpecViewer.jsx && grep -q "import ReactMarkdown from 'react-markdown'" app/src/SpecViewer.jsx && grep -q "import remarkGfm from 'remark-gfm'" app/src/SpecViewer.jsx && grep -q "remarkPlugins={\[remarkGfm\]}" app/src/SpecViewer.jsx && grep -q "export default function SpecViewer" app/src/SpecViewer.jsx && ! grep -qE "rehype-raw|rehypeRaw|dangerouslyAllow" app/src/SpecViewer.jsx</automated>
  </verify>
  <acceptance_criteria>
    - File `app/src/SpecViewer.jsx` exists
    - Imports `ReactMarkdown` from `react-markdown`
    - Imports `remarkGfm` from `remark-gfm`
    - Passes `remarkPlugins={[remarkGfm]}` to `<ReactMarkdown>`
    - Exports a default function named `SpecViewer`
    - Accepts a `markdown` prop (destructured from props)
    - Does NOT import or reference `rehype-raw`, `rehypeRaw`, or any string matching `dangerouslyAllow` (security)
    - Does NOT pass a `components` prop to `<ReactMarkdown>` (Phase 2 owns custom renderers)
    - Renders an `<article>` with `className="spec-viewer"`
  </acceptance_criteria>
  <done>SpecViewer component renders a markdown string with GFM enabled, default sanitization on, no Phase-2/Phase-4 features baked in.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 4: Replace app/src/App.jsx — load manifest, lazy-import newest spec, render SpecViewer</name>
  <files>app/src/App.jsx</files>
  <read_first>
    - app/src/App.jsx (current placeholder — about to be replaced)
    - app/src/manifest.json (must exist from Task 1; sanity-check structure: array of { date, filename })
    - app/src/SpecViewer.jsx (Task 3)
    - app/vite.config.js (confirms server.fs.allow extends to repo root, so `../../project-spec/*.md` is reachable)
  </read_first>
  <action>
Replace `app/src/App.jsx` with EXACTLY:

```jsx
import { useEffect, useState } from 'react';
import SpecViewer from './SpecViewer.jsx';
import manifest from './manifest.json';

// Vite glob — resolved at build time. Keys are import paths relative to this file;
// values are functions returning Promise<string of file contents>.
// vite.config.js#server.fs.allow already permits ../../project-spec.
const specLoaders = import.meta.glob('../../project-spec/*.md', {
  query: '?raw',
  import: 'default',
});

function loaderKeyFor(filename) {
  return `../../project-spec/${filename}`;
}

export default function App() {
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);

  // Manifest is sorted newest-first by build-manifest.mjs.
  const newest = manifest[0];

  useEffect(() => {
    if (!newest) {
      setError('No dated spec files found in project-spec/.');
      return;
    }
    const key = loaderKeyFor(newest.filename);
    const loader = specLoaders[key];
    if (!loader) {
      setError(
        `Manifest entry ${newest.filename} has no matching file under project-spec/. ` +
          `Run \`npm run build-manifest\` and restart the dev server.`
      );
      return;
    }
    let cancelled = false;
    loader().then(
      (text) => {
        if (!cancelled) setContent(text);
      },
      (err) => {
        if (!cancelled) setError(`Failed to load ${newest.filename}: ${err.message}`);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [newest]);

  if (error) {
    return (
      <main>
        <h1>MacPlants ERP — Specification</h1>
        <p style={{ color: 'crimson' }}>Error: {error}</p>
      </main>
    );
  }

  return (
    <main>
      <header>
        <small>
          Viewing: <code>project-spec/{newest?.filename}</code>
        </small>
      </header>
      <SpecViewer markdown={content} />
    </main>
  );
}
```

Notes:
- `import manifest from './manifest.json'` — Vite supports JSON imports natively. Manifest is bundled at build time, so the Task 2 hooks keep it fresh.
- `import.meta.glob` is a Vite-specific feature (not standard ES). The `query: '?raw'` and `import: 'default'` options match Vite 5.x.
- Lazy loading (`eager: false`, default) means only the newest file's content is fetched at runtime — other dated files in the glob aren't bundled. This satisfies "70KB renders without lag."
- The `<small>` header showing the current filename is a Phase 1 affordance — Phase 4 replaces it with proper layout. It's included to make verification concrete.
- The `cancelled` flag is React-correct cleanup for the async effect.
- DO NOT add suspense, loading skeletons, or animations (theming = Phase 4).
- DO NOT memoize the loader lookup — it's called once per mount.
- Quote style: single quotes per the `<convention_deviation>` block at the top of this plan.
  </action>
  <verify>
    <automated>test -f app/src/App.jsx && grep -q "import manifest from './manifest.json'" app/src/App.jsx && grep -q "import.meta.glob" app/src/App.jsx && grep -q "../../project-spec/\*.md" app/src/App.jsx && grep -q "query: '?raw'" app/src/App.jsx && grep -q "<SpecViewer" app/src/App.jsx && grep -q "manifest\[0\]" app/src/App.jsx && grep -q "useEffect" app/src/App.jsx && grep -q "useState" app/src/App.jsx</automated>
  </verify>
  <acceptance_criteria>
    - File `app/src/App.jsx` exists
    - Imports `manifest` from `./manifest.json`
    - Imports `SpecViewer` from `./SpecViewer.jsx`
    - Contains `import.meta.glob('../../project-spec/*.md'`
    - Glob options include `query: '?raw'` and `import: 'default'`
    - Reads `manifest[0]` to pick newest entry
    - Uses `useState` and `useEffect` from `react`
    - Renders `<SpecViewer markdown={content} />`
    - Has cancellation guard (`cancelled` flag) in the async effect
    - Has an `<header>` element showing the current filename
    - Does NOT contain `rehypeRaw` or `rehype-raw` (security — same constraint as SpecViewer)
  </acceptance_criteria>
  <done>App.jsx imports the manifest, lazy-loads the newest spec via Vite's glob+raw query, and passes the markdown content to SpecViewer.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 5: Smoke-test — manifest builds, dev server serves rendered spec, GFM renders correctly</name>
  <files>(none modified — verification only)</files>
  <read_first>
    - app/src/App.jsx, app/src/SpecViewer.jsx, app/src/manifest.json, scripts/build-manifest.mjs, package.json (sanity check all four prior tasks landed)
    - project-spec/2026-04-26.md (run `head -30` to confirm it has GFM tables — used in the GFM render check below)
  </read_first>
  <action>
Verify the full Phase 1 outcome end-to-end. Run the following sequence:

1. **Manifest freshness:** Delete `app/src/manifest.json` if it exists, then run `npm run dev` in the background. The `predev` hook MUST regenerate it before Vite starts.
   ```
   rm -f app/src/manifest.json
   npm run dev > /tmp/vite-dev.log 2>&1 &
   echo $! > /tmp/vite-dev.pid
   ```

2. **Wait for ready:** Poll the log for `Local:` (up to 15s — the predev step adds a beat).
   ```
   for i in {1..30}; do
     if grep -q "Local:" /tmp/vite-dev.log; then break; fi
     sleep 0.5
   done
   ```

3. **Manifest exists and is correct:**
   ```
   test -f app/src/manifest.json
   node -e "const m=require('./app/src/manifest.json'); if (m[0].date !== '2026-04-26') process.exit(1)"
   ```

4. **Dev server serves the HTML shell:**
   ```
   curl -sf http://localhost:5173/ -o /tmp/index.html
   grep -q '<div id="root">' /tmp/index.html
   ```

5. **Vite serves the manifest as a JSON module** (proves App.jsx's import will work):
   ```
   curl -sf http://localhost:5173/src/manifest.json -o /tmp/manifest.json
   grep -q "2026-04-26" /tmp/manifest.json
   ```

6. **Vite's `server.fs.allow` is configured to permit reading from `project-spec/`** (verified by HTTP 200 on `@fs` URL):
   ```
   curl -sf "http://localhost:5173/@fs$(pwd)/project-spec/2026-04-26.md?raw" -o /tmp/spec-raw.txt
   test $(wc -c < /tmp/spec-raw.txt) -gt 50000
   ```
   Expected: file is 60-80KB (the spec is ~70KB; Vite wraps it in an ES module export which adds a bit). The `>50000` floor is conservative.

   What this curl test proves: Vite's `server.fs.allow` in `app/vite.config.js` correctly permits reading from `../project-spec/`, so a request to `/@fs<absolute path>/project-spec/...?raw` returns HTTP 200 with file contents. This is a smoke check of the FS allow-list — nothing more.

   What this curl test does NOT prove: that `import.meta.glob('../../project-spec/*.md', { query: '?raw' })` resolves correctly inside the React app at runtime, or that `App.jsx`'s `specLoaders[key]()` returns the expected string. That requires browser-side execution (Vite's glob plugin runs at module-load time in the client), and is captured in the manual checkpoint after the dev server boots — see step 8 below and the SUMMARY's manual-verification note.

7. **No errors in dev log:**
   ```
   ! grep -iE "error|failed|cannot find module" /tmp/vite-dev.log
   ```

8. **Cleanup:**
   ```
   kill $(cat /tmp/vite-dev.pid) 2>/dev/null
   wait $(cat /tmp/vite-dev.pid) 2>/dev/null
   ```

If any step fails: read /tmp/vite-dev.log, identify the cause, fix the underlying file, re-run. Do NOT mark the task done until every step passes.

Note on rendered-output verification: this Bash-only smoke test cannot fully assert that GFM tables visually render in the browser, nor that `import.meta.glob` resolves at runtime — both require a headless browser. The combination of (a) react-markdown loading without errors, (b) remark-gfm being in the bundle, (c) the spec markdown being reachable via Vite's `@fs` route (i.e. `server.fs.allow` is correct), gives high confidence. Visual verification of GFM rendering AND the `import.meta.glob` resolution is appropriate to confirm via a quick manual browser check by the user — but is NOT a checkpoint:human-verify task here; the user can do it after `npm run dev` finishes.
  </action>
  <verify>
    <automated>rm -f app/src/manifest.json; npm run dev > /tmp/vite-dev.log 2>&1 & PID=$!; for i in $(seq 1 30); do if grep -q "Local:" /tmp/vite-dev.log; then break; fi; sleep 0.5; done; sleep 1; test -f app/src/manifest.json && node -e "const m=require('./app/src/manifest.json'); if (m[0].date !== '2026-04-26') process.exit(1)" && curl -sf http://localhost:5173/ -o /tmp/index.html && grep -q '<div id="root">' /tmp/index.html && curl -sf http://localhost:5173/src/manifest.json -o /tmp/manifest.json && grep -q "2026-04-26" /tmp/manifest.json && curl -sf "http://localhost:5173/@fs$(pwd)/project-spec/2026-04-26.md?raw" -o /tmp/spec-raw.txt && [ "$(wc -c < /tmp/spec-raw.txt)" -gt 50000 ] && ! grep -iE "error|failed|cannot find module" /tmp/vite-dev.log; RESULT=$?; kill $PID 2>/dev/null; wait $PID 2>/dev/null; exit $RESULT</automated>
  </verify>
  <acceptance_criteria>
    - Deleting app/src/manifest.json and running `npm run dev` regenerates it via the predev hook
    - app/src/manifest.json[0].date equals `2026-04-26`
    - `curl http://localhost:5173/` returns HTTP 200 with `<div id="root">` in the body
    - `curl http://localhost:5173/src/manifest.json` returns HTTP 200 with `2026-04-26` in the body
    - `curl http://localhost:5173/@fs<repo>/project-spec/2026-04-26.md?raw` returns HTTP 200 with body >50KB — proves Vite's `server.fs.allow` is configured to permit reading from `project-spec/` (NOT a proof that `import.meta.glob` resolves at runtime; that is a browser-side concern verified manually)
    - The dev log contains no lines matching `error`, `failed`, or `cannot find module` (case-insensitive)
    - The dev server is cleanly killed at the end of the test
  </acceptance_criteria>
  <done>End-to-end smoke test passes: manifest auto-regenerates, dev server boots, the HTML shell + manifest JSON serve correctly, and Vite's `server.fs.allow` permits reading the spec markdown via `@fs`. Browser-side `import.meta.glob` resolution is a manual checkpoint after the dev server starts.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| project-spec/ filesystem → manifest script | The script reads filenames from project-spec/ and writes JSON containing those names. A maliciously-named file (e.g. with path separators) could attempt to break out of the directory if not validated. |
| Manifest JSON → React app | Manifest is a build artifact; the app trusts it. If the manifest were ever generated from untrusted input (it isn't), this would be a tampering surface. |
| Markdown content → DOM (via react-markdown) | The spec markdown contains `(see PRD-X.Y)` cross-refs and standard GFM. react-markdown sanitizes by default; raw HTML in markdown is escaped. |
| Vite dev server FS allow-list → public access | `server.fs.allow` was opened to repo root in Plan 01 to permit `../../project-spec/*.md`. Dev-only — never deployed. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-01 | Tampering | scripts/build-manifest.mjs filename handling | mitigate | Task 1's script validates `path.basename(entry) === entry` for every file in project-spec/, refusing any name with path separators. Filenames are also matched against `^\d{4}-\d{2}-\d{2}\.md$` — anything not matching is logged and skipped. The script never reads file contents (it only lists names), so even a "malicious" markdown file cannot affect manifest output. |
| T-02-02 | Information Disclosure | react-markdown rendering | mitigate | Task 3's SpecViewer uses ONLY `remark-gfm` and explicitly does NOT enable `rehype-raw`, `rehype-sanitize` overrides, or `dangerouslyAllowAll`. react-markdown 9.x default behavior escapes raw HTML in markdown, preventing XSS via `<script>` tags or event handlers in the spec content. Acceptance criteria explicitly forbid `rehype-raw`. |
| T-02-03 | Tampering | npm dependency supply chain (react-markdown, remark-gfm) | mitigate | Already pinned to caret-major in Plan 01's package.json (`react-markdown ^9.0.1`, `remark-gfm ^4.0.0`); package-lock.json reproducibility from Plan 01. No new deps in this plan. |
| T-02-04 | Information Disclosure | Vite dev server serving project-spec/ via FS | accept | Dev-only. The spec is already public (it's in a public GitHub repo + Netlify-served). No PII; no secrets. Production build (Phase 5) compiles markdown into dist/ static assets — no runtime FS access. |
| T-02-05 | Denial of Service | 70KB markdown in main bundle | mitigate | Lazy-load via `import.meta.glob` with default `eager: false`. Only the newest file is fetched at runtime; older snapshots, even if they exist, are not bundled into the initial JS payload. Bundle stays small even as project-spec/ grows. |
| T-02-06 | Tampering | npm `predev` / `prebuild` hooks running arbitrary node scripts | accept | The `node scripts/build-manifest.mjs` command in package.json runs only the in-repo script. A compromised repo would have many worse problems than this hook. The script itself is short, in-repo, and reviewable. |

**Severity:** All threats LOW for a static viewer of public spec content. Highest-risk surface (markdown XSS) is explicitly mitigated by react-markdown's default sanitization plus our refusal to enable `rehype-raw`.
</threat_model>

<verification>
Phase 1 success criteria mapped to verification:

| Criterion | How verified |
|-----------|--------------|
| 1. `npm run dev` starts Vite with HMR | Plan 01 Task 7 + Plan 02 Task 5 (smoke tests both confirm `Local:` URL printed; HMR is implicit in Vite) |
| 2. Manifest scans project-spec/*.md, sorts by date, app imports as JSON | Plan 02 Task 1 (script + JSON output) + Task 4 (App.jsx imports manifest.json) + Task 5 (curl serves manifest at /src/manifest.json) |
| 3. First paint auto-loads newest ISO date file | Plan 02 Task 4 (`manifest[0]` + glob lazy-load) + Task 5 (Vite's `server.fs.allow` permits the `@fs` URL; full `import.meta.glob` resolution verified manually in the browser) |
| 4. 70KB content renders without lag, GFM tables/code/strike correct | Plan 02 Task 3 (SpecViewer with remarkGfm) + Task 5 (markdown content >50KB reachable via `@fs`), with a manual browser check by the user post-execution |
| 5. Adding a newer file and restarting dev causes auto-switch | Plan 02 Task 2 (`predev` hook regenerates manifest) + Task 1 (script sorts descending) — semantically guaranteed; full demonstration is in the SUMMARY's manual verification step |
</verification>

<success_criteria>
- `scripts/build-manifest.mjs` exists, runs cleanly, produces valid `app/src/manifest.json`
- `app/src/manifest.json` is sorted newest-first; first entry is `{ "date": "2026-04-26", "filename": "2026-04-26.md" }`
- `package.json` `predev` and `prebuild` hooks run the manifest script before Vite
- `app/src/SpecViewer.jsx` renders markdown with `remark-gfm`, no `rehype-raw`
- `app/src/App.jsx` imports manifest, lazy-loads newest file via `import.meta.glob`, renders `<SpecViewer>`
- `npm run dev` boots, the manifest auto-regenerates, the dev server serves the HTML shell + manifest JSON, and Vite's `server.fs.allow` permits HTTP 200 on the `@fs` URL for `project-spec/2026-04-26.md`
- No errors in the Vite dev log
- Root `index.html` (legacy Docsify entry) UNCHANGED — verify with `git diff index.html` showing no edits in this plan's commits
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation/01-02-SUMMARY.md` documenting:
- Manifest contents at completion (paste the JSON)
- Confirmation that `npm run dev` boots cleanly with the predev hook
- Confirmation that `curl http://localhost:5173/src/manifest.json` returns the expected JSON
- A quick manual-verification note for the user: "Open http://localhost:5173 in a browser. You should see the spec rendered with PRD section headings, the Data Model tables (3-column), and any fenced code blocks. This visual check is what proves `import.meta.glob` resolved correctly at runtime — the curl smoke test only proved Vite's `server.fs.allow` was configured. If anything looks broken, file a gap for Phase 1 closure before moving to Phase 2."
- A note on the new-dated-file flow: "To verify success criterion 5, copy `cp project-spec/2026-04-26.md project-spec/2026-05-10.md`, restart `npm run dev`, refresh the browser — header should show `Viewing: project-spec/2026-05-10.md`. Delete the dummy file when done."
- Any unexpected discoveries (peer dep warnings, Vite version quirks, react-markdown 9 vs 8 differences) for Phase 2 to consider.
</output>
