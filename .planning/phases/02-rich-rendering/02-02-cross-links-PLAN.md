---
phase: 02-rich-rendering
plan: 02
type: execute
wave: 2
depends_on:
  - 02-01
files_modified:
  - app/src/components/crossLinkPlugin.js
  - app/src/components/crossLinkPlugin.test.js
  - app/src/components/CrossLinkText.jsx
  - app/src/components/CrossLinkText.css
  - project-spec/_phase2-cross-link-fixture.md
requirements:
  - REND-02
autonomous: false
must_haves:
  truths:
    - "User can click a `(see PRD-X.Y)` reference in body text and the page scrolls smoothly to the matching PRD heading."
    - "Cross-link detection runs only on text nodes outside fenced code, inline code, and headings."
    - "When the target PRD is missing at click time, the link swaps in place to a dimmed span with a `title` tooltip and a single console.warn — no broken navigation."
    - "After clicking a cross-link, `location.hash` reflects the target so the URL is shareable (Phase 3 will consume this on initial load)."
    - "Comma-separated cross-link lists like `(see PRD-1, PRD-3.4)` produce two distinct links, each scrolling to its own target."
  artifacts:
    - path: "app/src/components/crossLinkPlugin.js"
      provides: "Real remark plugin: walks text nodes, splits on (see PRD-X.Y) pattern, replaces matched segments with `link` mdast nodes pointing to `#prd-x-y`."
      contains: "see\\\\s+PRD"
    - path: "app/src/components/crossLinkPlugin.test.js"
      provides: "10 node:test cases covering detection, list expansion, skip rules, and idempotency. Pure JS — no JSX, no React imports."
    - path: "app/src/components/CrossLinkText.jsx"
      provides: "CrossLinkAnchor component: always renders <a>; on click, resolves target via querySelector and either scrollIntoView+hash-update OR swaps element to dimmed span + console.warn."
      contains: "scrollIntoView"
    - path: "app/src/components/CrossLinkText.css"
      provides: "Anchor + dimmed-span styling using --cross-link-color and --cross-link-broken-color."
    - path: "project-spec/_phase2-cross-link-fixture.md"
      provides: "Throwaway test fixture exercising single, decimal, comma-separated, and broken cross-references. Filename starts with `_` so build-manifest's `^YYYY-MM-DD.md$` regex skips it."
  key_links:
    - from: "app/src/components/crossLinkPlugin.js"
      to: "remark mdast tree"
      via: "manual recursion over `children` arrays, mutating in place"
      pattern: "type\\s*===\\s*'text'|type:\\s*'link'"
    - from: "app/src/components/CrossLinkText.jsx"
      to: "DOM heading with id starting with prd-x-y"
      via: "click-time document.querySelector with prefix match per D-05"
      pattern: "querySelector|getElementById"
    - from: "app/src/components/CrossLinkText.jsx"
      to: "browser scroll API"
      via: "element.scrollIntoView({behavior:'smooth'}) per D-07"
      pattern: "scrollIntoView"
---

<objective>
Implement REND-02. Replace the Plan 01 stubs in `crossLinkPlugin.js` and `CrossLinkText.jsx` with the real cross-link rewriter and click-time anchor resolver. Add a small `CrossLinkText.css` for visual states (active link color, dimmed broken-link span). Add a test fixture (`project-spec/_phase2-cross-link-fixture.md`) so the human checkpoint has live cross-references to click — the dated `2026-04-26.md` spec contains zero `(see PRD-X.Y)` parenthesized references, so without the fixture there is nothing to verify against.

Decisions implemented (per CONTEXT.md):
- D-04: detect `(see PRD-X)` and `(see PRD-X.Y)` literally, including comma-separated lists. Skip text inside `code` / `inlineCode` / `heading` parents. Bare `PRD-X.Y` (no `see` prefix) is NOT linked.
- D-05: targets resolved via prefix match `[id^="prd-x-y"]` against the rehype-slug-generated heading IDs (rehype-slug already wired in Plan 01).
- D-06: missing target → at click time, swap the element in place to a dimmed `<span>` with a `title` tooltip + emit a single `console.warn` per missing id.
- D-07: click → `preventDefault()` + `scrollIntoView({behavior:'smooth', block:'start'})` + update `location.hash` via `history.replaceState`.
- D-18: implementation route — **custom remark plugin**.

**Click-time-only resolution.** An earlier draft of this plan resolved the target during render via `document.querySelector(...)`. That fails on first paint because the heading nodes have not been committed to the DOM yet — the query returns `null` for every cross-link, so every link would render as broken. Plan 02 instead always renders an `<a>` on first paint and only checks for the target inside the click handler. The broken-link UX surfaces precisely when the user attempts navigation, which matches D-06's intent ("visible to the author during review without breaking the read for the client").

Purpose: Make every PRD cross-reference navigable in one click. This is the single most-requested win over Docsify.
Output: A functioning cross-link system + a fixture file demonstrating the behavior; no other Phase 2 feature affected.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/phases/02-rich-rendering/02-CONTEXT.md
@.planning/phases/02-rich-rendering/02-01-foundation-PLAN.md
@app/src/SpecViewer.jsx
@app/src/components/crossLinkPlugin.js
@app/src/components/CrossLinkText.jsx
@app/src/styles.css
@project-spec/2026-04-26.md
@scripts/build-manifest.mjs

<interfaces>
<!-- Plan 01 already wired remarkPlugins=[remarkGfm, remarkCrossLinks] and components.a=CrossLinkAnchor in SpecViewer.jsx. -->
<!-- Plan 02 modifies the bodies of those two stub files, adds a sibling CSS file, adds a test file, and adds a fixture file. -->
<!-- Plan 01 already added `npm test` to package.json — Plan 02 does NOT modify package.json. -->

The mdast `text` node has the shape `{type: 'text', value: '... (see PRD-1.1) ...'}`.
A replacement `link` node has the shape:
```
{
  type: 'link',
  url: '#prd-1-1',                       // hash; CrossLinkAnchor reads `href` from this
  title: null,
  children: [{type: 'text', value: 'PRD-1.1'}],
  data: {
    hProperties: {
      className: ['cross-link'],         // for CSS targeting
      'data-prd-id': 'prd-1-1',          // makes CrossLinkAnchor's job easier
    }
  }
}
```

In react-markdown@9, `components.a` receives `{href, children, className, ...rest}` as props (and `node` for the hast node). A node-level `data-*` attribute on the hast properties is forwarded as a kebab-cased HTML attribute; `data-prd-id` becomes accessible as `props['data-prd-id']`.

`unist-util-visit` ships transitively with remark-gfm but using it would require an additional import. Plan 02 walks the tree manually using a small recursive function — ~15 lines, zero new deps.

Build-manifest sorting (verified by reading `scripts/build-manifest.mjs`): the regex `/^(\d{4}-\d{2}-\d{2})\.md$/` only matches filenames that are exactly `YYYY-MM-DD.md`. Files starting with `_` (like `_phase2-cross-link-fixture.md`) fall into the `skipped` array and never appear in `app/src/manifest.json`. The dated spec remains the auto-loaded homepage.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Implement remark cross-link plugin (RED→GREEN cycle)</name>
  <files>
    app/src/components/crossLinkPlugin.js,
    app/src/components/crossLinkPlugin.test.js
  </files>
  <read_first>
    - app/src/components/crossLinkPlugin.js (current stub from Plan 01)
    - .planning/phases/02-rich-rendering/02-CONTEXT.md (D-04 detection rules, D-18 plugin choice)
    - project-spec/2026-04-26.md — confirm by grep that the dated spec has zero `(see PRD-` parenthesized references: `grep -nE '\(see PRD-' project-spec/2026-04-26.md` returns no lines. Plan 02 therefore relies on the fixture file (Task 3) for end-to-end verification rather than the dated spec.
  </read_first>
  <behavior>
    - Test 1: `(see PRD-1)` in a paragraph → produces one `link` node with `url: '#prd-1'` and child text `PRD-1`.
    - Test 2: `(see PRD-1.1)` → one `link` node with `url: '#prd-1-1'` and child text `PRD-1.1`.
    - Test 3: `(see PRD-1, PRD-3.4)` → two `link` nodes (`#prd-1`, `#prd-3-4`) separated by a literal text node containing `, `.
    - Test 4: surrounding parentheses and the literal word `see` are NOT consumed into the link text — they remain as text nodes around the link(s) so the visible output is `(see `, `<a>PRD-1.1</a>`, `)`.
    - Test 5: `PRD-1.1` without the `(see ` prefix is NOT linked (left as plain text).
    - Test 6: a `text` node inside a `code` node is left untouched (the plugin must skip code parents).
    - Test 7: a `text` node inside an `inlineCode` node is left untouched.
    - Test 8: a `text` node inside a `heading` node is left untouched.
    - Test 9: bare `PRD-XX` (placeholder — used in `PRD-XX: DPD Shipping Integration`) inside a heading is left untouched (covered by Test 8).
    - Test 10: idempotency — running the plugin twice on the same tree yields the same result (no double-linking). Use a deep-cloned input: run plugin once, capture the result; run plugin a second time on the once-mutated tree; deep-equal the second-run result against the first-run result.
  </behavior>
  <action>
    **Step A — Write the test first (RED).** Create `app/src/components/crossLinkPlugin.test.js` using Node's built-in `node:test` (Plan 01 already added the `npm test` script targeting `app/src/components/*.test.js`). Use a minimal mdast literal as input and `node:assert/strict`:

    ```js
    import { test } from 'node:test';
    import assert from 'node:assert/strict';
    import remarkCrossLinks from './crossLinkPlugin.js';

    function runPlugin(tree) {
      const transform = remarkCrossLinks();
      transform(tree);
      return tree;
    }

    function paragraph(value) {
      return { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', value }] }] };
    }

    test('Test 1: single (see PRD-1) becomes a link', () => {
      const tree = paragraph('Foo (see PRD-1) bar.');
      runPlugin(tree);
      const para = tree.children[0];
      // Expect: text "Foo (see ", link[PRD-1], text ") bar."
      assert.equal(para.children.length, 3);
      assert.equal(para.children[0].type, 'text');
      assert.equal(para.children[0].value, 'Foo (see ');
      assert.equal(para.children[1].type, 'link');
      assert.equal(para.children[1].url, '#prd-1');
      assert.equal(para.children[1].children[0].value, 'PRD-1');
      assert.equal(para.children[2].type, 'text');
      assert.equal(para.children[2].value, ') bar.');
    });

    // ... Tests 2–9 follow the same shape ...

    test('Test 10: idempotency — running plugin twice yields the same tree', () => {
      const input = paragraph('See (see PRD-1.1) and (see PRD-3.4).');
      // First run: deep-clone so we can compare structure later.
      const onceTree = JSON.parse(JSON.stringify(input));
      runPlugin(onceTree);
      const oneRunSnapshot = JSON.parse(JSON.stringify(onceTree));
      // Second run: feed the once-mutated tree back through the plugin.
      runPlugin(onceTree);
      assert.deepEqual(onceTree, oneRunSnapshot, 'second pass should produce identical structure');
    });
    ```

    All ten tests must be present as named test blocks (`Test 1: …`, `Test 2: …`, … `Test 10: …`).

    Run `npm test` and confirm tests **fail** (the stub plugin is a no-op).

    **Step B — Implement the plugin (GREEN).** Replace the body of `app/src/components/crossLinkPlugin.js`:

    ```js
    /**
     * remarkCrossLinks — rewrites inline `(see PRD-X)` and `(see PRD-X.Y)` references
     * in body text into mdast `link` nodes pointing at `#prd-x-y` anchors.
     *
     * Detection rule (CONTEXT.md D-04):
     *   - Match the literal sequence `see PRD-N` or `see PRD-N.M` after an opening paren
     *     and before either a comma+space (continuation) or a closing paren / end of group.
     *   - Comma-separated lists like `(see PRD-1, PRD-3.4)` produce multiple links.
     *   - Bare PRD-X.Y (no `see` prefix) is NOT linked — avoids false positives in headings/tables.
     *   - Skip text nodes whose ancestor chain includes a `code`, `inlineCode`, or `heading` parent.
     *
     * Anchor format (D-05): `#prd-X-Y` (lowercase, dot replaced with dash). rehype-slug
     * generates heading IDs like `prd-1-1-plant-variants`; the anchor is a prefix match
     * resolved at click time by CrossLinkText.jsx.
     */

    // Match a single PRD identifier inside the comma-list:  `PRD-1` or `PRD-3.4`. Capture the digits.
    const PRD_TOKEN = /PRD-(\d+(?:\.\d+)?)/g;
    // Match the surrounding `(see ... )` group. Capture the inner list of identifiers.
    // Non-greedy on the inner group; tolerate spaces around commas.
    const SEE_GROUP = /\(see\s+(PRD-\d+(?:\.\d+)?(?:\s*,\s*PRD-\d+(?:\.\d+)?)*)\s*\)/g;

    const SKIP_PARENT_TYPES = new Set(['code', 'inlineCode', 'heading']);

    function shouldSkip(ancestors) {
      for (const a of ancestors) {
        if (SKIP_PARENT_TYPES.has(a.type)) return true;
      }
      return false;
    }

    function prdToAnchor(token) {
      // 'PRD-1.1' -> 'prd-1-1'; 'PRD-3' -> 'prd-3'
      return token.toLowerCase().replace(/\./g, '-');
    }

    function buildLinkNode(token) {
      const anchor = prdToAnchor(token);
      return {
        type: 'link',
        url: '#' + anchor,
        title: null,
        children: [{ type: 'text', value: token }],
        data: {
          hProperties: {
            className: ['cross-link'],
            'data-prd-id': anchor,
          },
        },
      };
    }

    function splitTextNode(value) {
      // Returns an array of mdast nodes (text and/or link) representing `value` after
      // cross-link substitution. If no matches, returns null to signal "leave as-is".
      SEE_GROUP.lastIndex = 0;
      const out = [];
      let lastIndex = 0;
      let groupMatch;
      let foundAny = false;
      while ((groupMatch = SEE_GROUP.exec(value)) !== null) {
        foundAny = true;
        const [fullGroup, inner] = groupMatch;
        const groupStart = groupMatch.index;
        const groupEnd = groupStart + fullGroup.length;

        // Text BEFORE this group, plus the literal `(see ` prefix of the group itself.
        // The group regex consumed `(see <inner>)` — we keep `(see ` and `)` as plain text
        // and only convert the PRD tokens inside `inner` into links + commas.
        const prefixEnd = value.indexOf(inner, groupStart);
        const beforeText = value.slice(lastIndex, prefixEnd); // ends with `(see ` (with trailing space)
        if (beforeText.length > 0) out.push({ type: 'text', value: beforeText });

        // Walk the inner list, capturing each PRD token and the literal commas/spaces between them.
        PRD_TOKEN.lastIndex = 0;
        let innerLast = 0;
        let tokenMatch;
        while ((tokenMatch = PRD_TOKEN.exec(inner)) !== null) {
          const sep = inner.slice(innerLast, tokenMatch.index);
          if (sep.length > 0) out.push({ type: 'text', value: sep });
          out.push(buildLinkNode(tokenMatch[0]));
          innerLast = tokenMatch.index + tokenMatch[0].length;
        }
        const trailingInner = inner.slice(innerLast);
        if (trailingInner.length > 0) out.push({ type: 'text', value: trailingInner });

        // Emit the closing `)` of the group as plain text.
        const afterInnerStart = prefixEnd + inner.length;
        const closing = value.slice(afterInnerStart, groupEnd);
        if (closing.length > 0) out.push({ type: 'text', value: closing });

        lastIndex = groupEnd;
      }
      if (!foundAny) return null;
      const tail = value.slice(lastIndex);
      if (tail.length > 0) out.push({ type: 'text', value: tail });
      return out;
    }

    function walk(node, ancestors) {
      if (!node || !node.children) return;
      const next = ancestors.concat(node);
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (child.type === 'text' && !shouldSkip(next)) {
          const replacement = splitTextNode(child.value);
          if (replacement !== null) {
            node.children.splice(i, 1, ...replacement);
            i += replacement.length - 1;
          }
        } else if (child.children) {
          walk(child, next);
        }
      }
    }

    export default function remarkCrossLinks() {
      return function transform(tree) {
        walk(tree, []);
        return tree;
      };
    }
    ```

    **Step C — Run the tests (GREEN).** `npm test` — all 10 tests must pass. If a test fails, fix the implementation; do not weaken the test.

    **Step D — Commit RED then GREEN as separate commits** following the TDD convention:
    1. `test(02-02): add failing tests for cross-link plugin` (commit only the test file initially)
    2. `feat(02-02): implement remark cross-link plugin` (commit the plugin implementation that makes tests pass)
  </action>
  <verify>
    <automated>npm test 2>&1 | tail -30</automated>
  </verify>
  <acceptance_criteria>
    - `app/src/components/crossLinkPlugin.test.js` exists with at least 10 `test(...)` blocks named `Test 1:` through `Test 10:` corresponding to the 10 behaviors above.
    - Test 10 explicitly deep-clones the input, captures the once-run result, runs the plugin a second time on the once-mutated tree, and `assert.deepEqual`s the second-run result against the first-run snapshot.
    - `npm test` runs `node --test` and exits 0 with all cross-link tests passing.
    - `app/src/components/crossLinkPlugin.js` defines and exports a default function whose returned transformer mutates the tree in place.
    - `app/src/components/crossLinkPlugin.js` references the literal pattern `PRD-` and contains a regex that matches both `PRD-N` and `PRD-N.M`.
    - `app/src/components/crossLinkPlugin.js` skips `code`, `inlineCode`, and `heading` parents (grep for those three strings as a `Set` or array).
    - `app/src/components/crossLinkPlugin.js` does NOT match bare `PRD-X.Y` (no surrounding `(see ...)`).
  </acceptance_criteria>
  <done>
    Tests RED → GREEN. The plugin correctly rewrites cross-link patterns into link nodes with proper anchors, respects the skip list, and is idempotent. Two commits land documenting the TDD cycle.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Implement CrossLinkAnchor component (click-time resolution + broken-link fallback)</name>
  <files>
    app/src/components/CrossLinkText.jsx,
    app/src/components/CrossLinkText.css
  </files>
  <read_first>
    - app/src/components/CrossLinkText.jsx (current stub from Plan 01)
    - app/src/styles.css (to confirm --cross-link-color and --cross-link-broken-color are present from Plan 01)
    - .planning/phases/02-rich-rendering/02-CONTEXT.md (D-05 prefix-match anchor strategy, D-06 broken-link fallback, D-07 click behavior)
  </read_first>
  <action>
    **Step A — Replace `app/src/components/CrossLinkText.jsx` with this exact content:**

    ```jsx
    import { useState } from 'react';
    import './CrossLinkText.css';

    /**
     * CrossLinkAnchor — react-markdown <a> override.
     *
     * Strategy (D-05, D-06, D-07):
     *   - First render: ALWAYS render a real <a>. We do not query the DOM during render
     *     because on first paint the heading nodes have not been committed yet, so a
     *     querySelector check would return null for every cross-link and the page would
     *     show every reference as broken until the user clicks somewhere to trigger a
     *     re-render. Click-time resolution is correct on every render path.
     *
     *   - On click:
     *       1. preventDefault() so the browser does not jump-and-reload the hash.
     *       2. document.querySelector(`[id^="${prdId}"]`) — prefix match per D-05.
     *       3a. If found: scrollIntoView({behavior: 'smooth', block: 'start'}) and update
     *           location.hash via history.replaceState (D-07).
     *       3b. If NOT found: setBroken(true). The component re-renders as a dimmed <span>
     *           with a `title` tooltip. Emit one console.warn per missing prdId (deduped
     *           across the page via a module-level Set).
     *
     *   - Non-cross-link anchors (no data-prd-id; e.g. external https:// URLs in the
     *     markdown — none in today's spec, but possible later) pass through as a normal
     *     <a> with target="_blank" and rel="noopener noreferrer".
     *
     * Identification: the remark plugin attaches `data-prd-id="prd-x-y"` to every cross-link
     * node. Presence of that attribute distinguishes our links from any other anchors.
     */
    export function CrossLinkAnchor(props) {
      const { href, children, className, node, ...rest } = props;
      const prdId = props['data-prd-id'];
      const [broken, setBroken] = useState(false);

      // Branch 1 — non-cross-link anchor (no data-prd-id). Pass through with safe defaults.
      if (!prdId) {
        const isExternal = typeof href === 'string' && /^https?:/.test(href);
        if (isExternal) {
          return (
            <a href={href} className={className} target="_blank" rel="noopener noreferrer" {...rest}>
              {children}
            </a>
          );
        }
        return <a href={href} className={className} {...rest}>{children}</a>;
      }

      // Branch 2 — cross-link with broken state (D-06). Render dimmed span; no nav.
      if (broken) {
        return (
          <span
            className={(className ? className + ' ' : '') + 'cross-link cross-link--broken'}
            title={`${labelText(children)} not found in current spec`}
          >
            {children}
          </span>
        );
      }

      // Branch 3 — cross-link active. Always render <a>; resolve at click time.
      const onClick = (event) => {
        event.preventDefault();
        const target = typeof document !== 'undefined'
          ? document.querySelector(`[id^="${prdId}"]`)
          : null;
        if (!target) {
          // D-06: missing target → swap in place to broken UI + warn once.
          warnOnce(prdId, children);
          setBroken(true);
          return;
        }
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const hash = '#' + target.id;
        if (typeof window !== 'undefined' && window.location.hash !== hash) {
          // Use replaceState to avoid spamming browser history on every click.
          window.history.replaceState(null, '', hash);
        }
      };

      return (
        <a
          href={href}
          className={(className ? className + ' ' : '') + 'cross-link'}
          onClick={onClick}
          {...rest}
        >
          {children}
        </a>
      );
    }

    // ---- helpers ----

    const _warned = new Set();
    function warnOnce(prdId, children) {
      if (_warned.has(prdId)) return;
      _warned.add(prdId);
      // eslint-disable-next-line no-console
      console.warn(`[spec-viewer] cross-link: ${labelText(children)} not found`);
    }

    function labelText(children) {
      // children is typically the text "PRD-1.1" wrapped by react-markdown.
      if (typeof children === 'string') return children;
      if (Array.isArray(children)) {
        return children.map(labelText).join('');
      }
      if (children && children.props && children.props.children) {
        return labelText(children.props.children);
      }
      return 'PRD reference';
    }
    ```

    Key change vs the earlier draft: the broken-link UX is **gated on a `useState` flag flipped by the click handler**, not on a render-time DOM query. On first paint every cross-link renders as a clickable `<a>`. The first click for a missing target swaps the element to its broken span and the user sees the dimmed UX from that point forward. This is correct under React StrictMode double-rendering and under any rendering order — the DOM is always queried after the heading nodes have been committed.

    **Step B — Create `app/src/components/CrossLinkText.css`:**

    ```css
    /* Cross-link styles. Color values use CSS custom properties declared in styles.css
       (Plan 01 surface). Phase 4 overrides those custom properties for brand theming. */

    .cross-link {
      color: var(--cross-link-color);
      text-decoration: none;
      border-bottom: 1px dotted var(--cross-link-color);
      cursor: pointer;
    }

    .cross-link:hover {
      text-decoration: underline;
    }

    .cross-link--broken {
      color: var(--cross-link-broken-color);
      cursor: not-allowed;
      border-bottom: 1px dotted var(--cross-link-broken-color);
      opacity: 0.7;
    }
    ```

    No other files change in this task. The remark plugin from Task 1 already attaches `data-prd-id` and `className: ['cross-link']` so the styling and click handler hook in correctly.
  </action>
  <verify>
    <automated>grep -q "scrollIntoView" app/src/components/CrossLinkText.jsx && grep -q "preventDefault" app/src/components/CrossLinkText.jsx && grep -q "querySelector" app/src/components/CrossLinkText.jsx && grep -q "data-prd-id" app/src/components/CrossLinkText.jsx && grep -q "console.warn" app/src/components/CrossLinkText.jsx && grep -q "history.replaceState\|location.hash" app/src/components/CrossLinkText.jsx && grep -q "cross-link--broken" app/src/components/CrossLinkText.jsx && grep -q "useState" app/src/components/CrossLinkText.jsx && grep -q "setBroken" app/src/components/CrossLinkText.jsx && grep -q "import './CrossLinkText.css'" app/src/components/CrossLinkText.jsx && grep -q "var(--cross-link-color)" app/src/components/CrossLinkText.css && grep -q "var(--cross-link-broken-color)" app/src/components/CrossLinkText.css && npm run build 2>&1 | tail -5</automated>
  </verify>
  <acceptance_criteria>
    - `app/src/components/CrossLinkText.jsx` exports `CrossLinkAnchor`.
    - `CrossLinkAnchor` does NOT call `document.querySelector` during render — the call lives only inside the click handler.
    - `CrossLinkAnchor` calls `event.preventDefault()` and `target.scrollIntoView({behavior: 'smooth', block: 'start'})` (per D-07).
    - `CrossLinkAnchor` resolves targets via `document.querySelector('[id^="..."]')` (per D-05 prefix match) inside the click handler.
    - `CrossLinkAnchor` updates `location.hash` (or uses `history.replaceState`) on successful click.
    - `CrossLinkAnchor` distinguishes cross-links from other anchors via the `data-prd-id` prop.
    - When the click-time resolution fails, `CrossLinkAnchor` flips a `useState` flag (`broken`) and re-renders as a `<span>` with class `cross-link--broken` and a `title` attribute, AND emits exactly one `console.warn` per missing PRD id (deduped via module Set).
    - `app/src/components/CrossLinkText.css` exists and references both `--cross-link-color` and `--cross-link-broken-color`.
    - `npm run build` exits 0.
    - The CSS is imported into the JSX file (`import './CrossLinkText.css'`).
  </acceptance_criteria>
  <done>
    On first paint every `(see PRD-X.Y)` reference renders as a clickable link. Clicking a valid reference scrolls smoothly to the matching PRD heading and updates the URL. Clicking a missing reference swaps that element in place to a dimmed span with a tooltip and emits a single console warning per id. External-URL anchors (when present) get safe `target="_blank" rel="noopener noreferrer"` defaults.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Add cross-link verification fixture</name>
  <files>project-spec/_phase2-cross-link-fixture.md</files>
  <read_first>
    - scripts/build-manifest.mjs (confirm the regex `/^(\d{4}-\d{2}-\d{2})\.md$/` will NOT match a filename starting with `_`)
    - .planning/phases/02-rich-rendering/02-CONTEXT.md (D-04 detection, D-06 broken-link fallback)
    - project-spec/2026-04-26.md (skim for real PRD heading IDs that rehype-slug will produce — e.g. PRD-1, PRD-3.4 are present as headings)
  </read_first>
  <action>
    The dated spec contains zero `(see PRD-X.Y)` parenthesized references (verified at planning time by `grep -nE '\(see PRD-' project-spec/2026-04-26.md` returning no lines). Without a fixture there is nothing to click in Task 4's human verification. Mirror Plan 03's mermaid-fixture pattern: ship a non-dated markdown file under `project-spec/` whose underscore-prefix keeps it out of the manifest.

    Create `project-spec/_phase2-cross-link-fixture.md` with this exact content:

    ````markdown
    # Cross-Link Pipeline Fixture (Phase 2 verification)

    This file is NOT part of the dated spec. The leading underscore keeps build-manifest's
    `^YYYY-MM-DD.md$` regex from matching it, so it never appears in the manifest and never
    auto-loads. It exists so a human can verify the cross-link pipeline (REND-02) end-to-end
    against valid AND broken targets.

    To use:
      1. Run `npm run dev`.
      2. Temporarily rename this file to `2099-01-01.md` so the manifest picks it as the
         newest snapshot. Restart `npm run dev` (the predev hook regenerates the manifest).
      3. Refresh the browser. The header should now read `Viewing: project-spec/2099-01-01.md`.
      4. Perform the click checks (see Task 4 of 02-02-cross-links-PLAN.md).
      5. Rename the file back to `_phase2-cross-link-fixture.md` and restart `npm run dev`.

    ## PRD-1: Sample Section

    First sample heading. Used as a cross-link target.

    ## PRD-3.4: Decimal Section

    Second sample heading. Used as a cross-link target for the decimal form.

    ## Cross-link cases (click each one)

    1. Single ref — see (see PRD-1) — should scroll up to the "PRD-1: Sample Section" heading.
    2. Decimal ref — see (see PRD-3.4) — should scroll up to "PRD-3.4: Decimal Section".
    3. Comma-separated list — see (see PRD-1, PRD-3.4) — should produce two separate links;
       clicking the first scrolls to PRD-1, clicking the second scrolls to PRD-3.4.
    4. Broken ref — see (see PRD-99) — no target heading exists. First click swaps the link
       to a dimmed span with a `title` tooltip; the browser console shows exactly one
       `[spec-viewer] cross-link: PRD-99 not found` warning.

    ## Negative cases (must NOT become links)

    - Bare reference outside parens: PRD-1 should NOT be linked (no `(see ` prefix).
    - Inside inline code: `(see PRD-1)` inside backticks should NOT be linked.
    - Inside a fenced code block:

    ```text
    The string (see PRD-1) inside a fenced block must NOT be rewritten.
    ```

    - Inside a heading: see PRD-XX in the next heading.

    ### PRD-XX placeholder heading (must NOT auto-link)

    The heading text above contains `PRD-XX`. The plugin must NOT touch heading text.

    ## End of fixture
    ````

    The fixture intentionally exercises every D-04 rule: single ref, decimal ref, comma-list, broken target, bare-token negative, inline-code negative, fenced-code negative, heading negative.

    Verify `scripts/build-manifest.mjs` ignores this file:
    ```
    node scripts/build-manifest.mjs
    ```
    Then read `app/src/manifest.json` and confirm the underscore file is absent and the dated entry (`2026-04-26.md`) is unchanged at index 0.
  </action>
  <verify>
    <automated>test -f project-spec/_phase2-cross-link-fixture.md && grep -q '(see PRD-1)' project-spec/_phase2-cross-link-fixture.md && grep -q '(see PRD-3.4)' project-spec/_phase2-cross-link-fixture.md && grep -q '(see PRD-1, PRD-3.4)' project-spec/_phase2-cross-link-fixture.md && grep -q '(see PRD-99)' project-spec/_phase2-cross-link-fixture.md && node scripts/build-manifest.mjs && node -e "const m=require('./app/src/manifest.json'); const found = m.find(x => x.filename.startsWith('_')); if (found) { console.error('manifest leaked underscore file:', found); process.exit(1); } if (m[0].filename !== '2026-04-26.md') { console.error('manifest top entry changed unexpectedly:', m[0]); process.exit(1); } console.log('manifest clean:', m.length, 'entries; top:', m[0].filename);"</automated>
  </verify>
  <acceptance_criteria>
    - `project-spec/_phase2-cross-link-fixture.md` exists.
    - File contains all four cross-link cases: single `(see PRD-1)`, decimal `(see PRD-3.4)`, comma-separated `(see PRD-1, PRD-3.4)`, broken `(see PRD-99)`.
    - File contains at least one negative case inside a fenced ` ```text ` block.
    - File contains at least one PRD-N heading whose slug rehype-slug will resolve (so the click handler can find a target).
    - After running `node scripts/build-manifest.mjs`, `app/src/manifest.json` does NOT contain any entry whose filename starts with `_`.
    - `app/src/manifest.json[0].filename` remains `2026-04-26.md` — the dated spec is unchanged as the auto-loaded homepage.
  </acceptance_criteria>
  <done>
    Fixture file exists exercising every cross-link case; build-manifest ignores it as designed; the dated spec remains the auto-loaded homepage.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 4: Human verification — click cross-links in the running viewer</name>
  <files>(none — manual verification only)</files>
  <action>
    **What was built (before this checkpoint):**
- Cross-link remark plugin that rewrites `(see PRD-X.Y)` text into clickable links.
    - CrossLinkAnchor component with click-time target resolution, scroll-and-hash on hit, swap-to-dimmed-span on miss.
    - Visual styling for cross-links and dimmed broken-link spans.
    - Test fixture with valid and broken cross-references.

    **How to verify (perform these steps in a browser):**
1. **Activate the fixture.** Rename `project-spec/_phase2-cross-link-fixture.md` to `project-spec/2099-01-01.md` so build-manifest picks it as the newest snapshot.
    2. Run (or restart) `npm run dev`. Note the port Vite picks (likely 5173).
    3. Open the URL in a browser. The header should read `Viewing: project-spec/2099-01-01.md`.
    4. **Single ref.** Click the linked text "PRD-1" inside `(see PRD-1)`. Confirm: page scrolls smoothly to the "PRD-1: Sample Section" heading and the URL bar shows `#prd-1...`.
    5. **Decimal ref.** Scroll back, click "PRD-3.4" inside `(see PRD-3.4)`. Confirm: smooth scroll to PRD-3.4 heading; URL shows `#prd-3-4...`.
    6. **Comma-separated list.** In `(see PRD-1, PRD-3.4)` confirm there are TWO distinct linked tokens. Click each independently and confirm each navigates to its own heading.
    7. **Broken ref.** Click "PRD-99" inside `(see PRD-99)`. Confirm:
       - The link transforms in place to a dimmed span (greyed out, "not-allowed" cursor, dotted underline in `--cross-link-broken-color`).
       - Hovering shows a tooltip "PRD-99 not found in current spec".
       - The browser console shows exactly ONE warning containing `[spec-viewer] cross-link: PRD-99 not found`.
       - Clicking the now-dimmed span does nothing further (no navigation).
    8. **Negative checks.**
       - The bare token `PRD-1` (without `(see `) appears as plain text, not a link.
       - The string `(see PRD-1)` inside the fenced ` ```text ` block appears as monospaced text, not a link.
       - The text inside the `### PRD-XX placeholder heading` heading is NOT linked.
    9. **No console errors** (warnings from the broken case are expected; errors are not).
    10. **Cleanup.** Rename `project-spec/2099-01-01.md` back to `project-spec/_phase2-cross-link-fixture.md`. Restart `npm run dev`. Confirm the spec viewer is back on the real dated `2026-04-26.md` with no broken-link warnings on the dated spec (the dated spec contains no parenthesized cross-references).

    **Resume signal:** Type "approved" if all checks pass, or describe which step failed and what was observed.
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
| Spec author → mdast tree | The plugin sees text content from `project-spec/*.md`. Trust posture: semi-trusted (author is Sigurd / `update-spec.mjs`; not a public submission path). |
| mdast tree → DOM | The plugin produces `link` nodes with `href` set to a hash like `#prd-1-1`. The `href` is constructed from the matched PRD token (digits only) — no user-controlled scheme like `javascript:` is possible because the regex captures only `PRD-\d+(?:\.\d+)?`. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-02-01 | Tampering | `crossLinkPlugin.js` href construction | mitigate | The constructed `url` is `'#' + token.toLowerCase().replace(/\\./g, '-')`. The token regex only matches `PRD-\\d+(?:\\.\\d+)?`. Result: only digits and dashes can appear in the hash. No `javascript:`, no `data:`, no scheme injection. Verified by Test 1–3 in Task 1. |
| T-02-02-02 | Information Disclosure | `console.warn` for missing targets | accept | The warning includes the PRD identifier (e.g. `PRD-3.4`) — not user data. The spec is public. No exfiltration. |
| T-02-02-03 | Tampering | `document.querySelector` with prefix selector | mitigate | The selector is `[id^="..."]` where the value comes from the same constrained regex above. CSS-attribute selector escaping is not required for `[a-z0-9-]` content. To be defensive, the implementation should still treat the prdId as opaque — it does, never concatenating user input into innerHTML or eval. |
| T-02-02-04 | Denial of Service | Plugin walks tree on every render | mitigate | Walk is O(N) over mdast nodes. The 70KB spec produces ~thousands of nodes; walk completes in <50ms on commodity hardware. react-markdown caches the parsed tree per render — performance acceptable. |
| T-02-02-05 | Elevation of Privilege | Click handler executing JS | n/a | Click handler only calls `scrollIntoView` and `history.replaceState` — both are inert browser APIs. No `eval`, no dynamic script tags, no message passing. |

ASVS L1 disposition: T-02-02-01 and T-02-02-03 are mitigated by the regex constraint; the others are accepted with documented rationale. No high-severity threats.
</threat_model>

<verification>
- `npm test` passes (10+ cross-link plugin tests, including idempotency Test 10 with deep-clone equality).
- `npm run build` exits 0; bundle size delta is small (~1–2KB gz for the new plugin + component).
- Visual spot-check confirms cross-links scroll on click and broken refs swap to dimmed spans on first click (Task 4 checkpoint).
- No new top-level dependency added beyond what Plan 01 installed.
- Build-manifest skips the underscore-prefixed fixture; the dated spec is still the homepage.
</verification>

<success_criteria>
1. The remark plugin correctly rewrites `(see PRD-X)` and `(see PRD-X.Y)` text into link nodes, including comma-separated forms.
2. The plugin skips text inside code, inline code, and headings, and is idempotent.
3. CrossLinkAnchor renders `<a>` on first paint and resolves the target only at click time.
4. On a successful click, the page scrolls smoothly and `location.hash` is updated.
5. On a missing target, the link swaps in place to a dimmed `<span>` with `title` tooltip and exactly one console.warn per id.
6. The fixture file exists and is excluded from the build manifest.
7. The user can confirm via the browser checkpoint that every D-04 rule is honored on the fixture.
</success_criteria>

<output>
After completion, create `.planning/phases/02-rich-rendering/02-02-SUMMARY.md` documenting:
- Test count and pass status (including idempotency Test 10).
- Concrete behavior observed in the browser (scroll target, hash update, broken-link swap).
- Confirmation that build-manifest still ignores the underscore-prefixed fixture and the dated spec remains the homepage.
- Confirmation that this plan modified ONLY its five owned files (plugin + test + jsx + css + fixture).
</output>
