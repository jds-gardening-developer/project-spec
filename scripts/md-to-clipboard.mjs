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

// ---------- table styling for Google Docs ----------
// Google Docs respects inline styles + `bgcolor` on pasted HTML. Marked emits
// bare <table>/<th>/<td> which Docs renders with a near-zero column width.
// We inject inline styles to force a navy header, padded cells, alternating
// rows, and full table width.
const TABLE_STYLE = "width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; margin: 1em 0; font-size: 11pt;";
const TH_STYLE = "background-color: #2c3e50; color: #ffffff; padding: 6px 12px; text-align: left; font-weight: bold; border: 1px solid #2c3e50;";
const TD_STYLE = "padding: 4px 12px; border: 1px solid #d6dde4; vertical-align: top;";
const ROW_EVEN = "#ffffff";
const ROW_ODD = "#f4f6f8";

function styleTables(html) {
  let out = html.replace(/<table>/g, `<table width="100%" cellpadding="0" cellspacing="0" style="${TABLE_STYLE}">`);

  out = out.replace(/<th(\s[^>]*)?>/g, (match, attrs = "") => {
    if (/style="/i.test(attrs)) {
      return match.replace(/style="([^"]*)"/i, (_, existing) => `style="${existing}; ${TH_STYLE}"`);
    }
    return `<th${attrs} style="${TH_STYLE}">`;
  });

  out = out.replace(/<td(\s[^>]*)?>/g, (match, attrs = "") => {
    if (/style="/i.test(attrs)) {
      return match.replace(/style="([^"]*)"/i, (_, existing) => `style="${existing}; ${TD_STYLE}"`);
    }
    return `<td${attrs} style="${TD_STYLE}">`;
  });

  out = out.replace(/<tbody>([\s\S]*?)<\/tbody>/g, (_, body) => {
    let i = 0;
    const newBody = body.replace(/<tr>/g, () => {
      const bg = i % 2 === 0 ? ROW_EVEN : ROW_ODD;
      i += 1;
      return `<tr bgcolor="${bg}" style="background-color: ${bg};">`;
    });
    return `<tbody>${newBody}</tbody>`;
  });

  return out;
}

// ---------- args ----------
if (process.platform !== "darwin") {
  console.error("This script is macOS-only — it uses osascript to set the clipboard as text/html.");
  console.error(`Detected platform: ${process.platform}`);
  process.exit(1);
}

const SPEC_DIR = "project-spec";
const DATE_FILE_RE = /^\d{4}-\d{2}-\d{2}\.md$/;

const arg = process.argv[2];
let srcPath;

if (arg) {
  if (fs.existsSync(arg)) {
    srcPath = path.resolve(arg);
  } else {
    const fallback = path.join(SPEC_DIR, arg);
    if (fs.existsSync(fallback)) {
      srcPath = path.resolve(fallback);
    } else {
      console.error(`File not found: ${arg}`);
      console.error(`Tried: ${arg} and ${fallback}`);
      process.exit(1);
    }
  }
} else {
  if (!fs.existsSync(SPEC_DIR)) {
    console.error(`Spec directory not found: ${SPEC_DIR} — run this from the repo root.`);
    process.exit(1);
  }
  const dated = fs
    .readdirSync(SPEC_DIR)
    .filter((name) => DATE_FILE_RE.test(name))
    .sort()
    .reverse();

  if (dated.length === 0) {
    console.error(`No dated files in ${SPEC_DIR}/ — pass a path explicitly.`);
    process.exit(1);
  }
  srcPath = path.resolve(SPEC_DIR, dated[0]);
}

// ---------- read ----------
const md = fs.readFileSync(srcPath, "utf-8");

if (md.length < 10) {
  console.error(`File is suspiciously small (${md.length} chars) — refusing to copy: ${srcPath}`);
  process.exit(1);
}

console.log(`Source file    : ${path.relative(process.cwd(), srcPath)}`);
console.log(`Source size    : ${md.length.toLocaleString()} chars`);

// ---------- render ----------
marked.setOptions({ gfm: true, breaks: false });
const html = styleTables(marked.parse(md));

console.log(`HTML size      : ${html.length.toLocaleString()} chars`);

// ---------- copy ----------
const startedAt = Date.now();
const hex = Buffer.from(html, "utf-8").toString("hex").toUpperCase();
const applescript = `set the clipboard to «data HTML${hex}»`;

await new Promise((resolve, reject) => {
  const child = spawn("osascript", ["-e", applescript]);
  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  child.on("error", reject);
  child.on("close", (code) => {
    if (code === 0) resolve();
    else reject(new Error(`osascript exited ${code}: ${stderr.trim()}`));
  });
});

const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

// ---------- done ----------
console.log("");
console.log(`Done in ${elapsed}s.`);
console.log(`Clipboard now holds ${html.length.toLocaleString()} chars of text/html.`);
console.log("");
console.log("Next steps:");
console.log("  1. Open the target Google Doc.");
console.log("  2. Place the cursor where you want the content.");
console.log("  3. Cmd+V (or Edit → Paste). Google Docs will paste as formatted text.");
console.log("  4. If it pastes as plain text, make sure you used Cmd+V (not Cmd+Shift+V).");
