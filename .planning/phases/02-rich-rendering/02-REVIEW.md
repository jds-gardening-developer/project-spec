---
phase: 02-rich-rendering
reviewed: 2026-04-26T22:30:00Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - app/src/SpecViewer.jsx
  - app/src/styles.css
  - app/src/components/CopyButton.css
  - app/src/components/CopyButton.jsx
  - app/src/components/CrossLinkText.css
  - app/src/components/CrossLinkText.jsx
  - app/src/components/MermaidPre.css
  - app/src/components/MermaidPre.jsx
  - app/src/components/Pre.jsx
  - app/src/components/SchemaTable.css
  - app/src/components/SchemaTable.helpers.js
  - app/src/components/SchemaTable.helpers.test.js
  - app/src/components/SchemaTable.jsx
  - app/src/components/crossLinkPlugin.js
  - app/src/components/crossLinkPlugin.test.js
  - package.json
findings:
  critical: 0
  warning: 4
  info: 6
  total: 10
status: issues_found
---

# Phase 2: Code Review Report

**Reviewed:** 2026-04-26T22:30:00Z
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

Phase 2 delivers five rendering enrichments cleanly: a remark cross-link plugin, click-time anchor resolution, dynamically-imported Mermaid rendering, schema-card detection for 3-column data-model tables, and a copy-to-clipboard button on fenced code blocks. The architecture is sound — JSX-free helpers are isolated for `node --test` consumption, CSS theming routes through Plan 01 custom properties, and default react-markdown sanitization is preserved (no `rehype-raw`, `securityLevel: 'strict'` on Mermaid).

No critical security or correctness defects. Four warnings flag bugs that affect runtime correctness in edge cases: a `setTimeout` leak after unmount in `CopyButton`, a too-loose `language-mermaid` substring match in `Pre`, an unescaped CSS attribute selector in `CrossLinkAnchor`, and a missing dependency on the dynamic `data-prd-id` prop name (kebab vs. camelCase) that should be defensively verified. Six info items cover minor robustness improvements.

The test suite (21 tests across `SchemaTable.helpers` and `crossLinkPlugin`) is well-targeted; the only gap is no end-to-end render test verifying that `data-prd-id` survives the react-markdown@9 → React props transform.

## Warnings

### WR-01: `setTimeout` callback fires after unmount in CopyButton

**File:** `app/src/components/CopyButton.jsx:36`
**Issue:** `setTimeout(() => setCopied(false), FEEDBACK_MS)` is created on every successful copy but never cleared. If the user navigates away (or the spec re-renders, swapping the DOM tree) within the 1500ms window, the callback runs `setCopied(false)` on an unmounted component. In React 18 strict mode this surfaces as a console warning ("Can't perform a React state update on an unmounted component"); in plain mode it leaks a tiny closure and is silently dropped. It also means a second copy that happens during the feedback window will reset the checkmark earlier than expected because both timers race.
**Fix:** Track the timer in a ref and clear it on unmount and on subsequent clicks:
```jsx
const timerRef = useRef(null);
const onClick = async (event) => {
  // ... existing guard ...
  try {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), FEEDBACK_MS);
  } catch (err) { warnUnavailableOnce(); }
};
useEffect(() => () => {
  if (timerRef.current) clearTimeout(timerRef.current);
}, []);
```

### WR-02: `language-mermaid` substring match is too loose in Pre.jsx

**File:** `app/src/components/Pre.jsx:38`
**Issue:** `cls.includes('language-mermaid')` will match any class string that contains the substring, including hypothetical hyphenated variants like `language-mermaidian` or `language-mermaidx`. While no language alias collides today, the more idiomatic remark/rehype check is a token-boundary match. This also affects the diagnostic interpretation — if the className has multiple language tokens, the first wins.
**Fix:** Tokenize on whitespace (or use a regex with word boundaries):
```jsx
const cls = getCodeChildClassName(children);
const tokens = cls.split(/\s+/);
if (tokens.includes('language-mermaid')) {
  return <MermaidBlock>{children}</MermaidBlock>;
}
```

### WR-03: Unescaped value interpolated into CSS attribute selector

**File:** `app/src/components/CrossLinkText.jsx:69`
**Issue:** `document.querySelector(\`[id^="${prdId}"]\`)` interpolates `prdId` directly into a CSS selector. The value originates from the remark plugin's `prdToAnchor()` (always `prd-N` or `prd-N-M`), so today this is safe. However, the contract is enforced only by an upstream invariant — there is no defensive validation here. If a future change to the plugin (or a third-party plugin in the same pipeline) ever produces a `data-prd-id` containing a quote, bracket, or backslash, this throws `SyntaxError: ... is not a valid selector` and silently breaks the click handler instead of falling back to the broken-link UI. The same value is also used unescaped in the `target.id` lookup result, but that's read-only.
**Fix:** Validate the shape before passing to `querySelector`, and prefer `getElementById` style lookup when the prefix is exact:
```jsx
const onClick = (event) => {
  event.preventDefault();
  let target = null;
  if (typeof document !== 'undefined' && /^prd-\d+(?:-\d+)?$/.test(prdId)) {
    target = document.querySelector(`[id^="${prdId}"]`);
  }
  if (!target) { warnOnce(prdId, children); setBroken(true); return; }
  // ...
};
```
Alternatively, use `CSS.escape(prdId)` if `CSS` is available.

### WR-04: `data-prd-id` prop access depends on react-markdown@9 attribute-passing convention

**File:** `app/src/components/CrossLinkText.jsx:37`
**Issue:** The remark plugin emits `hProperties: { 'data-prd-id': anchor, className: ['cross-link'] }`. This goes through `mdast-util-to-hast` → `hast-util-to-jsx-runtime` → React. In react-markdown@9, `data-*` properties are typically forwarded to React props in their original kebab-case form (`'data-prd-id'`), so `props['data-prd-id']` works. However, this relies on a versioned implementation detail of the toolchain — `hast-util-to-jsx-runtime` v2 has changed casing rules across minor versions, and there is no integration test in this phase verifying the round-trip. If the prop name is ever camelCased (`dataPrdId`), every cross-link silently degrades to "non-cross-link anchor" and renders as a plain `<a>` to `#prd-x-y` (which won't resolve because rehype-slug produces longer slugs). The bug would be invisible in unit tests because the plugin tests check the mdast node, not the React render path.
**Fix:** Read both forms defensively, and add an end-to-end render assertion. In `CrossLinkAnchor`:
```jsx
const prdId = props['data-prd-id'] ?? props.dataPrdId;
```
Add a render test (e.g. via `@testing-library/react` or a JSDOM `react-dom/server` smoke test) that mounts `<SpecViewer markdown="See (see PRD-1.1) here." />` and asserts at least one `<a class="cross-link">` is rendered with the expected behavior. This is the one missing safety net at the seam between the plugin and the React component layer.

## Info

### IN-01: Inline style on copy-button-wrapper bypasses CSS layer

**File:** `app/src/components/Pre.jsx:43`
**Issue:** `<div className="copy-button-wrapper" style={{ position: 'relative' }}>` puts a structural style in JSX. The `.copy-button-wrapper` class has no styles defined anywhere (no entry in `CopyButton.css` or `styles.css` for this selector), so the wrapper relies solely on the inline `position: relative`. This works but spreads the layout contract across two places (CSS for the absolutely-positioned button, JSX for its containing block) and would break a strict CSP that disallows inline styles.
**Fix:** Move the rule into `CopyButton.css` next to `.copy-button`:
```css
.copy-button-wrapper { position: relative; }
```
Then drop the inline `style={...}` from `Pre.jsx`.

### IN-02: `_warned` module-level flag in CopyButton is shared across all failure modes

**File:** `app/src/components/CopyButton.jsx:15`
**Issue:** `_warned` is a single boolean for the entire module. Both the "API unavailable" branch and the `catch` branch (browser refused, e.g. focus or permissions error) share it. Once any button triggers either path, no later button warns for any reason. Per D-16 ("silent on missing API") this is acceptable, but the warning text "clipboard API unavailable" is misleading when the actual cause was a permissions denial.
**Fix:** Either accept this and rename the warning text to something neutral ("clipboard copy failed"), or split into two flags and pass the underlying error message to the warner.

### IN-03: `useId()` sanitization could produce empty IDs in unfamiliar environments

**File:** `app/src/components/MermaidPre.jsx:57`
**Issue:** `useId()` currently returns values like `:r1:` in React 18, and the strip `replace(/[^a-zA-Z0-9-]/g, '')` yields `r1` — fine. But the regex would strip *all* characters from a hypothetical id consisting only of punctuation, leaving `safeId = 'mermaid-'`. Multiple instances would then collide on the same SVG id, which Mermaid uses internally. Today this never happens with React 18; flagged for forward-compatibility.
**Fix:** Append a fallback random suffix when the sanitized portion is empty:
```js
const sanitized = reactId.replace(/[^a-zA-Z0-9-]/g, '');
const safeId = 'mermaid-' + (sanitized || Math.random().toString(36).slice(2));
```

### IN-04: Module-level regex `lastIndex` state in crossLinkPlugin is fragile

**File:** `app/src/components/crossLinkPlugin.js:28,32`
**Issue:** `PRD_TOKEN` and `SEE_GROUP` are module-level `/g` regexes. The code correctly resets `lastIndex = 0` before each use (lines 73 and 92), so today's synchronous walk is safe. However, this pattern is a classic JS footgun — if a future refactor adds recursion (e.g. `splitTextNode` calling itself for nested text) or async iteration, the shared `lastIndex` will produce silent skips and missed matches. Idempotency test (Test 10) catches the simple case but not nested/concurrent invocations.
**Fix:** Construct fresh regex instances inside `splitTextNode` (V8 caches regex literals so the cost is negligible), or use `String.prototype.matchAll`:
```js
function splitTextNode(value) {
  const out = [];
  let lastIndex = 0;
  let foundAny = false;
  for (const groupMatch of value.matchAll(/\(see\s+(PRD-\d+(?:\.\d+)?(?:\s*,\s*PRD-\d+(?:\.\d+)?)*)\s*\)/g)) {
    // ... same logic, no lastIndex resets needed ...
  }
  if (!foundAny) return null;
  // ...
}
```

### IN-05: `readChildText` duplicated across SchemaTable.jsx and SchemaTable.helpers.js

**File:** `app/src/components/SchemaTable.jsx:55-61`
**Issue:** `readChildText` in `SchemaTable.jsx` is byte-for-byte identical to the private `readText` function in `SchemaTable.helpers.js:24-30`. The comment explains the duplication is intentional ("avoid pulling helpers into the render path for non-schema tables"). The helpers file *is* already imported by SchemaTable.jsx, so the stated rationale is moot — `readText` is part of the loaded module either way once `isSchemaHeader`/`extractHeaderCells` are imported. Tree-shaking does not apply here because the helpers file does not export `readText` (it's a closure-private function). Refactor cost is low.
**Fix:** Export `readText` from `SchemaTable.helpers.js` and import it in `SchemaTable.jsx`. Adjust tests if needed (this would also make `readText` directly testable):
```js
// helpers.js
export function readText(el) { /* ... */ }
// SchemaTable.jsx
import { readText, isSchemaHeader, /* ... */ } from './SchemaTable.helpers.js';
```

### IN-06: `npm test` glob misses tests in subdirectories

**File:** `package.json:19`
**Issue:** `node --test app/src/components/*.test.js` matches only files at one directory level. If Phase 3+ introduces a `app/src/components/<feature>/foo.test.js` or sibling `app/src/lib/*.test.js` files, they'll be silently skipped — no error, just zero coverage. The `node --test` runner natively supports recursion via `--test` with no path (defaults to `**/*.test.{js,mjs,cjs}` per Node 20 docs).
**Fix:** Switch to a recursive glob (Node 21+) or use the runner's default discovery:
```json
"test": "node --test --test-reporter=spec 'app/src/**/*.test.js'"
```
Or, on Node 20, list multiple directories explicitly. Add this when subdirectory tests are introduced; not blocking today.

---

_Reviewed: 2026-04-26T22:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
