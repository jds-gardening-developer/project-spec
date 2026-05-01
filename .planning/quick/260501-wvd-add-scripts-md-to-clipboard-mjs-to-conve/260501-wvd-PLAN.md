---
phase: 260501-wvd
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/md-to-clipboard.mjs
  - package.json
autonomous: true
requirements:
  - QUICK-260501-WVD
must_haves:
  truths:
    - "Running `npm run md-to-clipboard` (no args) converts the latest dated file in project-spec/ to HTML and places it on the macOS clipboard as text/html"
    - "Running `node scripts/md-to-clipboard.mjs <file>` converts the given file (filename or full path) and copies it"
    - "Pasting the result into Google Docs yields formatted text (headings, bold, lists, tables) — not raw markdown"
    - "Script fails fast with a clear `console.error` + `process.exit(1)` if the file is missing, project-spec/ is empty, or the platform isn't macOS"
    - "Script ends with a numbered `Next steps:` block consistent with pull-doc.mjs / update-spec.mjs"
  artifacts:
    - path: "scripts/md-to-clipboard.mjs"
      provides: "CLI: markdown → HTML → macOS clipboard (text/html) for Google Docs paste"
      contains: "shebang, JSDoc header, ESM imports with node: prefix, top-level await, banner-style phase dividers, Next steps block"
      min_lines: 80
    - path: "package.json"
      provides: "npm run md-to-clipboard wired up"
      contains: "\"md-to-clipboard\": \"node scripts/md-to-clipboard.mjs\""
  key_links:
    - from: "scripts/md-to-clipboard.mjs (default-file phase)"
      to: "project-spec/ directory"
      via: "fs.readdirSync filtered by /^\\d{4}-\\d{2}-\\d{2}\\.md$/, sorted descending, [0]"
      pattern: "readdirSync.*project-spec"
    - from: "scripts/md-to-clipboard.mjs (render phase)"
      to: "marked"
      via: "import { marked } from 'marked'; const html = marked.parse(md, { gfm: true })"
      pattern: "marked\\.parse"
    - from: "scripts/md-to-clipboard.mjs (clipboard phase)"
      to: "macOS pasteboard"
      via: "spawn('osascript', ['-e', `set the clipboard to «data HTML${hexHtml}»`]) — pass HTML as hex-encoded «class HTML» so AppleScript treats it as rich HTML, not plain text"
      pattern: "osascript"
    - from: "package.json scripts"
      to: "scripts/md-to-clipboard.mjs"
      via: "npm run md-to-clipboard"
      pattern: "md-to-clipboard.*node scripts/md-to-clipboard.mjs"
---

<objective>
Add `scripts/md-to-clipboard.mjs`: a one-shot Node CLI that converts a project-spec markdown file to HTML and places it on the macOS clipboard as `text/html`, so it pastes into Google Docs as formatted text (headings, bold, lists, tables) rather than raw markdown.

Purpose: Round-trip workflow. `pull-doc.mjs` already pulls the canonical Google Doc *down* as markdown. This is the inverse — push a (possibly edited) markdown snapshot back *into* a Google Doc by pasting it as rich text. Saves the human from re-formatting headings and tables by hand when seeding a new Doc or refreshing one.

Output:
- New file `scripts/md-to-clipboard.mjs` mirroring the shape of `scripts/pull-doc.mjs`
- New entry in `package.json` scripts: `"md-to-clipboard": "node scripts/md-to-clipboard.mjs"`
- New dependency `marked` (chosen — see context below)
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/STATE.md
@scripts/pull-doc.mjs
@scripts/update-spec.mjs
@package.json

<library_choice>
**Library: `marked`** (https://www.npmjs.com/package/marked)

Why `marked` over the alternatives:
- This is a CLI script, not a React render path. We need string-in / string-out, no JSX, no React tree.
- `marked` is a single small dep (~30KB), zero transitive baggage, supports GFM (tables, strikethrough) via `{ gfm: true }`. Matches the project's existing GFM convention.
- `react-markdown` requires React + a synthetic renderer to materialise to a string — heavy and inappropriate for a Node CLI.
- The full `remark` / `unified` pipeline (`unified`, `remark-parse`, `remark-rehype`, `rehype-stringify`, `remark-gfm`) works but pulls in 5+ packages where one suffices. `marked` is the right size for a one-shot CLI.

Trade-off acknowledged: the Vite app uses `react-markdown` + `remark-gfm` — the renderer choice diverges between the runtime viewer and this offline tool. That's fine: same input language (GFM markdown), different output target (React tree vs HTML string for clipboard). The script doesn't need to match the viewer's rendering byte-for-byte; it just needs Google-Docs-pasteable HTML.

Install: `npm install marked` (adds to `dependencies`, not `devDependencies` — same convention as `mermaid`, `minisearch`, etc.).
</library_choice>

<clipboard_mechanism>
**macOS rich-HTML clipboard via `osascript`** (the reliable path).

`pbcopy` *can* take HTML if you craft a webarchive or use `pbcopy -Prefer txt` tricks, but the well-trodden cross-version method is AppleScript:

```applescript
set the clipboard to «data HTML48656C6C6F» -- hex-encoded HTML bytes, typed as «class HTML»
```

Implementation in Node:
1. Convert the HTML string to a hex byte sequence (UTF-8 → hex).
2. Spawn `osascript -e 'set the clipboard to «data HTML<HEX>»'`.
3. Check exit code; on non-zero, print stderr and exit 1.

Why hex `«data HTML…»` and not `set the clipboard to "<html>" as «class HTML»`:
- The `as «class HTML»` form requires the string to fit AppleScript string literal escaping — a 70KB spec with quotes, backticks, and Unicode breaks it.
- `«data HTML<hex>»` is a raw typed-data literal: bytes go in verbatim, no string escaping, no length limit in practice.

Pass the AppleScript via `-e` flag (single argv entry) using `child_process.spawn` (not `exec`, to avoid shell escaping issues). Use `node:child_process` with the `node:` prefix per project convention.

Platform check: if `process.platform !== "darwin"`, exit 1 with a clear message ("This script is macOS-only — it uses osascript to set the clipboard as text/html"). Do not try to be clever about Linux/Windows fallbacks.
</clipboard_mechanism>

<default_file_resolution>
- If `process.argv[2]` is provided:
  - If it's an existing path as-given (relative or absolute) → use it.
  - Else, try `path.join("project-spec", arg)` — allows `npm run md-to-clipboard 2026-04-30.md`.
  - If neither resolves → error + exit 1.
- If no arg:
  - `fs.readdirSync("project-spec")`, filter to `/^\d{4}-\d{2}-\d{2}\.md$/`, sort descending (lexicographic == chronological for ISO dates), pick `[0]`.
  - If the filtered list is empty → error + exit 1 ("No dated files in project-spec/ — pass a path explicitly").
- Resolve via `path.resolve(...)` for log clarity (mirrors update-spec.mjs:35).
</default_file_resolution>

<style_compliance>
Mirror `scripts/pull-doc.mjs` exactly for these:
- `#!/usr/bin/env node` shebang
- JSDoc header block: purpose, usage (no-arg + arg + npm), example
- ESM imports, `node:` prefix on built-ins (`node:fs`, `node:path`, `node:child_process`)
- Double quotes for strings, backticks only for interpolation/multi-line
- Top-level `await` (no `async function main()` wrapper)
- Banner comments: `// ---------- args ----------`, `// ---------- read ----------`, `// ---------- render ----------`, `// ---------- copy ----------`, `// ---------- done ----------`
- Pre-flight checks at top (platform, file existence, project-spec/ directory exists)
- `Label   : value` aligned progress logs (e.g. `Source file    : project-spec/2026-05-01.md`)
- `.toLocaleString()` for char counts, `.toFixed(1)` for elapsed seconds
- Numbered "Next steps:" block at the end
</style_compliance>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Install `marked` and add the npm script entry</name>
  <files>package.json, package-lock.json</files>
  <action>
Run from repo root: `npm install marked` (no version pin — npm picks current; `^X.Y.Z` will be written automatically). This adds `marked` to `dependencies` (not devDependencies — script is a runtime tool like `update-spec.mjs` uses `@anthropic-ai/sdk` from `dependencies`).

Then add to the `scripts` block in `package.json`, alphabetically between `dev:docsify` and the other `node scripts/*` entries (insert after `"build-schema-index"` for logical grouping with the other one-shot script tools):

```json
"md-to-clipboard": "node scripts/md-to-clipboard.mjs",
```

Final `scripts` block ordering should be: predev, dev, prebuild, build, preview, dev:docsify, build-manifest, build-search-index, build-schema-index, md-to-clipboard, update-spec, pull-doc, test. Do NOT reorder existing entries unnecessarily — only insert the new one in the alphabetical-ish neighbourhood of `pull-doc` / `update-spec` (those tools are siblings of this one).

Do not bump any other dep versions. Do not modify `engines`, `type`, `description`, etc.
  </action>
  <verify>
    <automated>node -e "const p = require('./package.json'); if (!p.scripts['md-to-clipboard']) { console.error('missing script'); process.exit(1); } if (!p.dependencies.marked) { console.error('marked not in deps'); process.exit(1); } console.log('ok');"</automated>
  </verify>
  <done>
- `marked` appears in `dependencies` of `package.json`
- `package-lock.json` updated
- `npm run md-to-clipboard` is a recognised script (will fail at runtime until Task 2 lands the file — that's fine; this task only wires the script entry)
- No other dep versions changed
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Write `scripts/md-to-clipboard.mjs`</name>
  <files>scripts/md-to-clipboard.mjs</files>
  <action>
Create `scripts/md-to-clipboard.mjs` with the structure below. Mirror `scripts/pull-doc.mjs` exactly for tone, banner style, and "Next steps" formatting. **Do not** add a try/catch around the osascript call — let failures bubble up as unhandled rejections (matches `update-spec.mjs` convention).

**Skeleton (use this as the structural template, fill in the bodies):**

```javascript
#!/usr/bin/env node
/**
 * md-to-clipboard.mjs
 * -------------------
 * Converts a project-spec markdown file to HTML and copies it to the macOS
 * clipboard as text/html, so it pastes into Google Docs as formatted text
 * (headings, bold, lists, tables) instead of raw markdown.
 *
 * Defaults to the newest dated file in project-spec/ (YYYY-MM-DD.md) if no
 * argument is given. Pass a filename or full path to override.
 *
 * Requires macOS — uses `osascript` to set the clipboard with the «class HTML»
 * pasteboard type. Exits 1 on Linux/Windows.
 *
 * Usage:
 *   node scripts/md-to-clipboard.mjs                       # latest dated file
 *   node scripts/md-to-clipboard.mjs 2026-04-30.md         # filename in project-spec/
 *   node scripts/md-to-clipboard.mjs path/to/file.md       # any path
 *
 * Example:
 *   npm run md-to-clipboard
 *   npm run md-to-clipboard -- 2026-04-30.md
 */

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { marked } from "marked";

// ---------- args ----------
// 1. Platform check: process.platform must be "darwin", else error+exit.
// 2. Resolve source path:
//    - argv[2] given? Try as-is, then path.join("project-spec", arg). First hit wins.
//    - argv[2] not given? Read project-spec/, filter /^\d{4}-\d{2}-\d{2}\.md$/, sort desc, take [0].
//    - Empty / unresolved → console.error + exit 1.
// 3. Final resolved path stored in `srcPath` (absolute via path.resolve).

// ---------- read ----------
// const md = fs.readFileSync(srcPath, "utf-8");
// console.log(`Source file    : ${path.relative(process.cwd(), srcPath)}`);
// console.log(`Source size    : ${md.length.toLocaleString()} chars`);

// ---------- render ----------
// marked.setOptions({ gfm: true, breaks: false }); // GFM tables/strikethrough; preserve paragraph breaks
// const html = marked.parse(md);
// console.log(`HTML size      : ${html.length.toLocaleString()} chars`);

// ---------- copy ----------
// Encode html (UTF-8) → hex string. Build AppleScript:
//   set the clipboard to «data HTML<HEX>»
// Spawn osascript -e <script>. Capture stderr. Await close event.
// Helper: hexEncode(str) → Buffer.from(str, "utf-8").toString("hex").toUpperCase()
//
// const startedAt = Date.now();
// const hex = Buffer.from(html, "utf-8").toString("hex").toUpperCase();
// const applescript = `set the clipboard to «data HTML${hex}»`;
//
// await new Promise((resolve, reject) => {
//   const child = spawn("osascript", ["-e", applescript]);
//   let stderr = "";
//   child.stderr.on("data", (chunk) => { stderr += chunk; });
//   child.on("error", reject);
//   child.on("close", (code) => {
//     if (code === 0) resolve();
//     else reject(new Error(`osascript exited ${code}: ${stderr.trim()}`));
//   });
// });
// const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

// ---------- done ----------
// console.log("");
// console.log(`Done in ${elapsed}s.`);
// console.log(`Clipboard now holds ${html.length.toLocaleString()} chars of text/html.`);
// console.log("");
// console.log("Next steps:");
// console.log("  1. Open the target Google Doc.");
// console.log("  2. Place the cursor where you want the content.");
// console.log("  3. Cmd+V (or Edit → Paste). Google Docs will paste as formatted text.");
// console.log("  4. If it pastes as plain text instead, paste with Cmd+Shift+V was used — try Cmd+V.");
```

**Implementation notes (must follow):**

- **Date-file regex**: `/^\d{4}-\d{2}-\d{2}\.md$/` — anchored, no captures needed.
- **Sort**: `.sort().reverse()` is fine; ISO dates lexicographically sort chronologically.
- **Path resolution for argv**: use `fs.existsSync(arg)` first (handles `./foo.md`, absolute, and bare relative). Only fall back to `path.join("project-spec", arg)` if the as-given path doesn't exist. This lets the user pass either `2026-04-30.md` (resolves to `project-spec/2026-04-30.md`) or `project-spec/2026-04-30.md` directly.
- **Empty-md guard**: if `md.length < 10`, error + exit 1 ("File is suspiciously small — refusing to copy").
- **No `process.chdir`** — script runs from the repo root by convention; assert by checking `fs.existsSync("project-spec")` in the args phase if needed.
- **AppleScript hex literal**: must be uppercase hex (lowercase works in practice but uppercase matches every Apple example and is the safer bet).
- **No `--help` flag, no flag parsing library** — match the simplicity of `pull-doc.mjs`. Only `--force` exists in pull-doc; we don't need any flag here.
- **Do NOT wrap in `try/catch`** — match `update-spec.mjs` convention; let osascript failures surface naturally. The `Promise.reject` from the close handler will surface as an unhandled rejection with the stderr message, which is what we want.

**Style mirroring (verify after writing):**
- Shebang on line 1
- JSDoc block lines 2-22ish
- All built-ins use `node:` prefix
- Banner comments are `// ---------- name ----------` (10 dashes each side)
- Logs use `Label    : value` shape with whitespace padding for column alignment (eyeball, don't measure)
- `Done in ${elapsed}s.` line, blank line, `Next steps:` block
  </action>
  <verify>
    <automated>node scripts/md-to-clipboard.mjs && osascript -e 'the clipboard as «class HTML»' | grep -qi 'html\|MacPlants\|PRD' && echo "clipboard contains HTML markup"</automated>
  </verify>
  <done>
- `scripts/md-to-clipboard.mjs` exists, executable bit not required (invoked via `node`)
- Running `node scripts/md-to-clipboard.mjs` with no args picks `project-spec/2026-05-01.md` (current latest), reports source size, HTML size, elapsed seconds, and prints the "Next steps" block
- After running, the macOS clipboard contains HTML — `osascript -e 'the clipboard as «class HTML»'` returns non-empty data with `<h1>` / `<h2>` / `<table>` markup
- Pasting into Google Docs (manual sanity check, not automated): yields formatted headings, bold text, and tables — not raw `## **PRD-1: ...**` markdown
- Running with an explicit arg `node scripts/md-to-clipboard.mjs 2026-04-30.md` picks that file
- Running with a bogus path `node scripts/md-to-clipboard.mjs nope.md` exits 1 with a clear error
- Running on a non-darwin platform (or simulated by reading the platform check branch) exits 1 with a clear macOS-only message
- File structurally mirrors `scripts/pull-doc.mjs`: shebang → JSDoc → imports → banner-style phases → "Next steps" block
  </done>
</task>

</tasks>

<verification>
Phase-level checks (run after both tasks complete):

1. `npm run md-to-clipboard` succeeds with exit code 0 and prints a `Done in Xs.` line.
2. `osascript -e 'the clipboard as «class HTML»'` returns non-empty bytes (HTML markup).
3. Manual paste into a Google Doc: headings render as headings, **bold** as bold, tables as tables. (Human-verifies; not blocking automation.)
4. `npm run md-to-clipboard -- 2026-04-30.md` picks the older snapshot.
5. `node -e "require('./package.json')"` succeeds (package.json still valid JSON).
6. `git diff --stat` shows changes only in: `scripts/md-to-clipboard.mjs` (new), `package.json`, `package-lock.json`.
</verification>

<success_criteria>
- New script file `scripts/md-to-clipboard.mjs` (~80-130 lines) following project ESM/CLI conventions
- New `marked` dependency in `package.json`
- New `md-to-clipboard` npm script entry
- Default behaviour: copies the newest dated file in `project-spec/` to the macOS clipboard as `text/html`
- Override behaviour: accepts a filename (resolved within `project-spec/`) or any path
- macOS-only with a clean error on other platforms
- Style matches `pull-doc.mjs` (banner comments, Label : value logs, Next steps hand-off)
- No other files changed
</success_criteria>

<output>
After completion, create `.planning/quick/260501-wvd-add-scripts-md-to-clipboard-mjs-to-conve/260501-wvd-SUMMARY.md` summarising:
- Files created / modified
- Library chosen and why (`marked`)
- Clipboard mechanism used (`osascript` + `«data HTML<hex>»`)
- Sample output of one successful run (the log lines)
- Manual paste-into-Google-Docs verification result
</output>
