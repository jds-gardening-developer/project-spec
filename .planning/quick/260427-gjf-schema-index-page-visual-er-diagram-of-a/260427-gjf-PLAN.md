---
phase: 260427-gjf
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/build-schema-index.mjs
  - scripts/build-schema-index.test.js
  - package.json
  - app/src/components/SchemaPage.jsx
  - app/src/components/SchemaPage.css
  - app/src/components/useRoute.js
  - app/src/App.jsx
  - app/src/components/Sidebar.jsx
autonomous: true
requirements:
  - SCHEMA-IDX-01
user_setup: []

must_haves:
  truths:
    - "Build emits app/src/schema-index.json with one record per entity (name, prd_id, fields[]) and a relationships array of { from, to, label } edges derived from `FK → X` Notes/Type cells in the spec"
    - "Visiting #/schema in the running app renders a single page containing (a) a Mermaid erDiagram showing every entity and its FK relationships and (b) an aggregated alphabetised list of every entity with its full field reference"
    - "Each entity heading in the field-list section is a link that navigates back to the corresponding PRD anchor in the main spec view (e.g. clicking 'Plant Variant' goes to #/prd-1-1 or whichever heading the variant table lives under) so the user can read the surrounding requirements"
    - "Schema page only loads its data + Mermaid lazily — schema-index.json is dynamic-imported on route entry and contributes nothing to the main bundle when the user is on the spec view"
    - "Sidebar has a discoverable entry for 'Schema Index' (or equivalent) that routes to #/schema; clicking it switches the main pane to the schema page; clicking any sidebar PRD entry switches back"
  artifacts:
    - path: "scripts/build-schema-index.mjs"
      provides: "Build-time spec parser that walks every '### **Data Model**' block, extracts entities + Field|Type|Notes rows, detects 'FK → X' edges, writes app/src/schema-index.json"
      min_lines: 120
    - path: "scripts/build-schema-index.test.js"
      provides: "node --test coverage for the entity/FK extraction (parses fixture markdown, asserts entities, fields, FK edges)"
      min_lines: 60
    - path: "app/src/components/SchemaPage.jsx"
      provides: "Lazy-imported schema page: dynamic-imports schema-index.json, builds mermaid erDiagram source, renders <MermaidBlock> + alphabetised field tables with PRD anchor links"
      min_lines: 80
    - path: "app/src/components/useRoute.js"
      provides: "Tiny hash-router hook returning { route: 'spec' | 'schema' }; updates on hashchange; treats #/schema as schema, anything else as spec"
      min_lines: 25
    - path: "app/src/App.jsx"
      provides: "Routes between SpecViewer (default) and lazy SchemaPage based on useRoute(); preserves existing useHashScroll behaviour for spec route"
    - path: "app/src/components/Sidebar.jsx"
      provides: "Static 'Schema Index' nav entry at the top of the sidebar that links to #/schema; active when route === 'schema'"
    - path: "package.json"
      provides: "predev/prebuild now also runs build-schema-index.mjs; new test script glob includes scripts/*.test.js"
  key_links:
    - from: "scripts/build-schema-index.mjs"
      to: "app/src/schema-index.json"
      via: "fs.writeFileSync at end of main()"
      pattern: "schema-index\\.json"
    - from: "app/src/components/SchemaPage.jsx"
      to: "app/src/schema-index.json"
      via: "dynamic import inside useEffect (() => import('../schema-index.json'))"
      pattern: "import\\(.+schema-index"
    - from: "app/src/components/SchemaPage.jsx"
      to: "MermaidBlock"
      via: "renders a synthesised mermaid erDiagram code-block string through the same MermaidBlock component used by spec content"
      pattern: "MermaidBlock|erDiagram"
    - from: "app/src/components/Sidebar.jsx"
      to: "useRoute"
      via: "consumes route to mark the Schema Index entry active"
      pattern: "useRoute"
    - from: "app/src/App.jsx"
      to: "SchemaPage"
      via: "React.lazy + Suspense; only imported when route === 'schema'"
      pattern: "lazy\\(.+SchemaPage"
---

<objective>
Add a Schema Index page (#/schema) that renders an interactive ER-style overview of every entity in the spec — a Mermaid `erDiagram` of all entities and their FK relationships, plus an alphabetised reference list of every entity with its full field set and a link back to the PRD section that defines it.

Purpose: One-click answer to "what entities exist, how do they relate, and where is each one specified?" — currently impossible without scrolling the whole 70KB spec. Closes backlog item 999.1 and expands it from a flat list to a full ER diagram.

Output:
- `scripts/build-schema-index.mjs` — build-time parser, mirrors the `build-search-index.mjs` pattern
- `app/src/schema-index.json` — generated artefact (gitignored-style; emitted at predev/prebuild)
- `app/src/components/SchemaPage.jsx` — lazy route component
- `app/src/components/useRoute.js` — minimal hash-router hook
- Sidebar gains a "Schema Index" entry; App routes between the spec viewer and the schema page
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md

# Existing build-time parser to mirror in style + structure
@scripts/build-search-index.mjs

# Existing build-script we registered with predev/prebuild — also style reference
@scripts/build-manifest.mjs

# The spec being indexed — every '### **Data Model**' block is a target
@project-spec/2026-04-26.md

# Existing Mermaid renderer to reuse, NOT to copy
@app/src/components/MermaidPre.jsx

# Current pre-dispatcher that decides language-mermaid vs copy-button
@app/src/components/Pre.jsx

# Current layout shell — schema page mounts in <main>
@app/src/App.jsx

# Sidebar — gains the Schema Index entry; reads route to mark it active
@app/src/components/Sidebar.jsx

# Cross-link plugin already converts (see PRD-X.Y) → anchors; same slug scheme
# (rehype-slug / github-slugger) used for PRD anchors that the schema page links into
@app/src/components/crossLinkPlugin.js

# Existing schema-card pattern — type/notes parsing logic to reuse mentally
@app/src/components/SchemaTable.helpers.js

# package.json scripts — extend predev/prebuild + test glob
@package.json

<interfaces>
<!-- Contracts the executor needs without exploring the codebase. -->

From scripts/build-search-index.mjs (mirror this pattern):
```javascript
// Pre-flight: SPEC_DIR exists, locate newest YYYY-MM-DD.md by ISO date desc.
// Use github-slugger so anchor ids match runtime rehype-slug output.
// Output is JSON written to app/src/<name>.json with trailing newline.
// CLI vs import detection via fileURLToPath(import.meta.url) === argv[1].
// Pure helpers exported for `node --test`.
```

From app/src/components/MermaidPre.jsx (reuse, don't fork):
```javascript
export function MermaidBlock({ children }): JSX.Element
// Expects children to be a <code> element whose children are the diagram source string
// (matches react-markdown's <pre><code>...</code></pre> shape).
// Internally dynamic-imports 'mermaid' once via module-level loadMermaid() singleton.
// Renders to SVG with securityLevel: 'strict'. Shows red error banner on parse fail.
```
Schema page needs to render mermaid from a *string we synthesise*, not from a markdown
fenced block. Two valid approaches:
  (a) Wrap the synthesised source in the same shape MermaidBlock expects:
      `<MermaidBlock><code>{erSource}</code></MermaidBlock>` — works because
      MermaidBlock's extractSource() walks `children.props.children` for a string.
  (b) Render the string inside a real ` ```mermaid ``` ` fenced block via a tiny
      ReactMarkdown instance and let Pre.jsx route it.
Prefer (a) — fewer moving parts, no extra react-markdown invocation.

From app/src/components/Pre.jsx:
```javascript
export function Pre({ children, ...props })
// Used by SpecViewer; not needed on the Schema Page (we call MermaidBlock directly).
```

From app/src/App.jsx:
```javascript
// Currently always renders <SpecViewer markdown={content} />.
// useHashScroll(content) is called unconditionally — KEEP it gated to spec route only
// once routing exists, otherwise schema deep-links would fight scrollIntoView.
```

From app/src/components/Sidebar.jsx:
```javascript
// Sidebar already collects PRD entries from the rendered DOM via collectHeadings().
// On the schema route the .spec-viewer DOM is unmounted, so collectHeadings() returns []
// and the existing PRD list disappears. The Schema Index entry must be a STATIC element
// rendered above the dynamic <ul> so it is always visible regardless of route.
```

Spec markdown shape (project-spec/2026-04-26.md) — what build-schema-index parses:
```
## **PRD-1: Plant Database & Inventory**

### **Data Model**

**Plant**

| Field | Type | Notes |
| --- | --- | --- |
| name | string | |
| created_by | FK → User | |

**Plant Variant** *(one per pot size; a Plant has many)*

| Field | Type | Notes |
| --- | --- | --- |
| plant | FK → Plant | |
| ...
```
Notes:
  - One `### **Data Model**` block can contain MULTIPLE entities (Plants/Variants/Batches/Stock Movements all share PRD-1's Data Model section).
  - Each entity is introduced by a `**EntityName**` line (optionally followed by italic
    `*(...)*` annotation) that appears between the previous table and the next `| Field | Type | Notes |` header.
  - FK references appear in the **Type** column as `FK → EntityName` (sometimes `FK → EntityName (nullable)`). Strip ` (nullable)` and trim. Underscore-escaped names like `created\_by` must be unescaped (mirror `stripMarkdownInline` logic).
  - The closest preceding `## **PRD-N(.M)`** heading is the entity's `prd_id` (slug it the same way build-search-index.mjs does — `github-slugger`).

</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Build-time schema-index parser</name>
  <files>
    scripts/build-schema-index.mjs
    scripts/build-schema-index.test.js
    package.json
  </files>
  <behavior>
    - Test 1: parseEntitiesFromMarkdown(fixture) returns one record per `**Entity**` label that is followed by a `| Field | Type | Notes |` table; each record has `{ name, prd_id, fields: [{ name, type, notes }] }`.
    - Test 2: Underscore-escaped field names (`created\_by`) are unescaped to `created_by`.
    - Test 3: extractRelationships(entities) returns `[{ from, to, label }]` for every Type cell starting with `FK →`; `(nullable)` is stripped from the target name and recorded on label (e.g. `created_by (nullable)`); duplicate edges with the same `from + to + label` are de-duplicated.
    - Test 4: prd_id is the slug of the closest preceding `## **PRD-N(.M): Title**` heading (matches github-slugger output, lowercase, dots → dashes — same convention as build-search-index normalizeRecord).
    - Test 5: Entities outside any `### **Data Model**` block (i.e. labels in narrative prose with no following Field|Type|Notes table) are NOT collected.
    - Test 6: When a single Data Model section contains multiple entities (Plant + Plant Variant + Plant Batch + Stock Movement under PRD-1), all four are emitted.
  </behavior>
  <action>
Create `scripts/build-schema-index.mjs` mirroring `scripts/build-search-index.mjs` exactly in style:
  - Same shebang, file header JSDoc block describing purpose/usage/output schema.
  - Same imports: `fs`, `path`, `fileURLToPath`, `GithubSlugger`.
  - Same path constants: `REPO_ROOT`, `SPEC_DIR`, plus new `OUT_PATH = app/src/schema-index.json`.
  - Same CLI/import detection (`isCli()`).
  - Same newest-file selection (ISO_DATE_RE, sort desc).
  - Same `// ---------- section ----------` banner-comment style.
  - Same final report block + numbered "Next steps".

Parsing logic (export pure helpers for tests):

  1. `unescapeUnderscores(text)` — `text.replace(/\\_/g, '_').trim()`. Reuse the same logic build-search-index already uses.

  2. `parseEntitiesFromMarkdown(markdown)`:
     - Split into lines, track fenced code-block state (don't parse inside ` ``` `).
     - Track `currentPrdSlug` updated whenever a `## **PRD-N(.M): Title**` heading is seen (use github-slugger; replicate normalizeRecord's prd_id derivation: lowercase, dots → dashes; e.g. PRD-1.1 → `prd-1-1`).
     - Track `inDataModel` boolean: set true when `### **Data Model**` heading appears, false when next `### ` heading appears.
     - When `inDataModel`, scan for `**EntityName**` lines (regex: `^\*\*([^*]+)\*\*(\s*\*\([^)]+\)\*)?\s*$`). Cache the most recent one as `pendingEntity`.
     - When the next line that matches `| Field | Type | Notes |` is found AND `pendingEntity` is set, start a new entity record. Continue consuming `| field | type | notes |` rows (skip the `| --- | --- | --- |` separator) until a blank line or non-table line ends the table. Then push `{ name: pendingEntity, prd_id: currentPrdSlug, fields: rows }` and clear `pendingEntity`.
     - For each row, run `unescapeUnderscores` on `name`, trim `type` and `notes`.

  3. `extractRelationships(entities)`:
     - For each entity, for each field whose `type` matches `^FK\s*→\s*(.+?)(?:\s*\(([^)]+)\))?\s*$`:
       - `from = entity.name`, `to = capture group 1` (trim), `label = field.name + (nullable ? ' (nullable)' : '')`.
     - De-duplicate by `${from}|${to}|${label}`.
     - Return sorted by `from`, then `to`, then `label` so the JSON output is stable across builds.

  4. `main()` writes `{ source, generated_at, entities, relationships }` to `OUT_PATH` with a trailing newline. Logs counts the same way build-search-index does.

Test file `scripts/build-schema-index.test.js` (Node's built-in test runner — match existing `app/src/components/*.test.js` style):
  - Embed a small fixture string covering: PRD-1 with multiple entities (Plant, Plant Variant), PRD-2 single entity (Order), an FK with `(nullable)`, an underscore-escaped field name, an entity-looking `**Foo**` line outside a Data Model section.
  - Use `node:assert/strict` and `node:test`'s `describe`/`it`.

`package.json` updates:
  - `predev`: append ` && node scripts/build-schema-index.mjs`
  - `prebuild`: same.
  - Add new script `"build-schema-index": "node scripts/build-schema-index.mjs"`.
  - `"test"`: change to `"node --test app/src/components/*.test.js scripts/*.test.js"` so the new test runs in CI/local.

Run the build once and confirm `app/src/schema-index.json` exists with non-zero `entities.length` and `relationships.length`. Do NOT commit `app/src/schema-index.json` if a `.gitignore` rule already excludes generated JSON; if not, add `app/src/schema-index.json` to `.gitignore` (only if `.gitignore` exists — STATE.md notes the repo currently has none; if absent, leave it for now since manifest.json and search-index.json are also untracked-or-not by the same policy — match whatever those files do).
  </action>
  <verify>
    <automated>npm test -- --test-name-pattern="schema-index" 2>&1 | tail -30 && node scripts/build-schema-index.mjs && node -e "const d = require('./app/src/schema-index.json'); console.assert(d.entities.length >= 10, 'expected >=10 entities, got '+d.entities.length); console.assert(d.relationships.length >= 15, 'expected >=15 relationships, got '+d.relationships.length); console.assert(d.entities.some(e=>e.name==='Plant Variant'), 'missing Plant Variant'); console.assert(d.relationships.some(r=>r.from==='Plant Variant' && r.to==='Plant'), 'missing Plant Variant→Plant FK'); console.log('OK', d.entities.length, 'entities,', d.relationships.length, 'relationships');"</automated>
  </verify>
  <done>
    - All new tests pass via `npm test`.
    - `app/src/schema-index.json` exists, parses as JSON, has `entities` (>= ~10 — every Data Model entity in the spec) and `relationships` (>= ~15 FK edges).
    - Each entity has `{ name: string, prd_id: string, fields: [{ name, type, notes }] }`.
    - Each relationship has `{ from, to, label }`; nullable FKs preserve `(nullable)` in the label.
    - `npm run dev` and `npm run build` both regenerate the file via the predev/prebuild hooks.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Hash router + Schema Page component</name>
  <files>
    app/src/components/useRoute.js
    app/src/components/useRoute.test.js
    app/src/components/SchemaPage.jsx
    app/src/components/SchemaPage.css
  </files>
  <behavior>
    - Test 1 (useRoute): `parseHashRoute('#/schema')` returns `'schema'`; `parseHashRoute('#/prd-1-1')`, `'#prd-1-1'`, `''`, `null` all return `'spec'`.
    - Test 2 (useRoute): the hook reads `window.location.hash` on mount and updates state when a `hashchange` event fires (verified via jsdom-free test: stub `window`, dispatch, assert).
    - Test 3 (SchemaPage — light render): given a hand-built fake schema-index object passed as a prop, the component renders a `<section>` containing (a) one `<MermaidBlock>` whose code child contains the string `erDiagram` and one `Plant ||--o{ "Plant Variant"` style line per relationship, and (b) one `<article>` per entity with id `entity-<slug>`, the entity name as an `<h3>`, a "View in spec →" link with `href="#/<prd_id>"`, and a `<table>` listing every field. (Use react-test-renderer-style snapshot or just `react-dom/server.renderToStaticMarkup` and string-match — match the existing test idiom in `app/src/components/SchemaTable.helpers.test.js`.)
  </behavior>
  <action>
Create `app/src/components/useRoute.js`:
  ```javascript
  import { useEffect, useState } from 'react';

  const SCHEMA_ROUTE_RE = /^#?\/?schema(?:\/.*)?$/i;

  export function parseHashRoute(hash) {
    if (typeof hash !== 'string') return 'spec';
    return SCHEMA_ROUTE_RE.test(hash) ? 'schema' : 'spec';
  }

  export function useRoute() {
    const [route, setRoute] = useState(() =>
      typeof window === 'undefined' ? 'spec' : parseHashRoute(window.location.hash)
    );
    useEffect(() => {
      if (typeof window === 'undefined') return;
      const onHash = () => setRoute(parseHashRoute(window.location.hash));
      window.addEventListener('hashchange', onHash);
      return () => window.removeEventListener('hashchange', onHash);
    }, []);
    return route;
  }
  ```
Test in `useRoute.test.js` covers the parser cases above + a stub-window hashchange round-trip.

Create `app/src/components/SchemaPage.jsx`:
  - Default export. Self-contained — does NOT use react-markdown.
  - On mount, dynamic-import the schema-index JSON:
    ```javascript
    const [data, setData] = useState(null);
    useEffect(() => {
      let cancelled = false;
      import('../schema-index.json')
        .then((m) => { if (!cancelled) setData(m.default || m); })
        .catch((err) => { if (!cancelled) setData({ __error: err.message || String(err) }); });
      return () => { cancelled = true; };
    }, []);
    ```
  - Render states: loading (`<p>Loading schema…</p>`), error (`<p role="alert">Failed to load schema index: {err}</p>`), loaded.
  - Loaded:
    1. `<header>` with `<h1>Schema Index</h1>` and a one-sentence subtitle.
    2. `<section className="schema-page__diagram">` containing a Mermaid `erDiagram` synthesised from `data.relationships` + `data.entities`. Synthesis algorithm:
       ```
       lines = ['erDiagram']
       // 1) Declare every entity (escape names with spaces by quoting; mermaid v10 erDiagram supports double-quoted entity names)
       for each entity in data.entities:
         lines.push(`    "${entity.name}" {`)
         for each field of entity.fields (cap at first 6 to keep the diagram legible — full list still in the reference section):
           // Mermaid erDiagram attribute syntax: `<type> <name>` — sanitise to one word each.
           const safeType = (field.type || 'string').replace(/[^A-Za-z0-9_]/g, '_').replace(/^_+|_+$/g, '') || 'string'
           const safeName = field.name.replace(/[^A-Za-z0-9_]/g, '_')
           lines.push(`        ${safeType} ${safeName}`)
         lines.push('    }')
       // 2) Edges
       for each rel in data.relationships:
         // Many-to-one: from }o--|| to (each rel.from has exactly one rel.to; many froms can share one to)
         // Use rel.label as the relationship label (mermaid expects double-quoted)
         lines.push(`    "${rel.from}" }o--|| "${rel.to}" : "${rel.label.replace(/"/g, '\\"')}"`)
       const erSource = lines.join('\n')
       ```
       Wrap it in `<MermaidBlock>` using the children-shape MermaidBlock expects:
       ```jsx
       <MermaidBlock><code>{erSource}</code></MermaidBlock>
       ```
       (MermaidBlock's `extractSource` walks `children.props.children` for a string — verified in the interface contract above.)
    3. `<section className="schema-page__entities">` with an alphabetised list of entities. For each entity:
       ```jsx
       <article id={`entity-${slug(entity.name)}`} className="schema-entity">
         <h3>{entity.name}</h3>
         <p><a href={`#/${entity.prd_id}`}>View in spec →</a></p>
         <table>
           <thead><tr><th>Field</th><th>Type</th><th>Notes</th></tr></thead>
           <tbody>
             {entity.fields.map(f => (
               <tr key={f.name}>
                 <td><code>{f.name}</code></td>
                 <td>{f.type}</td>
                 <td>{f.notes}</td>
               </tr>
             ))}
           </tbody>
         </table>
       </article>
       ```
       For the slug helper, import GithubSlugger? — NO. GithubSlugger is a build-time dep; for runtime we just need a stable id, so use a tiny local `slugify(name)` that lowercases + replaces non-alphanum with `-` (simpler than pulling github-slugger into the runtime bundle). Match the prd_id convention (`prd-1-1`) by using the same scheme: `name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')`.
    4. The PRD anchor link `#/${entity.prd_id}` will leave the schema route (useRoute switches to 'spec'), App.jsx will mount SpecViewer, and useHashScroll will resolve the prefix-match (`#prd-1` → `#prd-1-plant-database…`) — already works because rehype-slug emits exactly that pattern, useHashScroll already supports prefix-match resolution.

Create `app/src/components/SchemaPage.css` with minimal styling:
  - `.schema-page` page container: padding, max-width: 80ch (or whatever the spec-viewer uses; check styles.css if needed).
  - `.schema-page__diagram` — bordered card with overflow-x: auto so the ER diagram can scroll horizontally on small screens.
  - `.schema-entity` — card with border-bottom; reuse CSS custom properties already declared by Phase 2 (see `MermaidPre.css` / `SchemaTable.css` for the green accent var).
  - `.schema-entity table` — compact, `font-size: 0.9em`, monospace for field names via the existing `code` style.
  - No new colours; reference existing `--accent` / `--border` etc. custom properties from `styles.css` if present, else use `currentColor` borders to inherit.

Tests in `SchemaPage.test.js` (Node's test runner, no jsdom — render via `react-dom/server`):
  - Build a fake `data` object inline.
  - Render `<SchemaPage initialData={fake} />` where `initialData` is an OPTIONAL prop the component honours (when set, it skips the dynamic import and renders synchronously). This prop is a test seam ONLY — production code never sets it.
  - String-match: `erDiagram`, `"Plant Variant" }o--|| "Plant"`, `id="entity-plant-variant"`, `href="#/prd-1-1"`.
  </action>
  <verify>
    <automated>npm test 2>&1 | tail -40</automated>
  </verify>
  <done>
    - `useRoute.test.js` and `SchemaPage.test.js` pass.
    - `SchemaPage.jsx` renders the three sections (header, diagram, entities) on a fake data prop without throwing.
    - The synthesised mermaid string contains exactly one `erDiagram` line, one declaration block per entity, and one `}o--||` edge per relationship.
    - Each entity article has a working `#/<prd_id>` link.
    - No static `import schemaIndex from '../schema-index.json'` at the top of the file — the JSON is dynamic-imported only.
  </done>
</task>

<task type="auto">
  <name>Task 3: Wire route into App + Sidebar entry</name>
  <files>
    app/src/App.jsx
    app/src/components/Sidebar.jsx
    app/src/components/Sidebar.css
  </files>
  <action>
Update `app/src/App.jsx`:
  1. Import `useRoute` and create `const route = useRoute()`.
  2. Replace the static SchemaPage import with `React.lazy`:
     ```javascript
     import { lazy, Suspense } from 'react';
     const SchemaPage = lazy(() => import('./components/SchemaPage.jsx'));
     ```
  3. Gate `useHashScroll(content)` so it only runs on the spec route — pass `null` on the schema route to suppress its effect:
     ```javascript
     useHashScroll(route === 'spec' ? content : null);
     ```
  4. Render switch inside `<main className="app-main">`:
     ```jsx
     {route === 'schema' ? (
       <Suspense fallback={<p>Loading schema…</p>}>
         <SchemaPage />
       </Suspense>
     ) : (
       <>
         <header>
           <small>Viewing: <code>project-spec/{newest?.filename}</code></small>
         </header>
         <SpecViewer markdown={content} />
       </>
     )}
     ```
  5. Keep Sidebar and SearchPanel unconditional — both should remain available regardless of route. (SearchPanel is fine because it overlays.)

Update `app/src/components/Sidebar.jsx`:
  1. Import `useRoute`.
  2. Render a STATIC entry at the very top of the `<nav>`, ABOVE the dynamic `<ul>`:
     ```jsx
     const route = useRoute();
     // ...
     <nav id="sidebar-nav">
       <ul className="sidebar-list sidebar-list--static">
         <li className="sidebar-item">
           <a
             href="#/schema"
             className={
               'sidebar-link sidebar-link--h2 sidebar-link--static' +
               (route === 'schema' ? ' sidebar-link--active' : '')
             }
             onClick={(e) => {
               // Let the browser update the hash (no preventDefault) so useRoute fires;
               // then close the drawer if open.
               setDrawerOpen(false);
             }}
           >
             Schema Index
           </a>
         </li>
       </ul>
       {/* existing dynamic groups list */}
       {groups.length === 0 ? ... }
     </nav>
     ```
  3. The existing PRD heading collection runs after the spec-viewer mounts. On the schema route the spec-viewer is unmounted, so `collectHeadings()` returns `[]` and the dynamic `<ul>` is empty (showing only the static "Schema Index" entry). That's the desired UX — when on the schema page, the user sees just the Schema Index (highlighted) and an empty PRD section. To make this nicer, when `groups.length === 0 && route === 'schema'`, render `<p className="sidebar-empty">(open the spec to see PRD nav)</p>` instead of the existing `(no sections)` text.
  4. When the user clicks a normal PRD entry while on the schema route, `handleEntryClick` calls `scrollToAnchor(id)` which sets `location.hash = '#' + id`. That hash does NOT match `/^#?\/?schema/`, so `useRoute` flips back to `'spec'`, App re-mounts SpecViewer, and useHashScroll resolves the anchor. No additional code needed — verify in the browser that this round-trip works.

Update `app/src/components/Sidebar.css`:
  - Add `.sidebar-list--static { margin: 0 0 0.5rem 0; padding-bottom: 0.5rem; border-bottom: 1px solid var(--sidebar-border, rgba(0,0,0,0.08)); }` to visually separate the static entry from the dynamic PRD list.
  - Reuse the existing `.sidebar-link--active` styling (3px left bar) — no new styles needed for the active state.
  - If `--sidebar-border` is not defined in `styles.css`, use a hard-coded `rgba(0,0,0,0.08)` and let Phase 4 unify tokens later (out of scope for this quick task).

Verify the Sidebar still renders correctly when the spec is loaded (Schema Index entry visible at top, dynamic PRD list below) and when on the schema route (Schema Index highlighted, dynamic list shows the empty hint).

Add a tiny smoke test or rely on the existing Sidebar test suite — if Sidebar already has a test (`Sidebar.test.js` doesn't appear in the listing), no new test is required for the wiring; manual verification suffices because the route logic itself is covered by Task 2's `useRoute.test.js`.
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -20 && npm test 2>&1 | tail -10 && node -e "const fs = require('fs'); const html = fs.readFileSync('app/dist/index.html','utf-8'); console.assert(html.includes('<div id=\"root\">'), 'root missing'); const assets = fs.readdirSync('app/dist/assets'); const mainJs = assets.find(f => /^index-.*\.js$/.test(f)); const mainSize = fs.statSync('app/dist/assets/'+mainJs).size; console.log('main bundle (raw):', mainSize, 'bytes', mainJs); const schemaChunk = assets.find(f => /SchemaPage.*\.js$/.test(f)); console.assert(schemaChunk, 'SchemaPage was not split into its own chunk'); console.log('SchemaPage chunk:', schemaChunk);"</automated>
  </verify>
  <done>
    - `npm run build` succeeds and emits a SchemaPage chunk separate from the main `index-*.js` bundle (Vite splits `React.lazy` imports automatically).
    - The schema-index JSON is also a separate chunk (dynamic JSON import → its own asset, OR inlined as a tiny separate JS module — either is acceptable as long as it is NOT inside the main bundle).
    - All tests still pass.
    - Sidebar shows "Schema Index" entry at the top of the nav both when on the spec route and the schema route.
    - Clicking "Schema Index" updates the URL to `#/schema` and the main pane switches to SchemaPage.
    - Clicking any PRD entry from the schema page returns to the spec view and scrolls to the right heading.
    - useHashScroll does NOT fire on the schema route (no errors about missing scroll targets when the hash is `#/schema`).
  </done>
</task>

</tasks>

<verification>
End-to-end manual smoke (run after Task 3):
  1. `npm run dev` — open http://localhost:5173 (or whichever port Vite picks).
  2. Sidebar shows "Schema Index" at the top + the existing PRD list below.
  3. Click "Schema Index" → URL becomes `#/schema`, main pane shows the ER diagram (loads after a moment as Mermaid lazy-imports), then the entity reference list below.
  4. Click "View in spec →" on any entity (e.g. Plant Variant) → URL becomes `#/prd-1-1`, sidebar switches back to PRD mode, page scrolls to the right heading inside the Plant Database PRD.
  5. Refresh on `#/schema` → page re-loads directly into the schema view, no flash of the spec viewer.
  6. Browser dev-tools Network tab: confirm that on first load (no hash) only the main bundle is fetched; navigating to `#/schema` triggers fetches for the SchemaPage chunk + schema-index.json + (if not already fetched) the mermaid chunk.

Bundle budget check:
  - `npm run build` and inspect `app/dist/assets/`. Main `index-*.js` should be roughly the same size as before this plan (within a couple of KB) — the SchemaPage code, the schema-index JSON, and Mermaid all lazy-load.
</verification>

<success_criteria>
- `app/src/schema-index.json` is generated by `npm run build` / `npm run dev` and contains every Data Model entity in the spec with its full field set + a complete FK relationship graph.
- `#/schema` renders a single page with (a) a Mermaid `erDiagram` of all entities + relationships and (b) an alphabetised reference list of every entity with PRD jump-links.
- Sidebar exposes the route via a "Schema Index" entry; route switching is bidirectional and preserves the spec-viewer behaviour (deep-links, scroll-spy, search) on the spec route.
- Main bundle does not regress materially — SchemaPage, schema-index.json, and Mermaid are all lazy-loaded.
- Tests pass: build-schema-index parser tests (entities, FKs, prd_id slug, multi-entity Data Model blocks, FK nullable label), useRoute parser + hashchange round-trip, SchemaPage render against a fake data prop.
</success_criteria>

<output>
After completion, create `.planning/quick/260427-gjf-schema-index-page-visual-er-diagram-of-a/260427-gjf-SUMMARY.md` recording:
  - What was built (parser, route hook, page, sidebar entry).
  - Counts: entities and relationships in the generated schema-index.json.
  - Bundle impact: main bundle size before and after (from `npm run build` output).
  - Any deferred items (e.g. theming polish, two-way active highlighting in the field list, search integration of entity records — all explicit non-goals here).
</output>
