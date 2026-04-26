---
phase: 01-foundation
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .gitignore
  - package.json
  - app/index.html
  - app/vite.config.js
  - app/src/main.jsx
  - app/src/App.jsx
  - app/src/styles.css
autonomous: true
requirements:
  - DEP-03
  - VIEW-01
must_haves:
  truths:
    - "Running `npm run dev` from the repo root starts a Vite dev server with HMR"
    - "The legacy Docsify dev workflow still works via `npm run dev:docsify`"
    - "The repo has a working `.gitignore` excluding node_modules, dist, .env, and the build-time manifest artifact"
    - "The Vite app is isolated under `app/` so the live root `index.html` (Docsify entry) is untouched"
  artifacts:
    - path: ".gitignore"
      provides: "Excludes node_modules, dist, .env, .DS_Store, transient script outputs, and the regenerated manifest.json"
      contains: "node_modules"
    - path: "package.json"
      provides: "Vite scripts and React/Vite/markdown deps"
      contains: "\"dev\": \"vite\""
    - path: "app/index.html"
      provides: "Vite HTML entry that mounts /src/main.jsx into #root"
      contains: "/src/main.jsx"
    - path: "app/vite.config.js"
      provides: "Vite config: React plugin, root=app/, fs.allow for ../project-spec, dev port"
      contains: "@vitejs/plugin-react"
    - path: "app/src/main.jsx"
      provides: "React entry — createRoot(document.getElementById('root'))"
      contains: "createRoot"
    - path: "app/src/App.jsx"
      provides: "Root React component (placeholder body for Plan 02 to flesh out)"
      contains: "export default function App"
    - path: "app/src/styles.css"
      provides: "Minimal base CSS (font, body reset). No theming — Phase 4 owns brand."
      min_lines: 5
  key_links:
    - from: "package.json#scripts.dev"
      to: "app/index.html"
      via: "Vite root = app/, runs `vite` (which auto-picks app/index.html)"
      pattern: "\"dev\": \"vite\""
    - from: "app/index.html"
      to: "app/src/main.jsx"
      via: "<script type=\"module\" src=\"/src/main.jsx\">"
      pattern: "src=\"/src/main.jsx\""
    - from: "app/src/main.jsx"
      to: "app/src/App.jsx"
      via: "import App from './App.jsx'"
      pattern: "import App from"
---

<task_count_rationale>
This plan contains 7 tasks rather than the standard 2-3 target. Documented rationale (acknowledged in plan-check WARNING):

7 atomic file-creation tasks were chosen over fewer larger tasks because each scaffold file (`.gitignore`, `package.json` edits, `app/index.html`, `app/vite.config.js`, `app/src/main.jsx` + `app/src/styles.css`, `app/src/App.jsx`, and the boot smoke-test) has a self-contained acceptance criterion and can be retried independently. Collapsing would couple unrelated failures — e.g. a typo in `vite.config.js` would force re-running the `package.json` edit and `npm install`, wasting time and risking lockfile churn.

Each task is very small (typically <40 lines of file content provided verbatim), so the per-task context cost is low. The total plan still fits comfortably under the ~50% context budget because most tasks are "write this exact file" with no exploration required.

Trade-off accepted: more git commits per phase, but cleaner rollback semantics. Future plans with similarly atomic file scaffolding may follow the same pattern; plans with more exploratory or interdependent work should stay at 2-3 tasks.
</task_count_rationale>

<convention_deviation>
**Quote style deviation acknowledged.**

`CONVENTIONS.md` / `CLAUDE.md` mandates double quotes for string literals. This rule was inferred from `scripts/update-spec.mjs` and applies to the **Node tooling layer** (ESM scripts, build tools).

**JSX/React frontend code in `app/`** uses **single quotes** per React community convention and Prettier defaults. This split is intentional:

- Node tooling (`scripts/build-manifest.mjs` in Plan 02): double quotes — matches existing `scripts/update-spec.mjs` convention.
- React/JSX (`app/src/*.jsx`, `app/vite.config.js`): single quotes — matches React/Vite ecosystem norms.

This split should be reflected in `CONVENTIONS.md` when it is updated for the React layer (deferred to Phase 4 or a project-level cleanup). For Phase 1, the deviation is intentional and not a defect.
</convention_deviation>

<objective>
Scaffold a Vite + React application under `app/` so the existing Docsify entry at the repo root (`index.html`) is left completely untouched. Wire `npm run dev` to start the new Vite dev server (with HMR), preserve the legacy Docsify workflow under a renamed `npm run dev:docsify` script, and add a `.gitignore` that prevents accidental commits of `node_modules/`, `dist/`, `.env`, and the regenerated `app/src/manifest.json` build artifact.

Purpose: Establish the buildable React shell that Plan 02 (and every later phase) extends. Phase 1 only needs a placeholder `<App>` that renders something — Plan 02 wires in the manifest and markdown rendering.

Output: A working `app/` Vite scaffold, an updated `package.json` with Vite/React/markdown deps installed, and a `.gitignore` covering common foot-guns.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/REQUIREMENTS.md
@.planning/codebase/STACK.md
@.planning/codebase/CONVENTIONS.md
@.planning/codebase/CONCERNS.md
@package.json
@index.html
@netlify.toml

<interfaces>
<!-- Existing package.json (DO NOT clobber the Anthropic SDK deps or update-spec script). -->

Current `package.json` (full contents, for reference — your edits MUST preserve every key below except where explicitly overridden):
```json
{
  "name": "macplants-erp-spec",
  "private": true,
  "version": "1.0.0",
  "description": "Living specification for the MacPlants ERP build, served via Docsify.",
  "type": "module",
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "update-spec": "node scripts/update-spec.mjs",
    "dev": "npx docsify-cli@4 serve ."
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.90.0",
    "dotenv": "^16.4.5"
  }
}
```

Existing `index.html` at repo root (DO NOT MODIFY — Phase 5 owns the cutover):
- Loads Docsify v4 from CDN, mounts on `<div id="app">`, points at `project-spec/2026-04-26.md` via `homepage`.
- Phase 1 must keep this file working untouched. The new Vite app lives in `app/index.html` to avoid filename collision.

Vite project structure target (this plan creates):
```
app/
  index.html          # Vite HTML entry (mounts /src/main.jsx into <div id="root">)
  vite.config.js      # root: '.', fs.allow: ['..'], plugin-react, port: 5173
  src/
    main.jsx          # React entry: createRoot, render <App />
    App.jsx           # Placeholder (Plan 02 fleshes out)
    styles.css        # Minimal base CSS
```

Why no `app/package.json`: this is a single-package repo. Root `package.json` carries all deps and scripts; Vite is configured to use `app/` as its root via `vite.config.js`.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create .gitignore at repo root</name>
  <files>.gitignore</files>
  <read_first>
    - .planning/codebase/CONCERNS.md (lines 50-79 — security recommendations on missing .gitignore, exact list of files to exclude)
    - /Users/sigurdwatt/Development/MacPlants/project-spec/ (run `ls -la` to confirm no .gitignore exists yet)
  </read_first>
  <action>
Create `.gitignore` at the repo root with EXACTLY the following contents (one entry per line, blank lines and section comments allowed for readability). Every entry below is mandatory — they correspond to concrete risks documented in `.planning/codebase/CONCERNS.md` lines 50-79.

```
# Dependencies
node_modules/

# Build output
dist/
app/src/manifest.json
app/dist/

# Vite caches
.vite/
app/.vite/

# Environment / secrets
.env
.env.local
.env.*.local

# OS junk
.DS_Store

# Transient outputs from scripts/update-spec.mjs
README.proposed.md
update-summary.md
update-raw.md
```

Note on `app/src/manifest.json`: this file is regenerated by `npm run predev` and `npm run prebuild` (wired up in Plan 02 Task 2) on every dev/build run. Tracking it would cause merge conflicts as new dated specs are added to `project-spec/` — every contributor's local manifest would drift. Treat it as a build artifact, not source.

Do NOT add `.env.example` to the gitignore — that file is meant to be tracked. Do NOT add `package-lock.json` — lockfiles must be committed.
  </action>
  <verify>
    <automated>test -f .gitignore && grep -q "^node_modules/$" .gitignore && grep -q "^dist/$" .gitignore && grep -q "^\.env$" .gitignore && grep -q "^\.DS_Store$" .gitignore && grep -q "^README.proposed.md$" .gitignore && grep -q "^app/src/manifest\.json$" .gitignore</automated>
  </verify>
  <acceptance_criteria>
    - `.gitignore` exists at repo root (`test -f .gitignore` exits 0)
    - Contains literal line `node_modules/`
    - Contains literal line `dist/`
    - Contains literal line `app/src/manifest.json`
    - Contains literal line `app/dist/`
    - Contains literal line `.env`
    - Contains literal line `.DS_Store`
    - Contains literal line `README.proposed.md`
    - Does NOT contain a line matching `package-lock.json`
    - Does NOT contain a line matching `\.env\.example`
  </acceptance_criteria>
  <done>The repo has a .gitignore covering node_modules, dist, .env, .DS_Store, the regenerated app/src/manifest.json build artifact, and the three transient outputs of scripts/update-spec.mjs.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Update package.json — add Vite/React deps, rename dev → dev:docsify, add Vite scripts</name>
  <files>package.json</files>
  <read_first>
    - package.json (current contents — do not assume; read fresh before editing)
    - .planning/codebase/STACK.md (lines 44-58 — note `@anthropic-ai/sdk` ^0.90.0 and `dotenv` ^16.4.5 must remain)
  </read_first>
  <action>
Replace the contents of `package.json` with EXACTLY the JSON below. This:

1. Renames the existing `"dev": "npx docsify-cli@4 serve ."` script to `"dev:docsify"` (preserves legacy workflow during the Phase 1-4 transition; Phase 5 will remove it).
2. Adds `"dev": "vite"` and `"build": "vite build"` and `"preview": "vite preview"`. Vite reads its root from `app/vite.config.js` (configured in Task 4).
3. Preserves `update-spec` script and the `@anthropic-ai/sdk` and `dotenv` dependencies untouched.
4. Adds production deps for the React markdown viewer: `react`, `react-dom`, `react-markdown`, `remark-gfm`.
5. Adds devDeps: `vite`, `@vitejs/plugin-react`.
6. Pins versions to caret-major (e.g. `"^5.4.0"`) per phase security note. Use the latest stable major as of 2026-04: react ^18.3.1, react-dom ^18.3.1, react-markdown ^9.0.1, remark-gfm ^4.0.0, vite ^5.4.0, @vitejs/plugin-react ^4.3.0. If a newer major is available at install time, prefer the major listed here for predictability — Phase 1 is a brownfield foundation, not the place to chase the bleeding edge.

Write EXACTLY this content:

```json
{
  "name": "macplants-erp-spec",
  "private": true,
  "version": "1.0.0",
  "description": "Living specification for the MacPlants ERP build, served via Vite + React (with Docsify legacy fallback during transition).",
  "type": "module",
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "dev:docsify": "npx docsify-cli@4 serve .",
    "update-spec": "node scripts/update-spec.mjs"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.90.0",
    "dotenv": "^16.4.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-markdown": "^9.0.1",
    "remark-gfm": "^4.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.4.0"
  }
}
```

After writing the file, run `npm install` from the repo root to generate `package-lock.json` and populate `node_modules/`. The install must complete with exit code 0.

Do NOT use `npm install <pkg>` to add packages — write the JSON file first as the source of truth, then run `npm install` once. This guarantees the file's caret-major versions are honored without npm resolving to newer majors.
  </action>
  <verify>
    <automated>node -e "const p = require('./package.json'); if (p.scripts.dev !== 'vite') process.exit(1); if (p.scripts['dev:docsify'] !== 'npx docsify-cli@4 serve .') process.exit(1); if (!p.dependencies.react) process.exit(1); if (!p.dependencies['react-markdown']) process.exit(1); if (!p.dependencies['remark-gfm']) process.exit(1); if (!p.dependencies['@anthropic-ai/sdk']) process.exit(1); if (!p.devDependencies.vite) process.exit(1); if (!p.devDependencies['@vitejs/plugin-react']) process.exit(1);" && test -d node_modules/vite && test -d node_modules/react && test -d node_modules/react-markdown && test -d node_modules/remark-gfm && test -f package-lock.json</automated>
  </verify>
  <acceptance_criteria>
    - `package.json` `scripts.dev` equals exactly the string `vite`
    - `package.json` `scripts["dev:docsify"]` equals exactly `npx docsify-cli@4 serve .`
    - `package.json` `scripts.build` equals exactly `vite build`
    - `package.json` `scripts["update-spec"]` is preserved unchanged
    - `package.json` `dependencies.react` matches `^18.`
    - `package.json` `dependencies["react-markdown"]` matches `^9.`
    - `package.json` `dependencies["remark-gfm"]` matches `^4.`
    - `package.json` `dependencies["@anthropic-ai/sdk"]` matches `^0.90.`
    - `package.json` `dependencies.dotenv` matches `^16.4.`
    - `package.json` `devDependencies.vite` matches `^5.`
    - `package.json` `devDependencies["@vitejs/plugin-react"]` matches `^4.`
    - `node_modules/vite/package.json` exists (verifies install completed)
    - `node_modules/react/package.json` exists
    - `node_modules/react-markdown/package.json` exists
    - `node_modules/remark-gfm/package.json` exists
    - `package-lock.json` exists at repo root
  </acceptance_criteria>
  <done>package.json declares Vite + React + react-markdown + remark-gfm; legacy Docsify dev script preserved as dev:docsify; npm install completed without errors and node_modules contains all listed deps.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Create app/index.html — Vite HTML entry</name>
  <files>app/index.html</files>
  <read_first>
    - index.html (the LIVE Docsify entry at repo root — read it to confirm you are creating a separate file at app/index.html, not modifying root index.html)
  </read_first>
  <action>
Create `app/index.html` with EXACTLY the following content. This file becomes Vite's HTML entry when Vite is run with `root: 'app'` (set in Task 4's vite.config.js). It is intentionally minimal — Phase 4 owns branding/theming, so do NOT add custom CSS, fonts, or meta tags beyond the basics below.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MacPlants ERP — Specification (dev)</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

Notes:
- The `<script src="/src/main.jsx">` path is RELATIVE TO THE VITE ROOT (`app/`), so this resolves to `app/src/main.jsx`. Do not write `./src/main.jsx` or `app/src/main.jsx` — Vite expects the leading `/`.
- Title says "(dev)" because this entry is only used during `npm run dev`. Phase 5 owns the production index.html cutover.
- `<div id="root">` is the React mount point — must match `getElementById('root')` in `main.jsx` (Task 5).
  </action>
  <verify>
    <automated>test -f app/index.html && grep -q '<div id="root">' app/index.html && grep -q 'src="/src/main.jsx"' app/index.html && grep -q 'type="module"' app/index.html</automated>
  </verify>
  <acceptance_criteria>
    - File `app/index.html` exists
    - Contains literal string `<div id="root"></div>`
    - Contains literal string `src="/src/main.jsx"`
    - Contains literal string `type="module"`
    - Contains `<title>MacPlants ERP — Specification (dev)</title>`
    - Does NOT contain any reference to `docsify`, `cdn.jsdelivr.net`, or `<style>` tags (those belong to root index.html, not this file)
  </acceptance_criteria>
  <done>app/index.html exists as a minimal Vite HTML entry with a #root mount point and a module script tag pointing at /src/main.jsx.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 4: Create app/vite.config.js — Vite config with React plugin and fs.allow for project-spec/</name>
  <files>app/vite.config.js</files>
  <read_first>
    - app/index.html (just created in Task 3 — confirm it exists before configuring Vite to use it)
    - .planning/codebase/STRUCTURE.md (confirms project-spec/ is a sibling of app/, both under repo root)
  </read_first>
  <action>
Create `app/vite.config.js` with EXACTLY the following content. This config:

1. Tells Vite the project root is `app/` (the directory this file lives in — `__dirname` equivalent).
2. Registers `@vitejs/plugin-react` for JSX/Fast Refresh support.
3. Sets the dev server port to `5173` (Vite default; locked explicitly so future config changes are visible).
4. Configures `server.fs.allow` to include the repo root (parent of `app/`) so Plan 02 can `import` markdown files from `../project-spec/*.md` via Vite's `?raw` query. WITHOUT this, Vite blocks filesystem access outside the project root by default.
5. Does NOT set a custom `build.outDir` — defaults to `app/dist/` which is already in `.gitignore`. Phase 5 will revisit if Netlify needs `dist/` at repo root.

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Vite project root is `app/`. Markdown content lives in `../project-spec/`,
// outside the Vite root, so we extend `server.fs.allow` to include the repo root.
export default defineConfig({
  root: __dirname,
  plugins: [react()],
  server: {
    port: 5173,
    fs: {
      // Allow access to ../project-spec (and the rest of the repo root) so Plan 02
      // can import markdown via `import.meta.glob('../../project-spec/*.md', { query: '?raw' })`.
      allow: [path.resolve(__dirname, '..')]
    }
  }
});
```

Notes:
- Use `node:url` and `node:path` (Node-prefixed built-ins) — matches the existing project convention from `scripts/update-spec.mjs:20-21` (per CONVENTIONS.md line 98).
- ESM throughout — `package.json` `"type": "module"` already enforces this.
- The `defineConfig` helper provides type intellisense; do not remove it even though we are not using TypeScript.
- Quote style: single quotes here (JSX/Vite ecosystem norm) per the `<convention_deviation>` block at the top of this plan. The Node tooling layer (`scripts/build-manifest.mjs` in Plan 02) keeps double quotes.
  </action>
  <verify>
    <automated>test -f app/vite.config.js && grep -q "@vitejs/plugin-react" app/vite.config.js && grep -q "fs:" app/vite.config.js && grep -q "allow:" app/vite.config.js && grep -q "port: 5173" app/vite.config.js && node -e "import('./app/vite.config.js').then(m => { if (typeof m.default !== 'object') process.exit(1); }).catch(() => process.exit(1))"</automated>
  </verify>
  <acceptance_criteria>
    - File `app/vite.config.js` exists
    - Imports `defineConfig` from `vite`
    - Imports `react` from `@vitejs/plugin-react`
    - Imports `path` from `node:path` (with `node:` prefix per CONVENTIONS.md)
    - Calls `react()` inside the `plugins` array
    - Sets `server.port` to literal `5173`
    - Configures `server.fs.allow` containing `path.resolve(__dirname, '..')`
    - Sets `root: __dirname`
    - File is loadable as an ESM module (`node -e "import('./app/vite.config.js')"` exits 0)
  </acceptance_criteria>
  <done>Vite config exists with React plugin enabled, dev port 5173, fs.allow extending to the repo root so project-spec/ markdown files can be imported by the React app.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 5: Create app/src/main.jsx — React entry point</name>
  <files>app/src/main.jsx, app/src/styles.css</files>
  <read_first>
    - app/index.html (Task 3) — confirm `<div id="root">` is the mount target
  </read_first>
  <action>
Create `app/src/main.jsx` with EXACTLY:

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Could not find #root element in app/index.html');
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

Then create `app/src/styles.css` with EXACTLY:

```css
/* Minimal base styles. Phase 4 owns full brand/theme work — keep this file tiny. */
:root {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.5;
}

body {
  margin: 0;
  padding: 16px;
  color: #222;
  background: #fff;
}

#root {
  max-width: 960px;
  margin: 0 auto;
}
```

Why minimal CSS: Phase 4 (Branding & Layout) owns the MacPlants green theme, sidebar, typography, and full visual feel. Phase 1 must NOT introduce theme decisions that will be reworked. The 16px padding and max-width 960px are just to make the placeholder readable in the browser during Phase 1 verification — they will be replaced.

Quote style: single quotes in the JSX file per the `<convention_deviation>` block at the top of this plan.
  </action>
  <verify>
    <automated>test -f app/src/main.jsx && test -f app/src/styles.css && grep -q "createRoot" app/src/main.jsx && grep -q "StrictMode" app/src/main.jsx && grep -q "import App from './App.jsx'" app/src/main.jsx && grep -q "getElementById('root')" app/src/main.jsx && grep -q "import './styles.css'" app/src/main.jsx</automated>
  </verify>
  <acceptance_criteria>
    - File `app/src/main.jsx` exists
    - Imports `createRoot` from `react-dom/client`
    - Imports `StrictMode` from `react`
    - Imports `App` from `./App.jsx`
    - Imports `./styles.css`
    - Calls `document.getElementById('root')`
    - Wraps `<App />` in `<StrictMode>`
    - File `app/src/styles.css` exists
    - styles.css does NOT contain `#2c8d4f` (Phase 4 owns brand color, not Phase 1)
    - styles.css contains a `body` selector with `margin: 0`
  </acceptance_criteria>
  <done>main.jsx mounts React with StrictMode into #root, imports the App component and base styles.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 6: Create app/src/App.jsx — placeholder root component</name>
  <files>app/src/App.jsx</files>
  <read_first>
    - app/src/main.jsx (Task 5) — confirm App is imported as the default export
  </read_first>
  <action>
Create `app/src/App.jsx` with EXACTLY:

```jsx
export default function App() {
  return (
    <main>
      <h1>MacPlants ERP — Specification</h1>
      <p>
        Phase 1 scaffold is running. Plan 02 wires the build-time manifest and
        markdown viewer.
      </p>
    </main>
  );
}
```

This is intentionally a stub. Plan 02 (next wave) replaces the body with `<SpecViewer />` that imports the manifest and renders the newest dated spec. Do NOT add markdown rendering, manifest imports, or any logic beyond this placeholder — those belong to Plan 02.
  </action>
  <verify>
    <automated>test -f app/src/App.jsx && grep -q "export default function App" app/src/App.jsx && grep -q "MacPlants ERP" app/src/App.jsx</automated>
  </verify>
  <acceptance_criteria>
    - File `app/src/App.jsx` exists
    - Contains `export default function App`
    - Contains the literal text `MacPlants ERP — Specification`
    - Does NOT contain any `import` statements (placeholder only — Plan 02 adds imports)
    - Does NOT reference `react-markdown`, `manifest`, or `import.meta.glob` (those belong to Plan 02)
  </acceptance_criteria>
  <done>App.jsx exports a default function component rendering a placeholder heading. Plan 02 will replace the body.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 7: Smoke-test the dev server starts and serves the placeholder</name>
  <files>(none modified — verification only)</files>
  <read_first>
    - app/index.html, app/src/main.jsx, app/src/App.jsx, app/vite.config.js, package.json (sanity check that all six prior tasks landed)
  </read_first>
  <action>
Verify the Vite dev server boots and serves the placeholder app without errors. Run the following sequence:

1. From the repo root, start the dev server in the background:
   ```
   npm run dev > /tmp/vite-dev.log 2>&1 &
   echo $! > /tmp/vite-dev.pid
   ```

2. Wait up to 10 seconds for Vite to print `Local:   http://localhost:5173/`. Use a poll loop:
   ```
   for i in {1..20}; do
     if grep -q "Local:" /tmp/vite-dev.log; then break; fi
     sleep 0.5
   done
   ```

3. Curl the dev URL and the main module:
   ```
   curl -sf http://localhost:5173/ -o /tmp/vite-index.html
   curl -sf http://localhost:5173/src/main.jsx -o /tmp/vite-main.jsx
   ```

4. Confirm the served HTML contains `<div id="root">` and the served main.jsx is non-empty and contains `createRoot`.

5. Confirm the dev log contains NO compilation errors. Acceptable lines: `VITE v5.x.x ready in ...`, `Local:   http://localhost:5173/`. Forbidden lines: anything matching `error`, `failed`, `cannot find`.

6. Kill the dev server:
   ```
   kill $(cat /tmp/vite-dev.pid)
   ```

If any step fails, do NOT proceed — diagnose and fix the underlying cause (missing dep, bad import path, syntax error in jsx). The Vite dev server starting cleanly is the gate that proves Plan 01 is done.

Note: do NOT touch the legacy Docsify dev script in this verification. `npm run dev:docsify` is preserved-but-ignored during Phase 1 — it is verified manually only if requested.
  </action>
  <verify>
    <automated>npm run dev > /tmp/vite-dev.log 2>&1 & PID=$!; for i in $(seq 1 20); do if grep -q "Local:" /tmp/vite-dev.log; then break; fi; sleep 0.5; done; sleep 1; curl -sf http://localhost:5173/ -o /tmp/vite-index.html && curl -sf http://localhost:5173/src/main.jsx -o /tmp/vite-main.jsx; RESULT=$?; kill $PID 2>/dev/null; wait $PID 2>/dev/null; grep -q '<div id="root">' /tmp/vite-index.html && grep -q "createRoot" /tmp/vite-main.jsx && ! grep -iq "error\|failed\|cannot find" /tmp/vite-dev.log && [ "$RESULT" = "0" ]</automated>
  </verify>
  <acceptance_criteria>
    - `npm run dev` starts a Vite dev server that prints `Local:` URL within 10s
    - `curl http://localhost:5173/` returns HTTP 200 and HTML containing `<div id="root">`
    - `curl http://localhost:5173/src/main.jsx` returns HTTP 200 and a non-empty body containing `createRoot`
    - The dev log contains NO line matching `error`, `failed`, or `cannot find` (case-insensitive)
    - The dev server is cleanly killed after the smoke test
  </acceptance_criteria>
  <done>`npm run dev` starts Vite, serves the placeholder app at http://localhost:5173/ with no errors, confirms the scaffold is ready for Plan 02 to build on.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Repo → public Netlify deploy | Anything committed becomes publicly readable. Phase 1 only adds dev-time scaffold; production cutover is Phase 5. |
| npm registry → local node_modules | Direct/transitive dependencies execute install scripts and run in the build process. New attack surface: vite, @vitejs/plugin-react, react, react-dom, react-markdown, remark-gfm. |
| Local FS → Vite dev server | Vite's `server.fs.allow` controls which files outside the project root the dev server will serve. We open `..` (repo root) so Plan 02 can import markdown. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-01-01 | Tampering | npm dependency supply chain (vite, plugin-react, react-markdown, remark-gfm) | mitigate | Pin caret-major versions in package.json (`^5.4.0`, `^18.3.1`, `^9.0.1`, `^4.0.0`); commit `package-lock.json` so `npm ci` reproduces exact transitive tree; review lockfile diff in Task 2 commit. |
| T-01-02 | Information Disclosure | Vite `server.fs.allow` opening repo root | accept | Dev-only setting — Vite dev server is not deployed. Phase 5's production build inlines content into `dist/` static assets; production has no FS access at all. Documented in vite.config.js comment. |
| T-01-03 | Information Disclosure | Accidental commit of `.env` or other secrets | mitigate | New `.gitignore` (Task 1) explicitly excludes `.env`, `.env.*.local`, `.DS_Store`, and the three transient outputs of `scripts/update-spec.mjs`. |
| T-01-04 | Denial of Service | Dev server port 5173 conflict | accept | Port pinned in vite.config.js for predictability; if conflict occurs locally, Vite auto-increments — acceptable for dev. Not a production concern. |
| T-01-05 | Spoofing/Tampering | Legacy Docsify CDN scripts in root index.html | accept | Not in this plan's scope — the live `index.html` and its CDN deps are inherited from the brownfield repo and untouched in Phase 1. Documented as a known issue in `.planning/codebase/CONCERNS.md` lines 62-66; Phase 5 cutover removes the CDN dependency entirely. |
| T-01-06 | Tampering | Markdown rendering XSS via react-markdown | accept (deferred to Plan 02) | This plan creates a placeholder App with NO markdown rendering. Plan 02 must explicitly NOT enable `rehype-raw` or any HTML-passthrough plugin (called out in Plan 02's threat model). |

**Severity:** All threats LOW for Phase 1 (no user input, no auth, no PII, no production exposure). Highest-risk item (markdown XSS) is deferred to Plan 02 where the rendering actually happens.
</threat_model>

<verification>
After all tasks complete, the developer should be able to:

1. Run `npm install` (idempotent — should be a no-op) — exits 0.
2. Run `npm run dev` — Vite starts on http://localhost:5173 with the placeholder app rendered.
3. Edit `app/src/App.jsx` while the dev server is running — Fast Refresh updates the browser without a full reload.
4. Run `npm run dev:docsify` — the legacy Docsify dev workflow still serves the spec at http://localhost:3000 (port 3000 = Docsify default; does not conflict with Vite's 5173).
5. `git status` shows `node_modules/` and `app/dist/` ignored (not listed as untracked).
</verification>

<success_criteria>
- `.gitignore` exists with all entries from Task 1
- `package.json` has `dev: vite`, `dev:docsify`, `build`, `update-spec` scripts; React + Vite + react-markdown + remark-gfm deps installed
- `app/index.html`, `app/vite.config.js`, `app/src/main.jsx`, `app/src/App.jsx`, `app/src/styles.css` exist with the exact contents specified
- `npm run dev` starts Vite cleanly and serves a 200 OK page with `<div id="root">` at http://localhost:5173/
- Root `index.html` (the live Docsify entry) is UNCHANGED — `git diff index.html` shows no edits
- Dev log contains no errors, warnings about missing modules, or React JSX compilation failures
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation/01-01-SUMMARY.md` documenting:
- Final dependency versions resolved by npm install (from package-lock.json)
- Any deviations from planned versions and why
- Confirmation that `npm run dev` boots cleanly
- Confirmation that root `index.html` is untouched (run `git diff --stat index.html` and report)
- Any unexpected discoveries (e.g. peer dep warnings, version pin adjustments) for Plan 02 to consider
</output>
