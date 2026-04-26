---
phase: 02-rich-rendering
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - app/src/SpecViewer.jsx
  - app/src/components/CrossLinkText.jsx
  - app/src/components/crossLinkPlugin.js
  - app/src/components/SchemaTable.jsx
  - app/src/components/SchemaTable.helpers.js
  - app/src/components/Pre.jsx
  - app/src/components/MermaidPre.jsx
  - app/src/styles.css
autonomous: true
requirements:
  - REND-02
  - REND-03
  - REND-04
  - REND-05
must_haves:
  truths:
    - "After Plan 01, the viewer renders the spec identically to Phase 1 (no visible behavior change yet)."
    - "rehype-slug is installed and active so PRD headings receive auto-generated id attributes."
    - "react-markdown's components prop is wired to four renderer files, each containing a pass-through stub."
    - "The four downstream plans (02, 03, 04, 05) each have a disjoint implementation file to fill in."
    - "CSS custom properties for color/accent values are declared so Phase 4 has a known theming surface."
    - "An `npm test` script exists in package.json so downstream Wave-2 plans can add `*.test.js` files without touching package.json."
  artifacts:
    - path: "app/src/components/crossLinkPlugin.js"
      provides: "Stub remark plugin (no-op transformer)"
    - path: "app/src/components/CrossLinkText.jsx"
      provides: "Stub `a` renderer (renders default <a>)"
    - path: "app/src/components/SchemaTable.jsx"
      provides: "Stub `table` renderer (renders default <table>)"
    - path: "app/src/components/SchemaTable.helpers.js"
      provides: "Stub helpers file (pure JS — no JSX) — Plan 04 fills in detection + traversal logic so it is testable under node --test."
    - path: "app/src/components/Pre.jsx"
      provides: "Dispatcher: routes language-mermaid <pre> to MermaidPre, else default <pre>"
    - path: "app/src/components/MermaidPre.jsx"
      provides: "Stub mermaid renderer (renders source as plain <pre>)"
    - path: "app/src/SpecViewer.jsx"
      provides: "Wired `components`, `remarkPlugins=[remarkGfm, remarkCrossLinks]`, `rehypePlugins=[rehypeSlug]`"
      contains: "rehypeSlug"
    - path: "package.json"
      provides: "mermaid and rehype-slug in dependencies; `npm test` script for Wave-2 plans."
      contains: "\"mermaid\":"
    - path: "app/src/styles.css"
      provides: "CSS custom property surface for Phase 4"
      contains: "--schema-card-accent"
  key_links:
    - from: "app/src/SpecViewer.jsx"
      to: "app/src/components/Pre.jsx"
      via: "import { Pre } and components={{ pre: Pre }}"
      pattern: "components\\s*=\\s*\\{[^}]*pre"
    - from: "app/src/SpecViewer.jsx"
      to: "app/src/components/SchemaTable.jsx"
      via: "import { SchemaOrTable } and components={{ table: SchemaOrTable }}"
      pattern: "components\\s*=\\s*\\{[^}]*table"
    - from: "app/src/SpecViewer.jsx"
      to: "rehype-slug"
      via: "rehypePlugins prop"
      pattern: "rehypePlugins\\s*=\\s*\\[[^\\]]*rehypeSlug"
    - from: "app/src/SpecViewer.jsx"
      to: "app/src/components/crossLinkPlugin.js"
      via: "remarkPlugins includes remarkCrossLinks"
      pattern: "remarkPlugins\\s*=\\s*\\[[^\\]]*remarkCrossLinks"
---

<objective>
Establish the integration seam for all four Phase 2 renderers. Install the new dependencies (`mermaid@^10`, `rehype-slug@^6`), create six renderer/plugin/helper files as **stubs** that pass through to default react-markdown behavior, wire them into `SpecViewer.jsx` via the `components`, `remarkPlugins`, and `rehypePlugins` props, add CSS custom properties to `styles.css` for the Phase 4 theming hand-off, and add a top-level `npm test` script so any Wave-2 plan can add `*.test.js` files without touching `package.json` again.

After this plan completes, the viewer behaves identically to Phase 1 (no visible change yet) but every downstream Wave-2 plan can edit its own implementation file in isolation without touching `SpecViewer.jsx`, `package.json`, or stepping on another plan's files.

Purpose: Eliminate the file-conflict that would otherwise force the four renderers to serialize. With the seam in place, Plans 02–05 run in parallel.
Output: Wired SpecViewer + 4 stub renderers + 1 stub plugin + 1 stub helpers file + dependencies installed + `npm test` script + CSS hand-off surface.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/02-rich-rendering/02-CONTEXT.md
@.planning/phases/01-foundation/01-02-SUMMARY.md
@app/src/SpecViewer.jsx
@app/src/App.jsx
@app/src/styles.css
@package.json

<interfaces>
<!-- Phase 1 left SpecViewer minimal. Current shape: -->

From app/src/SpecViewer.jsx (Phase 1 final state):
```jsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function SpecViewer({ markdown }) {
  if (typeof markdown !== 'string') return <p>Loading…</p>;
  if (markdown.length === 0) return <p>(spec file is empty)</p>;
  return (
    <article className="spec-viewer">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </article>
  );
}
```

react-markdown@9 `components` prop signature: each key is an HTML element name (e.g. `a`, `table`, `pre`, `code`, `p`); the value is a React component receiving `{node, children, ...props}` where `props` are HTML attributes (e.g. `className` on `<code>` for fenced-block language) and `node` is the hast node. Custom `text` is NOT supported in v9 — text-node manipulation goes through a remark plugin.

remark plugin contract: a plugin is `() => (tree) => { /* mutate tree */ }`. To produce a `<a>` element from a text segment, replace the text node with: `{type: 'link', url: '#prd-1-1', children: [{type:'text', value:'PRD-1.1'}], data: {hProperties: {...}}}` — remark-rehype turns `link` into `<a>` and react-markdown renders via `components.a`.

Test runner choice: Node 20+ ships `node --test`. JSX is NOT natively parseable, so any file ending in `.test.js` or `.test.jsx` that imports a `.jsx` file will fail at import time with a SyntaxError. Plan 04 works around this by extracting pure-JS detection logic into a `.helpers.js` file and testing only the helpers. The `npm test` glob in `package.json` therefore points at `*.test.js` files (no `.test.jsx` — the helpers pattern keeps them all extension-`.js`).
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Install Phase 2 dependencies, add npm test script, verify build still passes</name>
  <files>package.json</files>
  <read_first>
    - package.json (current deps: react-markdown@^9.0.1, remark-gfm@^4.0.0; current scripts: predev, dev, prebuild, build, preview, dev:docsify, build-manifest, update-spec — note: NO `test` script yet)
    - .planning/phases/02-rich-rendering/02-CONTEXT.md (D-02 mermaid lazy-load, D-05 rehype-slug, D-18 plugin choice)
    - app/vite.config.js (no changes expected; verify Vite 5 + React plugin still in place)
  </read_first>
  <action>
    **Step A — Install dependencies.** Run from repo root:
    ```
    npm install --save mermaid@^10 rehype-slug@^6
    ```

    Concrete version pins per CONTEXT.md D-18 / D-05:
    - `mermaid@^10` — latest stable major; supports `securityLevel: 'strict'` and dynamic import.
    - `rehype-slug@^6` — slugifies heading text into `id` attributes; pure ESM, ~5KB gz.

    Do NOT install `rehype-raw` — D-17 explicitly prohibits HTML passthrough.
    Do NOT install any other remark/rehype plugin — Plan 02 will add a custom local remark plugin (file under `app/src/components/`), not a published package.

    **Step B — Add the `test` script to `package.json`.** Edit the `scripts` block to add ONE new entry:

    ```json
    "test": "node --test app/src/components/*.test.js"
    ```

    The script targets `app/src/components/*.test.js` (extension `.js`, NOT `.jsx`). This is intentional: Node 20+ does NOT have a built-in JSX parser, so any test file that imports a `.jsx` file via `import` and tries to evaluate JSX inside its own body will fail. Plan 02 (cross-link plugin) tests pure JS — fine. Plan 04 (schema card) extracts its detection logic into `SchemaTable.helpers.js` and tests only the helpers — also fine. Plans that need to test `.jsx` rendering must do so via the human-verify checkpoint.

    The full new `scripts` block (illustrative — preserve existing entries):
    ```json
    "scripts": {
      "predev": "node scripts/build-manifest.mjs",
      "dev": "vite --config app/vite.config.js",
      "prebuild": "node scripts/build-manifest.mjs",
      "build": "vite build --config app/vite.config.js",
      "preview": "vite preview --config app/vite.config.js",
      "dev:docsify": "npx docsify-cli@4 serve .",
      "build-manifest": "node scripts/build-manifest.mjs",
      "update-spec": "node scripts/update-spec.mjs",
      "test": "node --test app/src/components/*.test.js"
    }
    ```

    **Step C — Verify pre-flight.** Confirm the working tree change set: `package.json` `dependencies` gained two entries, `package.json` `scripts` gained one entry, `package-lock.json` updated. Then run a clean build:

    ```
    rm -rf app/dist
    npm run build
    ```

    Build must exit 0. Stop and investigate if it fails.

    Verify `npm test` does not crash even though no test files exist yet — it should report 0 tests run and exit 0:
    ```
    npm test
    ```
  </action>
  <verify>
    <automated>node -e "const p=require('./package.json'); if(!p.dependencies.mermaid || !p.dependencies['rehype-slug']) { console.error('missing deps'); process.exit(1); } if(!p.scripts.test || !p.scripts.test.includes('node --test')) { console.error('missing test script'); process.exit(1); } console.log('deps ok:', p.dependencies.mermaid, p.dependencies['rehype-slug']); console.log('test script ok:', p.scripts.test);" && rm -rf app/dist && npm run build 2>&1 | tail -20</automated>
  </verify>
  <acceptance_criteria>
    - `package.json` `dependencies` contains a key `"mermaid"` with a value matching `^10` (e.g. `"^10.9.4"`).
    - `package.json` `dependencies` contains a key `"rehype-slug"` with a value matching `^6` (e.g. `"^6.0.0"`).
    - `package.json` `dependencies` does NOT contain `"rehype-raw"`.
    - `package.json` `scripts` contains a `"test"` key whose value is exactly `"node --test app/src/components/*.test.js"`.
    - `npm run build` exits with code 0 against a freshly-cleaned `app/dist/`.
    - `package-lock.json` has been updated (modified timestamp newer than before).
  </acceptance_criteria>
  <done>
    Both new packages are installed, the lockfile is updated, the `test` script is in place for Wave-2 plans, and `npm run build` produces a working `app/dist/` against the existing Phase 1 code (no new imports yet).
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Create stub renderer files, stub remark plugin, and stub helpers file</name>
  <files>
    app/src/components/crossLinkPlugin.js,
    app/src/components/CrossLinkText.jsx,
    app/src/components/SchemaTable.jsx,
    app/src/components/SchemaTable.helpers.js,
    app/src/components/Pre.jsx,
    app/src/components/MermaidPre.jsx
  </files>
  <read_first>
    - .planning/phases/02-rich-rendering/02-CONTEXT.md (D-13 copy-button skip language-mermaid, D-17 components-prop integration, D-19 CSS custom properties)
    - app/src/SpecViewer.jsx (current minimal implementation — about to be extended)
  </read_first>
  <action>
    Create six new files under `app/src/components/`. Each is a deliberate **pass-through stub** that preserves Phase 1 behavior. Plans 02–05 will replace the stub bodies with real implementations; this task locks in the file paths and exported symbol names so SpecViewer.jsx can wire them once and never be touched again in Wave 2.

    **File 1: `app/src/components/crossLinkPlugin.js`**
    ```js
    /**
     * crossLinkPlugin — remark plugin that rewrites inline "(see PRD-X.Y)" cross-references
     * into <a> link nodes. Plan 02 (REND-02) replaces this stub with the real implementation.
     *
     * Stub behavior: identity transformer (no-op). Mounted by SpecViewer in Plan 01 so the
     * remarkPlugins array is locked in; Plan 02 only edits this file's body.
     */
    export default function remarkCrossLinks() {
      return function transform(tree) {
        // Stub: no-op. Plan 02 will walk text nodes here and split them into link nodes.
        return tree;
      };
    }
    ```

    **File 2: `app/src/components/CrossLinkText.jsx`**
    ```jsx
    /**
     * CrossLinkAnchor — custom <a> renderer for react-markdown.
     * Plan 02 (REND-02) replaces the stub body with click-time target resolution +
     * scrollIntoView + broken-link fallback (D-06, D-07).
     */
    export function CrossLinkAnchor({ href, children, ...props }) {
      // Stub: render default anchor. Plan 02 adds the click handler that resolves the target,
      // scrolls smoothly, updates the hash, or falls back to a dimmed span on miss.
      return <a href={href} {...props}>{children}</a>;
    }
    ```

    **File 3: `app/src/components/SchemaTable.jsx`**
    ```jsx
    /**
     * SchemaOrTable — custom <table> renderer.
     * Plan 04 (REND-03) replaces the stub with: detect 3-col Field|Type|Notes header (D-08),
     * render schema card (D-09), preserve backslash escapes (D-10), FK chip (D-11),
     * CSS custom properties (D-12).
     *
     * The pure-JS detection + traversal logic lives in SchemaTable.helpers.js so it is
     * testable under `node --test` (which cannot parse JSX).
     */
    export function SchemaOrTable({ children, ...props }) {
      // Stub: render default table. Plan 04 inspects children for thead and routes.
      return <table {...props}>{children}</table>;
    }
    ```

    **File 4: `app/src/components/SchemaTable.helpers.js`**
    ```js
    /**
     * SchemaTable helpers — pure JS, no JSX.
     *
     * Lives in a `.js` file (not `.jsx`) so it can be imported and exercised by
     * `app/src/components/SchemaTable.test.js` running under `node --test`. Node 20+
     * does not have a built-in JSX parser; keeping all testable logic here lets us
     * validate detection + AST traversal without spinning up Vitest / esbuild / babel.
     *
     * Plan 04 (REND-03) fills in:
     *   - isSchemaHeader(headerCells)        — D-08 detection rule (3-col field|type|notes)
     *   - extractHeaderCells(reactChildren)  — walk React children to find thead row
     *   - extractBodyRows(reactChildren)     — walk React children to find tbody rows
     *   - detectFkType(typeText)             — D-11 (returns whether the type text contains
     *                                         the FK arrow so SchemaTable.jsx can chip it)
     *
     * Stub: no exports yet. Plan 04 adds the four named exports above.
     */
    // Intentionally empty. Plan 04 fills in pure helpers.
    export {};
    ```

    **File 5: `app/src/components/Pre.jsx`**
    ```jsx
    /**
     * Pre — dispatcher for fenced code blocks.
     *  - If the inner <code> has className "language-mermaid", render via MermaidBlock (Plan 03 / REND-04).
     *  - Otherwise render a plain <pre> (Plan 05 / REND-05 will wrap this branch with a copy button).
     *
     * D-13: copy button is excluded from mermaid blocks. The branching here enforces that.
     */
    import { MermaidBlock } from './MermaidPre.jsx';

    function getCodeChildClassName(children) {
      // react-markdown passes a single <code> child; its className carries the fence language.
      // children may be a single React element or an array containing it.
      const arr = Array.isArray(children) ? children : [children];
      for (const child of arr) {
        if (child && child.props && typeof child.props.className === 'string') {
          return child.props.className;
        }
      }
      return '';
    }

    export function Pre({ children, ...props }) {
      const cls = getCodeChildClassName(children);
      if (cls.includes('language-mermaid')) {
        return <MermaidBlock>{children}</MermaidBlock>;
      }
      // Stub: default <pre>. Plan 05 wraps this branch with a copy button.
      return <pre {...props}>{children}</pre>;
    }
    ```

    **File 6: `app/src/components/MermaidPre.jsx`**
    ```jsx
    /**
     * MermaidBlock — renders a ```mermaid fenced block as a live diagram.
     * Plan 03 (REND-04) replaces the stub with dynamic-import mermaid (D-02), parse-error
     * banner (D-03), and securityLevel: 'strict' init.
     */
    export function MermaidBlock({ children }) {
      // Stub: render the source as a plain <pre> (Phase 1 fallback). Plan 03 swaps this for an SVG render.
      return <pre className="mermaid-source-stub">{children}</pre>;
    }
    ```

    Use 2-space indentation, single quotes for JS strings (matches Phase 1 `SpecViewer.jsx`), `.jsx` for files containing JSX, `.js` for the pure-data remark plugin AND the helpers file. No semicolons missing on statement ends. ESM throughout — no `module.exports`.
  </action>
  <verify>
    <automated>test -f app/src/components/crossLinkPlugin.js && test -f app/src/components/CrossLinkText.jsx && test -f app/src/components/SchemaTable.jsx && test -f app/src/components/SchemaTable.helpers.js && test -f app/src/components/Pre.jsx && test -f app/src/components/MermaidPre.jsx && grep -q "export default function remarkCrossLinks" app/src/components/crossLinkPlugin.js && grep -q "export function CrossLinkAnchor" app/src/components/CrossLinkText.jsx && grep -q "export function SchemaOrTable" app/src/components/SchemaTable.jsx && grep -q "export {}" app/src/components/SchemaTable.helpers.js && grep -q "export function Pre" app/src/components/Pre.jsx && grep -q "export function MermaidBlock" app/src/components/MermaidPre.jsx && echo "all stubs present"</automated>
  </verify>
  <acceptance_criteria>
    - `app/src/components/crossLinkPlugin.js` exists and exports `default` function `remarkCrossLinks`.
    - `app/src/components/CrossLinkText.jsx` exists and exports named `CrossLinkAnchor`.
    - `app/src/components/SchemaTable.jsx` exists and exports named `SchemaOrTable`.
    - `app/src/components/SchemaTable.helpers.js` exists, has no JSX, and at minimum contains `export {}` so Plan 04 can extend it.
    - `app/src/components/Pre.jsx` exists, exports named `Pre`, and imports `MermaidBlock` from `./MermaidPre.jsx`.
    - `app/src/components/MermaidPre.jsx` exists and exports named `MermaidBlock`.
    - None of the stubs import `mermaid` or `rehype-slug` directly — those imports live in `SpecViewer.jsx` (Task 3) and `MermaidPre.jsx` (Plan 03 fills it in).
  </acceptance_criteria>
  <done>
    Six new component files exist with the documented exports; all are pass-through stubs preserving Phase 1 behavior. The helpers file is JSX-free so Plan 04's tests can run under `node --test`. Each file's JSDoc comment names the downstream plan that will fill it in.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Wire SpecViewer.jsx and add CSS custom property surface</name>
  <files>app/src/SpecViewer.jsx, app/src/styles.css</files>
  <read_first>
    - app/src/SpecViewer.jsx (current Phase 1 minimal version)
    - app/src/styles.css (current minimal base styles)
    - .planning/phases/02-rich-rendering/02-CONTEXT.md (D-12 schema-card CSS custom properties, D-17 components-prop integration, D-19 Phase 4 deferral via CSS variables)
    - app/src/components/Pre.jsx, CrossLinkText.jsx, SchemaTable.jsx, crossLinkPlugin.js (just created in Task 2)
  </read_first>
  <action>
    **Step A — Replace `app/src/SpecViewer.jsx` with this exact content:**

    ```jsx
    import ReactMarkdown from 'react-markdown';
    import remarkGfm from 'remark-gfm';
    import rehypeSlug from 'rehype-slug';
    import remarkCrossLinks from './components/crossLinkPlugin.js';
    import { CrossLinkAnchor } from './components/CrossLinkText.jsx';
    import { SchemaOrTable } from './components/SchemaTable.jsx';
    import { Pre } from './components/Pre.jsx';

    /**
     * SpecViewer — renders the spec markdown with Phase 2 enrichments wired in.
     *
     * Pipeline:
     *   - remarkGfm:        GFM tables, fenced code, strikethrough (REND-01, Phase 1)
     *   - remarkCrossLinks: rewrites `(see PRD-X.Y)` text into <a> link nodes (REND-02, Plan 02)
     *   - rehypeSlug:       auto-IDs on headings so cross-links can resolve targets (REND-02, D-05)
     *
     * Component overrides (D-17):
     *   - a:     CrossLinkAnchor — handles click-to-scroll + broken-link fallback (REND-02)
     *   - table: SchemaOrTable    — schema-card vs plain-table dispatch (REND-03)
     *   - pre:   Pre               — copy-button + mermaid-block dispatch (REND-04, REND-05)
     *
     * Default react-markdown sanitization is preserved — NO rehype-raw, NO HTML passthrough.
     */
    const components = {
      a: CrossLinkAnchor,
      table: SchemaOrTable,
      pre: Pre,
    };

    const remarkPlugins = [remarkGfm, remarkCrossLinks];
    const rehypePlugins = [rehypeSlug];

    export default function SpecViewer({ markdown }) {
      if (typeof markdown !== 'string') {
        return <p>Loading…</p>;
      }
      if (markdown.length === 0) {
        return <p>(spec file is empty)</p>;
      }
      return (
        <article className="spec-viewer">
          <ReactMarkdown
            remarkPlugins={remarkPlugins}
            rehypePlugins={rehypePlugins}
            components={components}
          >
            {markdown}
          </ReactMarkdown>
        </article>
      );
    }
    ```

    **Step B — Add CSS custom property surface to `app/src/styles.css`.** Append (do NOT replace) the following block to the existing file. Phase 4 will override these in a single rebrand pass; Plan 02–05 components reference these names.

    ```css

    /* --- Phase 2 component theming surface (Phase 4 will override these) --- */
    :root {
      /* Schema-card (D-12) */
      --schema-card-border: #e1e4e8;
      --schema-card-background: #fafbfc;
      --schema-card-accent: #586069;          /* Phase 4 sets to MacPlants green #2c8d4f */
      --schema-card-title-color: #24292e;
      --schema-card-field-color: #24292e;
      --schema-card-type-background: #eaecef;
      --schema-card-type-color: #24292e;
      --schema-card-notes-color: #586069;

      /* Cross-link (REND-02) */
      --cross-link-color: #0366d6;            /* Phase 4 may override */
      --cross-link-broken-color: #999999;

      /* Copy-button (REND-05) */
      --copy-button-color: #6a737d;
      --copy-button-color-success: #28a745;
      --copy-button-background: transparent;

      /* Mermaid (D-01) */
      --mermaid-error-color: #d73a49;
      --mermaid-error-background: #ffeef0;
    }
    ```

    **Step C — verify the wiring with a clean build.** Run from repo root:
    ```
    rm -rf app/dist
    npm run build
    ```
    The build must complete without errors. The bundle output should NOT include mermaid in the main entry chunk because no file imports `'mermaid'` yet at this point (Plan 03 introduces that with a dynamic `import()`).
  </action>
  <verify>
    <automated>grep -q "import rehypeSlug from 'rehype-slug'" app/src/SpecViewer.jsx && grep -q "import remarkCrossLinks from './components/crossLinkPlugin.js'" app/src/SpecViewer.jsx && grep -q "import { CrossLinkAnchor }" app/src/SpecViewer.jsx && grep -q "import { SchemaOrTable }" app/src/SpecViewer.jsx && grep -q "import { Pre }" app/src/SpecViewer.jsx && grep -qE "components\s*=\s*\{" app/src/SpecViewer.jsx && grep -qE "remarkPlugins\s*=\s*\[remarkGfm,\s*remarkCrossLinks\]" app/src/SpecViewer.jsx && grep -qE "rehypePlugins\s*=\s*\[rehypeSlug\]" app/src/SpecViewer.jsx && grep -q -- "--schema-card-accent" app/src/styles.css && grep -q -- "--cross-link-color" app/src/styles.css && grep -q -- "--copy-button-color" app/src/styles.css && grep -q -- "--mermaid-error-color" app/src/styles.css && rm -rf app/dist && npm run build 2>&1 | tail -10 && ls app/dist/assets/ | grep -i mermaid && (echo "FAIL: mermaid chunk should not exist yet (Plan 03 introduces the dynamic import)"; exit 1) || echo "wiring ok — no mermaid chunk yet, as expected"</automated>
  </verify>
  <acceptance_criteria>
    - `app/src/SpecViewer.jsx` contains literal `import rehypeSlug from 'rehype-slug';`
    - `app/src/SpecViewer.jsx` contains literal `import remarkCrossLinks from './components/crossLinkPlugin.js';`
    - `app/src/SpecViewer.jsx` contains literal `import { CrossLinkAnchor }`, `import { SchemaOrTable }`, and `import { Pre }`.
    - `app/src/SpecViewer.jsx` defines a `components` object with keys `a`, `table`, `pre` (regex `components\s*=\s*\{[\s\S]*a:[\s\S]*table:[\s\S]*pre:`).
    - `app/src/SpecViewer.jsx` passes `remarkPlugins`, `rehypePlugins`, and `components` to `<ReactMarkdown>`.
    - `app/src/SpecViewer.jsx` does NOT import `rehype-raw`.
    - `app/src/styles.css` contains all of: `--schema-card-accent`, `--schema-card-border`, `--schema-card-background`, `--cross-link-color`, `--cross-link-broken-color`, `--copy-button-color`, `--copy-button-color-success`, `--mermaid-error-color`.
    - After `rm -rf app/dist && npm run build`, build exits 0 and produces a fresh `app/dist/` directory.
    - The fresh `app/dist/assets/` directory contains NO chunk named `mermaid-*.js` (mermaid is not imported by any source file at this stage; the npm package exists in `node_modules` but is not pulled into the bundle until Plan 03 adds the dynamic import). The verify command treats a present mermaid chunk as a failure.
  </acceptance_criteria>
  <done>
    SpecViewer.jsx wires all three plugin/component slots; styles.css declares the seven CSS custom property groups; a clean `npm run build` passes and produces no mermaid chunk yet. The viewer at `npm run dev` renders the spec exactly as in Phase 1 because all renderer files are pass-through stubs. The seam is now ready for Wave 2 plans to land in parallel.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Spec author → renderer | Markdown content under `project-spec/*.md` is authored by Sigurd / produced by `scripts/update-spec.mjs`. It is NOT user-submitted content from the public web. The viewer treats it as semi-trusted: the author can introduce malicious markdown by mistake (or via a compromised LLM update), but there is no anonymous submission path. |
| npm registry → bundle | New deps (`mermaid@^10`, `rehype-slug@^6`) are pulled at install time. Both are widely-used OSS with active maintenance. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-01-01 | Tampering | `app/src/components/crossLinkPlugin.js` (stub) | accept | Stub is no-op identity transformer; cannot inject content. Plan 02 carries the real threat (regex-driven AST mutation) and will document its own mitigation. |
| T-02-01-02 | Information Disclosure | `app/src/SpecViewer.jsx` HTML passthrough | mitigate | Do NOT add `rehype-raw`. react-markdown@9 sanitizes raw HTML by default (HTML in markdown is rendered as text, not HTML). Verified by absence of `rehype-raw` import (acceptance criteria in Task 3). |
| T-02-01-03 | Tampering | npm supply chain (`mermaid`, `rehype-slug`) | accept | Both packages widely used (mermaid ~7M wkly downloads, rehype-slug ~5M). Pin to caret-major (`^10`, `^6`) so patch+minor security fixes flow but no breaking-major auto-upgrade. `package-lock.json` locks transitive deps. Document but do not block. |
| T-02-01-04 | Denial of Service | rehype-slug on 70KB spec | accept | rehype-slug is O(n) over heading nodes (~140 headings in the current spec). Negligible cost. Verified in Task 3 acceptance criteria via `npm run build` exit 0. |
| T-02-01-05 | Repudiation | CSS custom property values used as input to renderers | n/a | CSS custom properties are read by the browser only for visual rendering — they are not parsed as code or used in security decisions. Phase 4 overrides them; no exfiltration vector. |

ASVS L1 disposition for Phase 2 foundation: the only mitigation that requires active enforcement is T-02-01-02 (no rehype-raw). Acceptance criteria check enforces this. All other threats are accepted with documented rationale.
</threat_model>

<verification>
After Plan 01 is committed:
- `npm install` is current with `package-lock.json` (no pending changes after install).
- `rm -rf app/dist && npm run build` produces `app/dist/index.html` referencing a JS bundle that loads cleanly, with NO mermaid chunk in `app/dist/assets/`.
- `npm test` runs without crashing (zero tests reported, exit 0 — no test files exist yet, but the script itself is wired).
- `npm run dev` starts a Vite server on :5173 (or :5174/5175 if port taken — Phase 1 noted this); opening the viewer shows the spec rendered as it was in Phase 1, because all renderer overrides are pass-through stubs.
- `git status` shows the nine files in `files_modified` as the only changes, plus `package-lock.json` from Task 1.
</verification>

<success_criteria>
1. `mermaid@^10` and `rehype-slug@^6` are in `package.json` dependencies; `npm run build` exits 0 against a freshly-cleaned `dist/`.
2. `package.json` has a `test` script targeting `app/src/components/*.test.js`.
3. Six files exist under `app/src/components/` with the documented exports as pass-through stubs (5 renderers + 1 helpers stub).
4. `app/src/SpecViewer.jsx` imports and wires all three plugin/component slots (`remarkCrossLinks`, `rehypeSlug`, and `components: {a, table, pre}`).
5. `app/src/styles.css` declares the eight CSS custom properties listed (Phase 4 theming surface).
6. The viewer at runtime behaves identically to Phase 1 (no visible regression, no visible new behavior — Plans 02–05 will deliver the visible changes).
7. After a clean build, `app/dist/assets/` contains NO `mermaid-*.js` chunk (Plan 03 introduces it).
</success_criteria>

<output>
After completion, create `.planning/phases/02-rich-rendering/02-01-SUMMARY.md` documenting:
- Exact installed versions of `mermaid` and `rehype-slug` from the lockfile
- Confirmation that the seam is in place (5 renderer stubs + 1 helpers stub + 1 plugin + SpecViewer wiring + CSS surface + npm test script)
- Note that Plans 02, 03, 04, 05 can now run in parallel without file conflicts (none of them needs to touch `package.json` again)
</output>
