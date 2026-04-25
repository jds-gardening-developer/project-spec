#!/usr/bin/env node
/**
 * update-spec.mjs
 * ---------------
 * Fuses a meeting transcript into the existing spec and writes:
 *   - README.proposed.md   (the proposed updated spec — review this!)
 *   - update-summary.md    (what changed and why)
 *
 * Usage:
 *   node scripts/update-spec.mjs <transcript-file>
 *
 * Example:
 *   node scripts/update-spec.mjs transcripts/2026-04-25-meeting.md
 *
 * After running, review README.proposed.md (e.g. `git diff --no-index README.md README.proposed.md`),
 * then either accept it (`mv README.proposed.md README.md`) or discard it and try again.
 */

import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import path from "node:path";
import "dotenv/config";

// ---------- args ----------
const transcriptPath = process.argv[2];
if (!transcriptPath) {
  console.error("Usage: node scripts/update-spec.mjs <transcript-file>");
  process.exit(1);
}
if (!fs.existsSync(transcriptPath)) {
  console.error(`Transcript not found: ${transcriptPath}`);
  process.exit(1);
}

const SPEC_PATH = path.resolve("README.md");
if (!fs.existsSync(SPEC_PATH)) {
  console.error(`Spec not found at ${SPEC_PATH} — run this from the repo root.`);
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is not set. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

const spec = fs.readFileSync(SPEC_PATH, "utf-8");
const transcript = fs.readFileSync(transcriptPath, "utf-8");

// ---------- prompt ----------
const SYSTEM_PROMPT = `You are updating a living product specification for the MacPlants ERP build.

The user will provide:
  1. The current spec (the source of truth) inside <existing_spec> tags.
  2. A meeting transcript inside <meeting_transcript> tags.

Your job is to produce an updated version of the spec that fuses in the outcomes
from the meeting, following these rules STRICTLY:

RULES
-----
1. The spec's structure is sacred. Do NOT rename, reorder, or remove section
   headings (PRD-0, PRD-1, PRD-1.1, etc.). Do NOT change numbering. Do NOT
   change the document's overall layout.
2. Only amend a section if the meeting genuinely updates, refines, or expands
   what's already there. Re-discussion of already-correct material is NOT a
   reason to edit. If the meeting confirmed something already in the spec, leave
   it alone.
3. Where the meeting goes into useful new detail on a topic already covered, ADD
   that detail as new bullets/lines within the existing section. Don't rewrite
   the section.
4. Where the meeting introduces something genuinely new (a new feature area, a
   new entity, a new workflow), add a new PRD section in the appropriate place
   — but only if there is no existing section that legitimately covers it.
5. Data Model tables: keep the 3-column markdown table format (Field | Type |
   Notes). Only list core persisted fields. Do NOT add computed/derived values
   (totals, balances, lifetime values) as fields.
6. Do not "fix" cosmetic things (typos, escape characters like \\., \\+, \\>,
   smart quotes). The user handles formatting separately.
7. Action items: append new ones to the "Meeting Action Items" section. Resolve
   existing ones if the meeting closed them out.
8. Stage 1 / Stage 2 split: don't promote or demote items between stages
   unless the meeting explicitly does so.

OUTPUT FORMAT
-------------
Return your response in EXACTLY this format, with NO other commentary before or after:

<updated_spec>
[the entire updated spec markdown content here — the FULL document, not a diff]
</updated_spec>

<change_summary>
[a markdown summary of what you changed and why, organised by section. Also list anything you deliberately did NOT change. Be specific — name the sections you touched.]
</change_summary>
`;

const USER_MESSAGE = `<existing_spec>
${spec}
</existing_spec>

<meeting_transcript>
${transcript}
</meeting_transcript>

Please produce the updated spec and the change summary, following the rules above.`;

// ---------- call ----------
const client = new Anthropic();

console.log(`Reading spec   : ${SPEC_PATH} (${spec.length.toLocaleString()} chars)`);
console.log(`Reading meeting: ${transcriptPath} (${transcript.length.toLocaleString()} chars)`);
console.log("Calling Claude Opus 4.7…");

const startedAt = Date.now();

const response = await client.messages.create({
  model: "claude-opus-4-7",
  max_tokens: 32000,
  system: SYSTEM_PROMPT,
  messages: [{ role: "user", content: USER_MESSAGE }],
});

const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
const fullText = response.content.map((b) => (b.type === "text" ? b.text : "")).join("");

// ---------- parse ----------
function extract(tag, text) {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

const updatedSpec = extract("updated_spec", fullText);
const changeSummary = extract("change_summary", fullText);

if (!updatedSpec) {
  console.error("Could not find <updated_spec> in the response. Saving raw output to update-raw.md for inspection.");
  fs.writeFileSync("update-raw.md", fullText);
  process.exit(1);
}

// ---------- write outputs ----------
fs.writeFileSync("README.proposed.md", updatedSpec + "\n");
fs.writeFileSync("update-summary.md", (changeSummary || "(no summary returned)") + "\n");

const usage = response.usage || {};
console.log("");
console.log(`Done in ${elapsed}s.`);
console.log(`Tokens: ${usage.input_tokens?.toLocaleString() ?? "?"} in / ${usage.output_tokens?.toLocaleString() ?? "?"} out`);
console.log("");
console.log("Outputs:");
console.log("  README.proposed.md   (the proposed updated spec)");
console.log("  update-summary.md    (what changed and why)");
console.log("");
console.log("Next steps:");
console.log("  1. Review the diff:   git diff --no-index README.md README.proposed.md");
console.log("  2. Read the summary:  cat update-summary.md");
console.log("  3. If happy, accept:  mv README.proposed.md README.md");
console.log("  4. If not, discard:   rm README.proposed.md update-summary.md");
