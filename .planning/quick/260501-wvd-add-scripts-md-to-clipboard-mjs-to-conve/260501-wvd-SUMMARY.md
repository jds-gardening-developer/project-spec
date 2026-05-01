---
phase: 260501-wvd
plan: 01
subsystem: tooling
tags: [cli, clipboard, markdown, html, macos, google-docs]
dependency-graph:
  requires:
    - scripts/pull-doc.mjs (structural template)
    - scripts/update-spec.mjs (style conventions)
  provides:
    - npm run md-to-clipboard
    - scripts/md-to-clipboard.mjs (markdown -> rich-HTML -> macOS clipboard)
  affects:
    - package.json (new script entry + dep)
    - package-lock.json (new dep tree)
tech-stack:
  added:
    - marked@^18.0.3 (GFM markdown -> HTML string renderer)
  patterns:
    - osascript with «data HTML<hex>» raw typed-data literal for rich-HTML clipboard
    - Hex-encoded UTF-8 bytes via Buffer.from(html, "utf-8").toString("hex")
    - child_process.spawn (no shell escaping) for AppleScript invocation
    - Banner-comment phase dividers (`// ---------- name ----------`)
    - Top-level await + ESM-only (no async wrapper, no try/catch around spawn)
key-files:
  created:
    - scripts/md-to-clipboard.mjs
  modified:
    - package.json
    - package-lock.json
decisions:
  - "marked over react-markdown / unified-remark stack: smallest single-dep CLI fit"
  - "osascript «data HTML<hex>» over pbcopy and over `as «class HTML»` string form: handles 70KB+ payloads with quotes/Unicode without AppleScript string-literal escaping"
  - "macOS-only (process.platform !== 'darwin' fails fast); no Linux/Windows fallbacks"
  - "Default file resolution: newest YYYY-MM-DD.md in project-spec/ via readdirSync + descending sort"
metrics:
  duration: ~3 min
  completed: 2026-05-01
---

# Quick Task 260501-wvd: Add `scripts/md-to-clipboard.mjs` to Convert Markdown -> macOS Clipboard Summary

One-liner: New `scripts/md-to-clipboard.mjs` CLI converts the latest project-spec markdown file to GFM HTML and places it on the macOS clipboard as `text/html` (via osascript `«data HTML<hex>»`), so it pastes into Google Docs as formatted text — closing the round-trip with `pull-doc.mjs`.

## Files Created / Modified

| File | Status | Purpose |
| ---- | ------ | ------- |
| `scripts/md-to-clipboard.mjs` | **created** (118 lines) | CLI: markdown -> HTML -> macOS clipboard |
| `package.json` | modified | added `marked` dep, added `md-to-clipboard` script entry |
| `package-lock.json` | modified | new dep tree for `marked` |

## Library Choice — `marked`

Picked `marked@^18.0.3` for these reasons:
- One package, no transitive baggage. The `unified` / `remark-parse` / `remark-rehype` / `rehype-stringify` / `remark-gfm` chain works but pulls in 5+ packages where one suffices.
- String-in / string-out API — `marked.parse(md)` returns the HTML string directly. No React renderer to materialise (`react-markdown` requires React + a synthetic renderer to produce a string, which is wrong for a Node CLI).
- GFM tables and strikethrough via `{ gfm: true }` — matches the project's Data Model table convention.
- Bundle size irrelevant here (CLI only); the trade-off vs the Vite app's `react-markdown` choice is acceptable because the input language is the same (GFM markdown) — only the output target differs (React tree vs HTML string for clipboard).

## Clipboard Mechanism — `osascript` + `«data HTML<hex>»`

`pbcopy` cannot reliably set a `text/html` payload across macOS versions. The well-trodden path is AppleScript:

```applescript
set the clipboard to «data HTML48656C6C6F»  -- hex bytes typed as «class HTML»
```

Implementation:
1. `Buffer.from(html, "utf-8").toString("hex").toUpperCase()` — encode HTML to uppercase hex.
2. `spawn("osascript", ["-e", \`set the clipboard to «data HTML${hex}»\`])` — single argv entry, no shell escaping.
3. Wait on `child.on("close")` — exit 0 = success; non-zero rejects with stderr.

Why hex `«data HTML…»` and not `set the clipboard to "<html>" as «class HTML»`: the `as «class HTML»` form requires the HTML string to fit AppleScript string-literal escaping, which breaks on 70KB+ specs containing quotes, backticks, and Unicode. The `«data HTML<hex>»` form is a raw typed-data literal — bytes go in verbatim, no string escaping, no length limit in practice.

Platform check: `process.platform !== "darwin"` exits 1 with a clear message naming the platform. No Linux/Windows clever fallbacks.

## Sample Output (smoke-test run)

```
$ node scripts/md-to-clipboard.mjs
Source file    : project-spec/2026-05-01.md
Source size    : 78,432 chars
HTML size      : 102,987 chars

Done in 0.1s.
Clipboard now holds 102,987 chars of text/html.

Next steps:
  1. Open the target Google Doc.
  2. Place the cursor where you want the content.
  3. Cmd+V (or Edit → Paste). Google Docs will paste as formatted text.
  4. If it pastes as plain text, make sure you used Cmd+V (not Cmd+Shift+V).
```

## Verification Run-Through

| Verification | Result |
| ------------ | ------ |
| `npm run md-to-clipboard` exits 0 with `Done in Xs.` line | PASS — exit 0, `Done in 0.1s.` printed |
| `osascript -e 'the clipboard as «class HTML»'` returns non-empty bytes | PASS — returns `«data HTML3C703E3C7374726F6E673E…»` (HTML markup typed as `«class HTML»`) |
| HTML output structurally complete | PASS — counted 30 `<h1>`, 58 `<h2>`, 21 `<table>` with 200 `<tr>`, 278 `<strong>`, 334 `<li>` |
| Default arg picks newest YYYY-MM-DD.md | PASS — picked `project-spec/2026-05-01.md` |
| Bare filename arg resolves inside project-spec/ | PASS — `2026-04-30.md` -> `project-spec/2026-04-30.md` |
| Full path arg used as-given | PASS — `project-spec/2026-04-27.md` resolved as-is |
| Bogus path exits 1 with clear error | PASS — `nope.md` -> "File not found: nope.md\nTried: nope.md and project-spec/nope.md" + exit 1 |
| `git diff --stat` shows only the three intended files | PASS — `package-lock.json`, `package.json`, `scripts/md-to-clipboard.mjs` (new) |
| `package.json` is valid JSON | PASS — `node -e "require('./package.json')"` succeeds |

## Manual Paste-into-Google-Docs Verification

Not performed in this environment (no browser, no Google Docs surface). However:
- The `osascript` invocation succeeded (exit 0, no stderr).
- Reading the clipboard back via `osascript -e 'the clipboard as «class HTML»'` returns the raw `«data HTML<hex>»` payload, confirming the typed-data type is set correctly (not `text/plain`).
- Hex decode of the leading bytes matches the markdown front matter rendered as HTML: `<p><strong>Macplants ERP — Full Requirements Overview</strong></p><p><strong>Purpose:</strong> Complete list of every feature we&#39;re building for Stage 1 of MacPlants ERP build, written for…`
- Google Docs honours the macOS `«class HTML»` pasteboard type by design — a populated `«class HTML»` payload pastes as formatted text via Cmd+V.

The end user (Sigurd) can confirm by running `npm run md-to-clipboard` and pasting into a Doc.

## Deviations from Plan

None — plan executed as written. No bugs encountered, no architectural escalations needed, no auth gates.

## Commits

| Task | Hash | Message |
| ---- | ---- | ------- |
| 1 | `b5e5468` | chore(260501-wvd-01): add marked dep and md-to-clipboard npm script |
| 2 | `8f75cf9` | feat(260501-wvd-01): add md-to-clipboard CLI for Google Docs paste |

## Self-Check: PASSED

- File `scripts/md-to-clipboard.mjs` exists at `/Users/sigurdwatt/Development/MacPlants/project-spec/.claude/worktrees/agent-ac80468b/scripts/md-to-clipboard.mjs` (118 lines).
- File `package.json` modified — `md-to-clipboard` script entry present, `marked` in dependencies.
- File `package-lock.json` modified — new dep tree.
- Commit `b5e5468` exists (Task 1).
- Commit `8f75cf9` exists (Task 2).
- Smoke test `node scripts/md-to-clipboard.mjs` exits 0 with sensible byte counts.
- Clipboard verification via `osascript -e 'the clipboard as «class HTML»'` returns `«data HTML<hex>»`.
