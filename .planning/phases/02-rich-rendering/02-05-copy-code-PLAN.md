---
phase: 02-rich-rendering
plan: 05
type: execute
wave: 2
depends_on:
  - 02-01
files_modified:
  - app/src/components/Pre.jsx
  - app/src/components/CopyButton.jsx
  - app/src/components/CopyButton.css
  - project-spec/_phase2-codeblock-fixture.md
requirements:
  - REND-05
autonomous: false
must_haves:
  truths:
    - "Every fenced code block (except ```mermaid blocks) shows a copy button positioned top-right of the <pre>."
    - "Clicking the copy button writes the block's text content to the clipboard via navigator.clipboard.writeText."
    - "The button icon swaps from 'copy' to 'check' for 1500ms after a successful copy, then reverts."
    - "If navigator.clipboard is unavailable, the button does nothing visible AND emits a single console.warn naming the cause."
    - "Mermaid blocks (language-mermaid) do NOT get a copy button — they render as diagrams, not as readable code (D-13)."
    - "Inline `code` is unaffected — the button attaches to <pre> only."
  artifacts:
    - path: "app/src/components/CopyButton.jsx"
      provides: "CopyButton React component: navigator.clipboard.writeText, 1500ms checkmark feedback, silent + console.warn fallback."
      contains: "navigator.clipboard"
    - path: "app/src/components/CopyButton.css"
      provides: "Visual layout for the button (positioned top-right within a relative-positioned wrapper)."
    - path: "app/src/components/Pre.jsx"
      provides: "Updated dispatcher: language-mermaid → MermaidBlock; otherwise → wrapper div + CopyButton + <pre>."
      contains: "CopyButton"
    - path: "project-spec/_phase2-codeblock-fixture.md"
      provides: "Throwaway test fixture containing one bash, one json, and one mermaid fenced block — exercises the copy button on real fenced code AND the D-13 mermaid-exclusion rule. Filename starts with `_` so build-manifest's date regex never matches it."
  key_links:
    - from: "app/src/components/Pre.jsx"
      to: "app/src/components/CopyButton.jsx"
      via: "import { CopyButton } and render adjacent to <pre>"
      pattern: "import \\{ CopyButton \\}"
    - from: "app/src/components/CopyButton.jsx"
      to: "browser clipboard API"
      via: "navigator.clipboard.writeText(text)"
      pattern: "navigator\\.clipboard\\.writeText"
---

<objective>
Implement REND-05. Modify Plan 01's `Pre.jsx` dispatcher: in the non-mermaid branch, wrap the `<pre>` in a relative-positioned container and add a `<CopyButton>` next to it. Implement `CopyButton.jsx` with `navigator.clipboard.writeText`, a 1500ms icon swap from clipboard → checkmark → clipboard, and a silent + `console.warn` failure path when the clipboard API is unavailable (D-16).

Add a verification fixture (`project-spec/_phase2-codeblock-fixture.md`) containing at least one `bash` block, one `json` block, AND one `mermaid` block. The dated spec contains zero fenced code blocks (verified at planning time by `grep -c '^```' project-spec/2026-04-26.md` returning 0). Without a fixture there are no `<pre>` elements for the copy button to attach to and the human checkpoint cannot verify behavior. The mermaid block in the fixture also exercises the D-13 exclusion rule (no copy button on diagrams) — it simultaneously triggers Plan 03's MermaidBlock and proves Pre.jsx's dispatch decision.

Decisions implemented (per CONTEXT.md):
- D-13: copy button on all fenced blocks EXCEPT `language-mermaid`. Inline `code` excluded (only `pre`).
- D-14: always visible, top-right of the `<pre>`, low contrast.
- D-15: `navigator.clipboard.writeText`, 1500ms checkmark feedback, no toast / no tooltip.
- D-16: missing API → silent + `console.warn("[spec-viewer] clipboard API unavailable")`.
- D-19: button color from `--copy-button-color` and `--copy-button-color-success` (Plan 01 surface).

Purpose: Restore the copy-button parity the existing Docsify site has with `docsify-copy-code`. Conservative interaction (always visible, low contrast) keeps the spec readable for non-developer audiences (the MacPlants client).
Output: CopyButton component + CSS + Pre.jsx wired with the wrapper + fixture file.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/phases/02-rich-rendering/02-CONTEXT.md
@.planning/phases/02-rich-rendering/02-01-foundation-PLAN.md
@app/src/components/Pre.jsx
@app/src/styles.css
@scripts/build-manifest.mjs

<interfaces>
<!-- Plan 01 created Pre.jsx with the dispatcher logic:
     - if inner <code> has language-mermaid className → return <MermaidBlock>
     - else → return <pre>{children}</pre>
   Plan 05 modifies the else-branch to wrap <pre> in a container with a CopyButton.
   Plan 03 (mermaid) modifies MermaidPre.jsx ONLY — does not touch Pre.jsx.
   So Pre.jsx is touched by Plan 01 (creates) and Plan 05 (extends). No Wave-2 conflict. -->

react-markdown@9 fenced-block contract: each ```lang block produces:
  <pre><code className="language-lang">{rawSourceString}</code></pre>
The `<code>`'s `children` is a string (the source text, with trailing newline trimmed by the parser).
To copy the text content: read children → walk to find the <code>'s string children → join.

navigator.clipboard.writeText returns Promise<void>. Throws if the browser refuses (e.g. focus
constraints in some embed contexts) but typically resolves cleanly on HTTPS pages.

Build-manifest sorting (verified by reading `scripts/build-manifest.mjs`): the regex
`/^(\d{4}-\d{2}-\d{2})\.md$/` matches only `YYYY-MM-DD.md`. Underscore-prefixed files fall into
the `skipped` array and never enter `app/src/manifest.json`.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Implement CopyButton component (clipboard write + checkmark feedback + fallback)</name>
  <files>
    app/src/components/CopyButton.jsx,
    app/src/components/CopyButton.css
  </files>
  <read_first>
    - app/src/styles.css (confirm --copy-button-color, --copy-button-color-success, --copy-button-background present from Plan 01)
    - .planning/phases/02-rich-rendering/02-CONTEXT.md (D-14 always visible, D-15 1500ms feedback, D-16 silent + console.warn fallback)
  </read_first>
  <action>
    **Step A — Create `app/src/components/CopyButton.jsx`:**

    ```jsx
    import { useState } from 'react';
    import './CopyButton.css';

    /**
     * CopyButton — small button that copies a string to the clipboard via
     * navigator.clipboard.writeText. Shows a checkmark for 1500ms after success.
     *
     * D-14: always visible (no hover-only). D-15: 1500ms feedback. D-16: silent on missing API.
     *
     * Props:
     *   text: string — the content to copy (the <pre>'s textContent)
     */
    const FEEDBACK_MS = 1500;

    let _warned = false;
    function warnUnavailableOnce() {
      if (_warned) return;
      _warned = true;
      // eslint-disable-next-line no-console
      console.warn('[spec-viewer] clipboard API unavailable');
    }

    export function CopyButton({ text }) {
      const [copied, setCopied] = useState(false);

      const onClick = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (typeof navigator === 'undefined' || !navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
          warnUnavailableOnce();
          return;
        }
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), FEEDBACK_MS);
        } catch (err) {
          // Browser refused (focus constraints, permissions, etc). D-16 says silent + warn.
          warnUnavailableOnce();
        }
      };

      return (
        <button
          type="button"
          className={'copy-button' + (copied ? ' copy-button--copied' : '')}
          onClick={onClick}
          aria-label={copied ? 'Copied' : 'Copy code to clipboard'}
        >
          {copied ? <CheckIcon /> : <ClipboardIcon />}
        </button>
      );
    }

    /* Inline SVG icons — no extra dependency. Stroke-currentColor so CSS custom properties win. */

    function ClipboardIcon() {
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
          <rect x="4" y="2" width="8" height="2" rx="0.5" fill="currentColor" />
          <rect x="3" y="3" width="10" height="11" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </svg>
      );
    }

    function CheckIcon() {
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 8 L7 12 L13 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    ```

    **Step B — Create `app/src/components/CopyButton.css`:**

    ```css
    /* CopyButton — positioned by parent .copy-button-wrapper (defined in Pre.jsx scope below).
       Color values reference Plan 01 CSS custom properties. */

    .copy-button {
      position: absolute;
      top: 6px;
      right: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      padding: 0;
      border: 1px solid transparent;
      border-radius: 4px;
      background: var(--copy-button-background);
      color: var(--copy-button-color);
      cursor: pointer;
      opacity: 0.6;
      transition: opacity 120ms ease, color 120ms ease;
    }

    .copy-button:hover,
    .copy-button:focus-visible {
      opacity: 1;
      border-color: var(--copy-button-color);
      outline: none;
    }

    .copy-button--copied {
      color: var(--copy-button-color-success);
      opacity: 1;
    }

    .copy-button--copied:hover,
    .copy-button--copied:focus-visible {
      border-color: var(--copy-button-color-success);
    }
    ```

    No additional dependencies. Inline SVG icons keep the component self-contained.
  </action>
  <verify>
    <automated>grep -q "navigator.clipboard.writeText" app/src/components/CopyButton.jsx && grep -q "clipboard API unavailable" app/src/components/CopyButton.jsx && grep -q "console.warn" app/src/components/CopyButton.jsx && grep -q "1500" app/src/components/CopyButton.jsx && grep -q "import './CopyButton.css'" app/src/components/CopyButton.jsx && grep -q "var(--copy-button-color)" app/src/components/CopyButton.css && grep -q "var(--copy-button-color-success)" app/src/components/CopyButton.css && grep -q "var(--copy-button-background)" app/src/components/CopyButton.css && grep -q "position: absolute" app/src/components/CopyButton.css && echo "CopyButton ok"</automated>
  </verify>
  <acceptance_criteria>
    - `app/src/components/CopyButton.jsx` exports `CopyButton`.
    - Calls `navigator.clipboard.writeText` (literal substring).
    - Guards on `typeof navigator === 'undefined'` AND `!navigator.clipboard` AND `typeof navigator.clipboard.writeText !== 'function'`.
    - On guard failure, calls `console.warn` with literal text containing `clipboard API unavailable`.
    - On success, sets a state flag for 1500ms (literal `1500` appears in the source).
    - Button has class `copy-button` and adds `copy-button--copied` while in the success state.
    - Button has `type="button"` (don't submit forms accidentally).
    - Button has `aria-label` (accessibility).
    - `app/src/components/CopyButton.css` references `--copy-button-color`, `--copy-button-color-success`, `--copy-button-background`.
    - Position is absolute, top-right (top:6px / right:6px).
  </acceptance_criteria>
  <done>
    CopyButton renders a small icon button with copy/check states; success path triggers 1500ms feedback; failure path silently warns once.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Wire CopyButton into Pre.jsx and verify mermaid exclusion</name>
  <files>app/src/components/Pre.jsx</files>
  <read_first>
    - app/src/components/Pre.jsx (current Plan 01 dispatcher — about to be extended)
    - app/src/components/CopyButton.jsx (just created)
    - .planning/phases/02-rich-rendering/02-CONTEXT.md (D-13 mermaid excluded)
  </read_first>
  <action>
    Replace `app/src/components/Pre.jsx` entirely with this version. The change vs Plan 01 stub: the else-branch now wraps `<pre>` in a relative-positioned wrapper and adds the `CopyButton`.

    ```jsx
    /**
     * Pre — react-markdown <pre> override.
     *
     *   - language-mermaid → MermaidBlock (Plan 03 / REND-04)
     *   - else            → <div class="copy-button-wrapper"> + <CopyButton> + <pre>
     *
     * D-13 enforced: mermaid blocks render as diagrams, NOT as code-with-copy-button.
     * D-14: copy button is always visible, positioned top-right inside the wrapper.
     */
    import { MermaidBlock } from './MermaidPre.jsx';
    import { CopyButton } from './CopyButton.jsx';

    function getCodeChildClassName(children) {
      const arr = Array.isArray(children) ? children : [children];
      for (const child of arr) {
        if (child && child.props && typeof child.props.className === 'string') {
          return child.props.className;
        }
      }
      return '';
    }

    function getCodeText(children) {
      // The <pre>'s child is a <code> element; its children is the source string.
      const arr = Array.isArray(children) ? children : [children];
      for (const child of arr) {
        if (child && child.props && child.props.children !== undefined) {
          const inner = child.props.children;
          if (typeof inner === 'string') return inner;
          if (Array.isArray(inner)) return inner.filter((x) => typeof x === 'string').join('');
        }
      }
      return '';
    }

    export function Pre({ children, ...props }) {
      const cls = getCodeChildClassName(children);
      if (cls.includes('language-mermaid')) {
        return <MermaidBlock>{children}</MermaidBlock>;
      }
      const text = getCodeText(children);
      return (
        <div className="copy-button-wrapper" style={{ position: 'relative' }}>
          <CopyButton text={text} />
          <pre {...props}>{children}</pre>
        </div>
      );
    }
    ```

    The `style={{ position: 'relative' }}` inline style ensures the wrapper anchors the absolutely-positioned button. (We could move this to a CSS file, but Phase 4 will likely consolidate styles anyway and the inline style is a single declaration — acceptable.)

    Verify the build:
    ```
    npm run build
    ```
    must exit 0.

    Then manually inspect `app/src/components/Pre.jsx` to confirm:
    - The mermaid branch is unchanged from Plan 01 (just routes to MermaidBlock).
    - The non-mermaid branch wraps `<pre>` in the new container with CopyButton.
    - No new imports of mermaid (that's Plan 03's job).
  </action>
  <verify>
    <automated>grep -q "import { CopyButton } from './CopyButton.jsx'" app/src/components/Pre.jsx && grep -q "import { MermaidBlock } from './MermaidPre.jsx'" app/src/components/Pre.jsx && grep -q "language-mermaid" app/src/components/Pre.jsx && grep -q "copy-button-wrapper" app/src/components/Pre.jsx && grep -q "<CopyButton text=" app/src/components/Pre.jsx && grep -q "position: 'relative'" app/src/components/Pre.jsx && npm run build 2>&1 | tail -5</automated>
  </verify>
  <acceptance_criteria>
    - `app/src/components/Pre.jsx` imports both `MermaidBlock` and `CopyButton`.
    - Mermaid branch still uses `language-mermaid` className check.
    - Non-mermaid branch wraps `<pre>` in a `<div className="copy-button-wrapper" style={{position: 'relative'}}>` containing `<CopyButton text={...}>` AND `<pre>`.
    - The CopyButton's `text` prop is derived from the `<code>` child's children (the raw source string).
    - `npm run build` exits 0.
  </acceptance_criteria>
  <done>
    Pre.jsx dispatches mermaid blocks to MermaidBlock and wraps non-mermaid blocks in a copy-button container. The build passes.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Add fenced-code-block verification fixture</name>
  <files>project-spec/_phase2-codeblock-fixture.md</files>
  <read_first>
    - scripts/build-manifest.mjs (confirm the regex `/^(\d{4}-\d{2}-\d{2})\.md$/` will NOT match a filename starting with `_`)
    - .planning/phases/02-rich-rendering/02-CONTEXT.md (D-13 mermaid excluded, D-14 visibility, D-15 feedback)
  </read_first>
  <action>
    The dated spec (`project-spec/2026-04-26.md`) contains zero fenced code blocks (verified at planning time by `grep -c '^```' project-spec/2026-04-26.md` returning 0). Without fenced blocks, the copy button never instantiates and Task 4's checkpoint cannot be performed against the dated spec. Mirror the fixture pattern used by Plan 02 (cross-link) and Plan 03 (mermaid).

    Create `project-spec/_phase2-codeblock-fixture.md` with this exact content:

    ````markdown
    # Code-Block Pipeline Fixture (Phase 2 verification)

    This file is NOT part of the dated spec. The leading underscore keeps build-manifest's
    `^YYYY-MM-DD.md$` regex from matching it, so it never appears in the manifest and never
    auto-loads. It exists so a human can verify the copy-code pipeline (REND-05) end-to-end
    AND the D-13 mermaid-exclusion rule.

    To use:
      1. Run `npm run dev`.
      2. Temporarily rename this file to `2099-01-02.md` so the manifest picks it as the
         newest snapshot. Restart `npm run dev` (the predev hook regenerates the manifest).
      3. Refresh the browser. The header should now read `Viewing: project-spec/2099-01-02.md`.
      4. Perform the checks described in Task 4 of 02-05-copy-code-PLAN.md.
      5. Rename the file back to `_phase2-codeblock-fixture.md` and restart `npm run dev`.

    ## Bash block (must show a copy button)

    ```bash
    # Restart the dev server after editing the fixture
    npm run dev

    # Build for production
    npm run build
    ```

    ## JSON block (must show a copy button)

    ```json
    {
      "name": "macplants-erp-spec",
      "private": true,
      "scripts": {
        "dev": "vite --config app/vite.config.js"
      }
    }
    ```

    ## Mermaid block (must NOT show a copy button — D-13)

    ```mermaid
    flowchart LR
      A[fenced bash] --> B[Pre.jsx]
      B --> C{language-mermaid?}
      C -- no --> D[CopyButton + pre]
      C -- yes --> E[MermaidBlock]
    ```

    ## Inline `code` (must NOT show a copy button — D-13 attaches only to <pre>)

    Inline references like `npm run dev` or `navigator.clipboard.writeText` should appear as
    monospaced text without any copy-button affordance.

    ## End of fixture
    ````

    The fixture intentionally exercises every D-13 / D-14 / D-15 rule:
    - Bash and JSON blocks show the copy button (D-14 visible, D-15 click → checkmark for 1500ms).
    - The mermaid block is dispatched to `MermaidBlock` and renders as an SVG diagram WITHOUT a copy button (D-13).
    - Inline backtick code receives no copy button (Pre.jsx attaches to `<pre>` only).

    Verify `scripts/build-manifest.mjs` ignores this file:
    ```
    node scripts/build-manifest.mjs
    ```
    Then read `app/src/manifest.json` and confirm the underscore file is absent and the dated entry (`2026-04-26.md`) is unchanged at index 0. Note that Plan 02 and Plan 03 also add underscore-prefixed fixtures (`_phase2-cross-link-fixture.md`, `_phase2-mermaid-fixture.md`); the build-manifest scan correctly skips all three because none match the `YYYY-MM-DD.md` regex.
  </action>
  <verify>
    <automated>test -f project-spec/_phase2-codeblock-fixture.md && grep -q '```bash' project-spec/_phase2-codeblock-fixture.md && grep -q '```json' project-spec/_phase2-codeblock-fixture.md && grep -q '```mermaid' project-spec/_phase2-codeblock-fixture.md && grep -q 'flowchart LR' project-spec/_phase2-codeblock-fixture.md && node scripts/build-manifest.mjs && node -e "const m=require('./app/src/manifest.json'); const found = m.find(x => x.filename.startsWith('_')); if (found) { console.error('manifest leaked underscore file:', found); process.exit(1); } if (m[0].filename !== '2026-04-26.md') { console.error('manifest top entry changed unexpectedly:', m[0]); process.exit(1); } console.log('manifest clean:', m.length, 'entries; top:', m[0].filename);"</automated>
  </verify>
  <acceptance_criteria>
    - `project-spec/_phase2-codeblock-fixture.md` exists.
    - File contains all three fence types: at least one ` ```bash `, one ` ```json `, and one ` ```mermaid ` block.
    - The mermaid block contains a syntactically-valid `flowchart LR` so it renders as a real diagram (not as an error banner).
    - File contains at least one inline backtick reference for the inline-exclusion check.
    - After running `node scripts/build-manifest.mjs`, `app/src/manifest.json` does NOT contain any entry whose filename starts with `_`.
    - `app/src/manifest.json[0].filename` remains `2026-04-26.md` — the dated spec is unchanged as the auto-loaded homepage.
  </acceptance_criteria>
  <done>
    Fixture file exists exercising every fenced-code case (bash, json, mermaid, inline); build-manifest ignores it as designed; the dated spec remains the auto-loaded homepage.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 4: Human verification — Copy buttons appear and work, mermaid blocks excluded</name>
  <files>(none — manual verification only)</files>
  <action>
    **What was built (before this checkpoint):**
- CopyButton component with clipboard write, 1500ms checkmark feedback, silent + console.warn fallback.
    - Pre.jsx dispatcher updated to wrap non-mermaid <pre> blocks with CopyButton, while routing language-mermaid blocks to MermaidBlock unchanged.
    - Fixture file with bash, json, mermaid, and inline-code cases for end-to-end verification.

    **How to verify (perform these steps in a browser):**
1. **Activate the fixture.** Rename `project-spec/_phase2-codeblock-fixture.md` to `project-spec/2099-01-02.md` so build-manifest picks it as the newest snapshot. (Pick a date strictly later than any other fixture currently activated — `01-02` keeps it distinct from Plan 02's and Plan 03's `01-01` choices.)
    2. Run (or restart) `npm run dev` and open the URL in a browser. The header should read `Viewing: project-spec/2099-01-02.md`.
    3. **Bash block — copy button is visible.** Scroll to the bash block. Confirm a small copy-icon button appears at its top-right corner. The button is low-contrast (about 60% opacity) and becomes more prominent on hover.
    4. **Bash block — copy works.** Click the button. Confirm:
       - The icon changes to a checkmark.
       - After ~1.5 seconds, it changes back to the clipboard icon.
       - Open a text editor and paste — the clipboard contains the exact bash source (with newlines and the `# comment` lines preserved).
    5. **JSON block — same behavior.** Repeat the visibility + copy check on the JSON block. Pasted clipboard content must include the literal `{` and `}` braces, key-value pairs, and indentation.
    6. **Mermaid block DOES NOT get a copy button (D-13).** Scroll to the mermaid block. Confirm:
       - The block renders as an SVG flowchart (Plan 03's MermaidBlock).
       - There is NO copy-icon button anywhere on or around the diagram.
       - The original mermaid source text is NOT visible (replaced by the rendered diagram).
    7. **Inline `code` is unaffected.** Find the paragraph containing `npm run dev` and `navigator.clipboard.writeText` in inline backticks. Confirm there is NO copy button on the inline code — only on `<pre>` blocks.
    8. **Fallback path.** Open DevTools → Console. Run this snippet to simulate a clipboard-API-unavailable browser:
       ```
       const orig = navigator.clipboard;
       Object.defineProperty(navigator, 'clipboard', {value: undefined, configurable: true});
       ```
       Then click any copy button. Confirm:
       - Nothing visible happens (no checkmark, no error toast).
       - Console shows exactly one warning containing `clipboard API unavailable`.
       - Click the same button again — no second warning (deduped per page-load).
       Restore: `Object.defineProperty(navigator, 'clipboard', {value: orig, configurable: true});`
    9. **No console errors** during normal use (the deliberate clipboard-disable in step 8 produces a warning, not an error).
    10. **Cleanup.** Rename `project-spec/2099-01-02.md` back to `project-spec/_phase2-codeblock-fixture.md`. Restart `npm run dev`. Confirm the spec viewer is back on the real dated `2026-04-26.md` (no fenced code blocks, no copy buttons — and that's expected).

    **Resume signal:** Type "approved" if all checks pass, or describe which check failed and what was observed.
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
| Spec author → clipboard | Code-block source is copied verbatim to the user's clipboard on click. The spec author controls the content; the clipboard write is initiated by the user. |
| `navigator.clipboard` API | Browser-managed permissions surface. Requires HTTPS on Netlify (already enforced) or `localhost` in dev. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-05-01 | Tampering | clipboard write | mitigate | `navigator.clipboard.writeText(text)` writes only the literal string of the code block. No `eval`, no script injection, no `document.execCommand` legacy paths. The `text` is computed from React children — if React's escaping is breached, that's a React bug, not a CopyButton bug. |
| T-02-05-02 | Information Disclosure | Reading clipboard | n/a | The button only WRITES the clipboard. It never reads. No `navigator.clipboard.readText` is called. |
| T-02-05-03 | Denial of Service | Many CopyButtons on a page | accept | Each button is a tiny React component (~50 lines + an SVG). Mounting 50 of them costs <1ms. Memory negligible. |
| T-02-05-04 | Repudiation | console.warn on missing API | accept | Warning is local to the user's console. No logs persisted, no telemetry. Acceptable for a static viewer. |
| T-02-05-05 | Spoofing | Click event from a script | accept | A page script could programmatically click any button — but this is a static viewer with no user-submitted scripts. The whole site is trusted code. |

ASVS L1 disposition: T-02-05-01 is mitigated by using only `writeText` and trusting React's text escaping. No high-severity threats.
</threat_model>

<verification>
- `npm run build` exits 0.
- Grep checks pass for navigator.clipboard.writeText, the warn message, and the wrapper structure in Pre.jsx.
- Browser checkpoint confirms button visibility, copy success, mermaid exclusion, inline-code exclusion, and fallback warn (Task 4).
- Build-manifest skips the underscore-prefixed fixture; the dated spec is still the homepage.
</verification>

<success_criteria>
1. Copy button appears top-right of every non-mermaid `<pre>` in the rendered fixture.
2. Click → text copied to clipboard, icon swaps to checkmark for 1500ms.
3. Mermaid blocks do not get a copy button (D-13 verified against the live fixture diagram).
4. Inline `code` is unaffected.
5. Missing clipboard API → silent + single console.warn (D-16 verified).
6. All button colors come from CSS custom properties; Phase 4 can rebrand without touching this plan's files.
</success_criteria>

<output>
After completion, create `.planning/phases/02-rich-rendering/02-05-SUMMARY.md` documenting:
- Confirmation that Pre.jsx is the only file shared with Plan 01 (and that Plan 03 didn't touch it — verify by `git log --oneline app/src/components/Pre.jsx`).
- The three CSS custom properties consumed by CopyButton (Phase 4 hand-off surface).
- Confirmation that the underscore-prefixed fixture is excluded from `app/src/manifest.json`.
- Note for Phase 4: the button currently uses neutral grey + green-success. Phase 4 may want to adopt MacPlants green for the success state (override `--copy-button-color-success`).
</output>
