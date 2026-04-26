---
phase: 02-rich-rendering
plan: 03
type: execute
wave: 2
depends_on:
  - 02-01
files_modified:
  - app/src/components/MermaidPre.jsx
  - app/src/components/MermaidPre.css
  - project-spec/_phase2-mermaid-fixture.md
requirements:
  - REND-04
autonomous: false
must_haves:
  truths:
    - "User sees ```mermaid fenced blocks rendered as live SVG diagrams in the viewer."
    - "If the spec contains zero mermaid blocks, mermaid bytes are NOT downloaded by the browser (verified by Network tab and by inspecting dist chunks)."
    - "On Mermaid parse error, a visible red banner appears above the original mermaid source so the spec author can see both their input and the error."
    - "Mermaid is initialized with `securityLevel: 'strict'` so diagram source cannot inject HTML or execute scripts."
    - "The default Mermaid light theme is used; no MacPlants green is hard-coded — Phase 4 will set the theme via CSS custom properties (D-01, D-12)."
  artifacts:
    - path: "app/src/components/MermaidPre.jsx"
      provides: "MermaidBlock React component: useEffect-driven dynamic import, render-to-SVG, parse-error banner, securityLevel:'strict' init."
      contains: "import('mermaid')"
    - path: "app/src/components/MermaidPre.css"
      provides: "Layout for the diagram container and the parse-error banner."
    - path: "project-spec/_phase2-mermaid-fixture.md"
      provides: "Throwaway test fixture containing one mermaid flowchart and one intentionally broken mermaid block. Lives in project-spec/ so the manifest picks it up but its filename starts with `_` so build-manifest's date regex never matches it (it stays out of the manifest)."
  key_links:
    - from: "app/src/components/Pre.jsx"
      to: "app/src/components/MermaidPre.jsx"
      via: "import { MermaidBlock } already wired in Plan 01"
      pattern: "import \\{ MermaidBlock \\} from './MermaidPre.jsx'"
    - from: "app/src/components/MermaidPre.jsx"
      to: "mermaid npm package"
      via: "dynamic import('mermaid') gated on first mount"
      pattern: "import\\(['\"]mermaid['\"]\\)"
---

<objective>
Implement REND-04. Replace the Plan 01 stub `MermaidBlock` with a real renderer that:
- Dynamically `import('mermaid')` only when at least one mermaid block is present in the rendered markdown (D-02 — Vite code-splits the dynamic import into its own chunk).
- Initializes Mermaid once with `securityLevel: 'strict'` and the default light theme (D-01).
- Calls `mermaid.render(id, source)` to produce SVG, then injects that SVG into a div via `dangerouslySetInnerHTML` (Mermaid produces sanitized SVG when `securityLevel: 'strict'`; this is the supported Mermaid v10 idiom).
- On `mermaid.parse` failure (or `mermaid.render` rejection), shows a visible red banner reading `Mermaid parse error: {message}` above a `<pre>` showing the original diagram source (D-03).

Add a one-off fixture file `project-spec/_phase2-mermaid-fixture.md` containing two diagrams (one valid, one intentionally broken). The leading underscore keeps the build-manifest date regex (`/^\d{4}-\d{2}-\d{2}\.md$/`) from picking it up, so the manifest still resolves the dated spec as the homepage. The fixture is for manual verification (Task 3 checkpoint) and remains in the repo as a regression check during Phase 3 / Phase 4 work.

Purpose: Make ER and flow diagrams renderable inline. Today's spec has zero mermaid blocks; the fixture proves the pipeline works without committing fictional content into the dated snapshot.
Output: MermaidBlock component + CSS + fixture file.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/phases/02-rich-rendering/02-CONTEXT.md
@.planning/phases/02-rich-rendering/02-01-foundation-PLAN.md
@app/src/components/MermaidPre.jsx
@app/src/components/Pre.jsx
@app/src/styles.css
@scripts/build-manifest.mjs

<interfaces>
<!-- Plan 01 wired: Pre.jsx routes <pre> with language-mermaid child to MermaidBlock. -->
<!-- MermaidBlock receives `children` which is a React element: <code className="language-mermaid">{sourceText}</code> -->

react-markdown@9 fenced-code rendering: a ```mermaid block produces:
  <pre><code className="language-mermaid">{rawSource}</code></pre>
Plan 01's Pre.jsx detects `language-mermaid` and dispatches to <MermaidBlock>{children}</MermaidBlock>,
where `children` is that <code> element. The diagram source is at:
  childCode.props.children   // a string (or array containing one string in some edge cases)

mermaid v10 API:
  import mermaid from 'mermaid';
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'default' });
  const { svg } = await mermaid.render('mermaid-id-' + n, source);   // returns Promise<{svg, bindFunctions?}>
  // Or detect parse errors first:
  await mermaid.parse(source);   // throws on parse error in v10

Pitfall: mermaid.render is not fully reentrant. Two MermaidBlocks rendering at the same time
may produce SVG cross-talk or flicker. Acceptable at current scope — the fixture has 2 diagrams
and they render once on mount. If Phase 4 introduces concurrent renders, queue calls through a
module-level promise chain.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Implement MermaidBlock component (dynamic import + render + parse-error banner)</name>
  <files>
    app/src/components/MermaidPre.jsx,
    app/src/components/MermaidPre.css
  </files>
  <read_first>
    - app/src/components/MermaidPre.jsx (current Plan 01 stub)
    - app/src/components/Pre.jsx (verify the dispatcher signature passes `children` containing the `<code>` element)
    - app/src/styles.css (confirm `--mermaid-error-color` and `--mermaid-error-background` are present from Plan 01)
    - .planning/phases/02-rich-rendering/02-CONTEXT.md (D-01 default theme, D-02 lazy-load, D-03 parse-error banner)
    - package.json (confirm mermaid is installed at ^10)
  </read_first>
  <action>
    **Step A — Replace `app/src/components/MermaidPre.jsx` with the real implementation:**

    ```jsx
    import { useEffect, useId, useRef, useState } from 'react';
    import './MermaidPre.css';

    /**
     * MermaidBlock — renders a fenced ```mermaid block as an SVG diagram.
     *
     * Decisions implemented:
     *   D-01: default light theme; no hard-coded MacPlants green. Phase 4 owns theming.
     *   D-02: mermaid is loaded via dynamic import('mermaid') inside useEffect, so the
     *         module is fetched only when at least one MermaidBlock mounts. Vite code-splits
     *         this into its own chunk; if the page has zero mermaid blocks, the chunk is
     *         never requested.
     *   D-03: on parse/render failure, show a visible red banner above the original source.
     *
     * Security: mermaid.initialize({ securityLevel: 'strict' }) — Mermaid sanitizes diagram
     * source and produces SVG without script tags or arbitrary HTML.
     *
     * Pitfall: mermaid.render is not fully reentrant; concurrent renders may flicker.
     * Acceptable at current scope (fixture has 2 diagrams; real spec has 0). If Phase 4
     * introduces concurrent renders, queue calls through a module-level promise chain.
     */

    // Module-level singleton: initialize mermaid only once across all MermaidBlocks.
    let mermaidPromise = null;
    function loadMermaid() {
      if (mermaidPromise) return mermaidPromise;
      mermaidPromise = import('mermaid').then((mod) => {
        const mermaid = mod.default || mod;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'default',
        });
        return mermaid;
      });
      return mermaidPromise;
    }

    function extractSource(children) {
      // children is the <code> element produced by react-markdown.
      // Its `children` prop is the diagram source as a string (or [string]).
      const arr = Array.isArray(children) ? children : [children];
      for (const child of arr) {
        if (child && child.props && child.props.children) {
          const inner = child.props.children;
          if (typeof inner === 'string') return inner;
          if (Array.isArray(inner)) return inner.filter((x) => typeof x === 'string').join('');
        }
      }
      return '';
    }

    export function MermaidBlock({ children }) {
      const source = extractSource(children);
      const reactId = useId();
      // useId returns something like ":r1:" — invalid for SVG IDs; sanitize.
      const safeId = 'mermaid-' + reactId.replace(/[^a-zA-Z0-9-]/g, '');
      const containerRef = useRef(null);
      const [error, setError] = useState(null);
      const [svg, setSvg] = useState(null);

      useEffect(() => {
        let cancelled = false;
        if (!source.trim()) {
          setError('empty mermaid block');
          return;
        }
        loadMermaid().then((mermaid) => {
          if (cancelled) return;
          // mermaid.render returns Promise<{svg, bindFunctions?}>. It throws on parse error.
          mermaid
            .render(safeId, source)
            .then(({ svg: rendered }) => {
              if (!cancelled) {
                setSvg(rendered);
                setError(null);
              }
            })
            .catch((err) => {
              if (!cancelled) {
                setSvg(null);
                setError(err && err.message ? err.message : String(err));
              }
            });
        }, (loadErr) => {
          if (!cancelled) {
            setError('failed to load mermaid: ' + (loadErr && loadErr.message ? loadErr.message : String(loadErr)));
          }
        });
        return () => {
          cancelled = true;
        };
      }, [source, safeId]);

      if (error) {
        // D-03: visible banner ABOVE the original source so the author sees both.
        return (
          <div className="mermaid-block mermaid-block--error">
            <div className="mermaid-block__error-banner" role="alert">
              Mermaid parse error: {error}
            </div>
            <pre className="mermaid-block__source"><code>{source}</code></pre>
          </div>
        );
      }

      if (!svg) {
        // Loading or pre-render state. Show the source as a placeholder so the layout
        // doesn't shift dramatically once the diagram renders.
        return (
          <div className="mermaid-block mermaid-block--loading">
            <pre className="mermaid-block__source"><code>{source}</code></pre>
          </div>
        );
      }

      return (
        <div
          className="mermaid-block"
          ref={containerRef}
          // Mermaid produces sanitized SVG (securityLevel: 'strict'). dangerouslySetInnerHTML
          // is the supported v10 idiom for embedding the result.
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      );
    }
    ```

    **Step B — Create `app/src/components/MermaidPre.css`:**

    ```css
    /* MermaidBlock — structural layout only. Color values reference Plan 01 CSS custom properties
       so Phase 4 can rebrand without editing this file. */

    .mermaid-block {
      margin: 1em 0;
      padding: 8px;
      overflow-x: auto;
      text-align: center;
    }

    /* SVG sizing — let mermaid set its own viewBox; just constrain width. */
    .mermaid-block svg {
      max-width: 100%;
      height: auto;
    }

    .mermaid-block--loading .mermaid-block__source {
      opacity: 0.5;
    }

    .mermaid-block--error {
      text-align: left;
    }

    .mermaid-block__error-banner {
      color: var(--mermaid-error-color);
      background: var(--mermaid-error-background);
      border: 1px solid var(--mermaid-error-color);
      border-radius: 4px;
      padding: 8px 12px;
      margin-bottom: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-weight: 600;
    }

    .mermaid-block__source {
      background: #f6f8fa;
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
    }

    .mermaid-block__source code {
      background: none;
      padding: 0;
      font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    }
    ```

    **Pitfalls to avoid:**
    - Do NOT call `mermaid.initialize` more than once. The module-level `mermaidPromise` singleton ensures it.
    - Do NOT use `mermaid.run({ querySelector })` — it requires the source to already be in the DOM with `class="mermaid"` and uses `startOnLoad: true` semantics. The explicit `mermaid.render()` call is cleaner for React.
    - Do NOT pass an unsanitized `safeId`. `useId()` returns a string with colons (`:r1:`) which is invalid in CSS / SVG IDs; the regex strips them.
    - Do NOT remove the `cancelled` flag. React StrictMode in dev double-mounts effects; without the flag a stale render can overwrite a fresh one.
    - Reentrancy: do not assume two MermaidBlocks can render concurrently without flicker; the v10 API is not fully reentrant. Acceptable here because the fixture has 2 diagrams rendered once on mount.
  </action>
  <verify>
    <automated>grep -q "import('mermaid')" app/src/components/MermaidPre.jsx && grep -q "securityLevel: 'strict'" app/src/components/MermaidPre.jsx && grep -q "theme: 'default'" app/src/components/MermaidPre.jsx && grep -q "Mermaid parse error" app/src/components/MermaidPre.jsx && grep -q "mermaid-block--error" app/src/components/MermaidPre.jsx && grep -q "dangerouslySetInnerHTML" app/src/components/MermaidPre.jsx && grep -q "import './MermaidPre.css'" app/src/components/MermaidPre.jsx && grep -q "var(--mermaid-error-color)" app/src/components/MermaidPre.css && grep -q "var(--mermaid-error-background)" app/src/components/MermaidPre.css && rm -rf app/dist && npm run build 2>&1 | tail -10 && echo "--- post-build chunk audit ---" && ls app/dist/assets/ | grep -iE "^mermaid" || (echo "FAIL: expected app/dist/assets/mermaid-*.js chunk after build"; exit 1) && echo "--- entry-chunk lazy-load audit (W3) ---" && ENTRY=$(ls app/dist/assets/index-*.js 2>/dev/null | head -1) && if [ -z "$ENTRY" ]; then echo "FAIL: no entry chunk found at app/dist/assets/index-*.js"; exit 1; fi && if grep -lE "flowchart|mermaidAPI" "$ENTRY" >/dev/null 2>&1; then echo "FAIL: mermaid-internal vocab found in entry chunk $ENTRY — lazy-load is broken (mermaid was statically imported into main bundle)"; exit 1; else echo "OK: entry chunk $ENTRY does not contain mermaid-internal vocab — lazy-load intact"; fi</automated>
  </verify>
  <acceptance_criteria>
    - `app/src/components/MermaidPre.jsx` calls `import('mermaid')` (dynamic import — grep for the literal string `import('mermaid')`).
    - `app/src/components/MermaidPre.jsx` initializes mermaid with literal `securityLevel: 'strict'`.
    - `app/src/components/MermaidPre.jsx` initializes mermaid with literal `theme: 'default'`.
    - `app/src/components/MermaidPre.jsx` initializes mermaid with `startOnLoad: false`.
    - `app/src/components/MermaidPre.jsx` displays a banner with text starting `Mermaid parse error:` on failure.
    - `app/src/components/MermaidPre.jsx` does NOT hard-code the MacPlants green hex `#2c8d4f` (grep returns no match).
    - `app/src/components/MermaidPre.css` references both `--mermaid-error-color` and `--mermaid-error-background`.
    - After `rm -rf app/dist && npm run build`, build exits 0.
    - The freshly built `app/dist/assets/` directory contains a chunk file matching `mermaid-*.js` (Vite splits dynamic imports automatically). This confirms code-splitting is working.
    - **Lazy-load assertion (W3):** the freshly built entry chunk `app/dist/assets/index-*.js` does NOT contain the literal strings `flowchart` or `mermaidAPI`. Mermaid-internal vocabulary in the entry chunk would mean mermaid was statically pulled into the main bundle. The strings are allowed (and expected) in the `mermaid-*.js` chunk.
    - The runtime check that the chunk is only fetched when a mermaid block is encountered happens in Task 3.
  </acceptance_criteria>
  <done>
    MermaidBlock dynamically imports mermaid, initializes it with strict security and default theme, renders SVG into the container, and shows a red banner with the source on parse failure. No brand color is hard-coded. A clean build succeeds, produces a separate mermaid chunk, and the entry chunk is mermaid-vocab-free (lazy-load intact).
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Add Mermaid fixture file (one valid, one broken diagram)</name>
  <files>project-spec/_phase2-mermaid-fixture.md</files>
  <read_first>
    - scripts/build-manifest.mjs (confirm the regex `/^\d{4}-\d{2}-\d{2}\.md$/` will NOT match a filename starting with `_`)
    - .planning/phases/02-rich-rendering/02-CONTEXT.md (D-02 lazy-load behavior — fixture exists to exercise this path)
  </read_first>
  <action>
    Create `project-spec/_phase2-mermaid-fixture.md` with this exact content:

    ````markdown
    # Mermaid Pipeline Fixture (Phase 2 verification)

    This file is NOT part of the dated spec. The leading underscore keeps build-manifest's
    `^YYYY-MM-DD.md$` regex from matching it, so it never appears in the manifest and never
    auto-loads. It exists so a human can verify that the Mermaid renderer + the parse-error
    banner work end-to-end.

    To use:
      1. Run `npm run dev`.
      2. Manually point the App to this file by editing `app/src/App.jsx` to load this filename
         in place of `manifest[0].filename` (revert after verification — do NOT commit the
         App.jsx change).
      Or:
      2'. Vite-in-browser: navigate to `/@fs/<repo-root>/project-spec/_phase2-mermaid-fixture.md?raw`
          to confirm the file is reachable, then verify by temporarily renaming it to
          `2099-01-01.md` and refreshing (revert the rename when done).

    ## Valid diagram (should render as SVG)

    ```mermaid
    flowchart LR
      A[User] --> B[SpecViewer]
      B --> C{language-mermaid?}
      C -- yes --> D[MermaidBlock]
      C -- no  --> E[Default <pre>]
      D --> F[SVG diagram]
    ```

    ## Broken diagram (should render the red error banner above this source)

    ```mermaid
    this is not valid mermaid syntax !!!
    ```

    ## End of fixture
    ````

    The valid diagram is a simple `flowchart LR` that exercises Mermaid's most common case (also useful as a worked example for future spec authors). The broken diagram has clearly invalid syntax that Mermaid's parser will reject — confirms the error-banner path works.

    Confirm `scripts/build-manifest.mjs` ignores this file: run `node scripts/build-manifest.mjs` and verify `app/src/manifest.json` still has only the dated entry (currently `2026-04-26.md`).
  </action>
  <verify>
    <automated>test -f project-spec/_phase2-mermaid-fixture.md && grep -q '```mermaid' project-spec/_phase2-mermaid-fixture.md && grep -q 'flowchart LR' project-spec/_phase2-mermaid-fixture.md && grep -q 'this is not valid mermaid' project-spec/_phase2-mermaid-fixture.md && node scripts/build-manifest.mjs && node -e "const m=require('./app/src/manifest.json'); const found = m.find(x => x.filename.startsWith('_')); if (found) { console.error('manifest leaked underscore file:', found); process.exit(1); } console.log('manifest clean:', m.length, 'entries');"</automated>
  </verify>
  <acceptance_criteria>
    - `project-spec/_phase2-mermaid-fixture.md` exists.
    - File contains at least two ` ```mermaid ` fence openers (one valid, one broken).
    - File contains the literal string `flowchart LR` (the valid diagram type).
    - File contains a deliberately-broken diagram block.
    - After running `node scripts/build-manifest.mjs`, `app/src/manifest.json` does NOT contain any entry whose filename starts with `_`.
    - `app/src/manifest.json[0].filename` remains `2026-04-26.md` (the dated spec — unchanged).
  </acceptance_criteria>
  <done>
    Fixture file exists with one valid + one broken diagram; build-manifest ignores it as designed; the dated spec remains the auto-loaded homepage.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Human verification — Mermaid pipeline works on fixture, lazy-load confirmed on dated spec</name>
  <files>(none — manual verification only)</files>
  <action>
    **What was built (before this checkpoint):**
- MermaidBlock React component with dynamic import, default light theme, securityLevel: 'strict', and parse-error banner.
    - CSS scaffolding for the diagram container and error banner.
    - Fixture file with one valid + one broken diagram for end-to-end verification.

    **How to verify (perform these steps in a browser):**
1. **Lazy-load check (current dated spec — zero mermaid blocks).**
       - Run `npm run dev` and open the URL in a browser.
       - Open DevTools → Network tab. Reload the page.
       - Confirm the network log does NOT include a request for the mermaid chunk (any file matching `mermaid*.js` should be absent from the requested resources). The chunk exists in `app/dist/assets/` after build but is only requested on demand.
       - Also confirm: no console errors, the spec renders normally.

    2. **Valid diagram renders as SVG (fixture).**
       - Temporarily rename `project-spec/_phase2-mermaid-fixture.md` to `project-spec/2099-01-01.md` so the build-manifest picks it as the newest file (the fake far-future date wins the sort).
       - Restart `npm run dev` (predev hook regenerates the manifest).
       - Refresh the browser. Confirm:
         - The header shows `Viewing: project-spec/2099-01-01.md`.
         - The first diagram renders as an SVG flowchart with the boxes and arrows described.
         - DevTools Network tab now shows a request for the mermaid chunk (filename matching `mermaid*.js`).
         - No console errors for the valid diagram.

    3. **Broken diagram shows red banner.**
       - Same fixture, scroll to the second mermaid block.
       - Confirm: a red banner reads `Mermaid parse error: ...` (some message — Mermaid's exact text is implementation-defined).
       - Below the banner, the original broken source is shown as a `<pre>` block.
       - The first (valid) diagram on the page is still rendered — one broken block does not break the page.

    4. **Cleanup.**
       - Rename `project-spec/2099-01-01.md` back to `project-spec/_phase2-mermaid-fixture.md`.
       - Restart `npm run dev`. The manifest re-resolves to `2026-04-26.md`. Confirm the spec viewer is back on the real dated spec and no mermaid chunk is requested.

    5. **Theme check (D-01).**
       - Inspect the SVG element in step 2 with DevTools.
       - Confirm none of its inline styles or attribute values contain the literal `#2c8d4f`. Phase 4 will inject that color via mermaid's `themeVariables` config; Phase 2 ships neutral.

    **Resume signal:** Type "approved" if all 5 checks pass, or describe which step failed and what was observed.
  </action>
  <verify>
    <automated>echo "checkpoint:human-verify — must be approved by human"; exit 0</automated>
  </verify>
  <done>
    User has performed the verification steps and typed "approved" (or described and resolved any failure).
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Spec author → Mermaid parser | Mermaid source comes from `project-spec/*.md`. Author is Sigurd / `update-spec.mjs`; not a public submission. |
| Mermaid SVG → DOM | Mermaid v10 with `securityLevel: 'strict'` produces SVG with sanitized labels (no inline `<script>`, no `onclick` handlers, no `javascript:` URLs in links). The SVG is injected via `dangerouslySetInnerHTML`. |
| npm registry → bundle | mermaid pulls a transitive dep (`d3`, etc., ~1.5MB ungzipped). Loaded only on demand. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-03-01 | Tampering | Diagram source → SVG output | mitigate | `mermaid.initialize({ securityLevel: 'strict' })` enforces label sanitization, blocks `<script>` in nodes, and disables `click` handler binding. Verified by acceptance criteria grep. |
| T-02-03-02 | Information Disclosure | `dangerouslySetInnerHTML` with mermaid SVG | mitigate | Tied to T-02-03-01: the SVG is sanitized by mermaid before injection. We do NOT call `dangerouslySetInnerHTML` with arbitrary user content — only with mermaid-produced SVG. |
| T-02-03-03 | Denial of Service | Pathological mermaid source (huge graph) | accept | Mermaid v10 has internal safeguards; a 10,000-node diagram would freeze the tab but the author would notice. The audience is internal (client + dev). Document but do not block. |
| T-02-03-04 | Tampering | Supply chain (mermaid + transitives) | accept | mermaid is an established CNCF-sandbox-adjacent project (~7M weekly downloads). Pinned to `^10`. `package-lock.json` locks transitive versions. |
| T-02-03-05 | Information Disclosure | Mermaid render error message in banner | accept | The error message is mermaid's own parser output. It echoes the source line/column but no sensitive data — diagram source is the spec content. |
| T-02-03-06 | Repudiation | Console errors on render failure | accept | The error UI surfaces the failure to the author (not silent). No audit trail required for a static viewer. |

ASVS L1 disposition: T-02-03-01 and T-02-03-02 are mitigated by `securityLevel: 'strict'`. The grep acceptance criterion enforces it. No high-severity threats remain.
</threat_model>

<verification>
- `rm -rf app/dist && npm run build` exits 0; build output includes a chunk matching `mermaid*.js` in `app/dist/assets/`.
- The freshly built entry chunk `app/dist/assets/index-*.js` does NOT contain the strings `flowchart` or `mermaidAPI` (lazy-load intact).
- The dated spec (`2026-04-26.md`) does NOT trigger a mermaid chunk fetch on page load (Task 3 step 1).
- The fixture's valid diagram renders as SVG; the broken diagram shows a red banner (Task 3 steps 2 + 3).
- No occurrence of literal `#2c8d4f` anywhere under `app/src/components/MermaidPre.{jsx,css}` (Task 3 step 5 + grep).
</verification>

<success_criteria>
1. Mermaid loads on demand only — confirmed by absence of mermaid chunk request when viewing the dated spec AND by the entry-chunk vocabulary audit.
2. Valid mermaid blocks render as SVG diagrams.
3. Broken mermaid blocks render the documented error banner above the original source.
4. Mermaid is initialized with `securityLevel: 'strict'`.
5. No brand color hard-coded; theming surface deferred to Phase 4 via `themeVariables` (which Phase 4 will set).
</success_criteria>

<output>
After completion, create `.planning/phases/02-rich-rendering/02-03-SUMMARY.md` documenting:
- Mermaid version installed (from package-lock.json).
- Confirmed chunk filename in `app/dist/assets/` and approximate gzipped size.
- Confirmation of the entry-chunk audit (no `flowchart`/`mermaidAPI` in `index-*.js`).
- Network-tab observation confirming no mermaid request on the dated spec.
- Note for Phase 4: the entry point for theming is `mermaid.initialize({ themeVariables: { ... } })`; Phase 4 may extend `loadMermaid` to read CSS custom properties at init.
</output>
