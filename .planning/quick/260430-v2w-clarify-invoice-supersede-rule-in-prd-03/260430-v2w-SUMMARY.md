---
phase: 260430-v2w
plan: 01
type: quick
subsystem: spec
tags: [docs, prd-03, invoicing, supersede, data-model]
requires: []
provides: ["Clarified Invoice supersede rule + Superseded status in PRD-03"]
affects: ["project-spec/2026-04-30.md"]
key-files:
  modified:
    - project-spec/2026-04-30.md
decisions:
  - "Invoice.status enum extended with `Superseded` (third value alongside Unpaid / Paid)"
  - "Order paid-state remains derived from active invoice — no `paid` boolean added to Order"
  - "Post-Xero corrections continue to flow through credit notes (PRD-3.3) — supersede only applies pre-Xero"
metrics:
  duration: "~5 min"
  completed: "2026-04-30"
  tasks: 1
  files: 1
---

# Quick Task 260430-v2w: Clarify Invoice Supersede Rule in PRD-03 — Summary

**One-liner:** Locked down the multi-invoice-per-order rule in PRD-03 by adding `Superseded` to the Invoice status enum and replacing the half-finished Invoice Phase paragraph with five precise bullets covering active-invoice tracking, pre-Xero edits, balance derivation, paid-state derivation, and post-Xero credit notes.

## Edits Made

### Edit 1 — Invoice status enum (line 458)

**Before:**

```
| status | enum | Unpaid / Paid |
```

**After:**

```
| status | enum | Unpaid / Paid / Superseded |
```

### Edit 2 — Invoice Phase prose (lines 524–537, was 524–526)

**Before** (single muddled paragraph ending with `?`):

```
### **Invoice Phase**

If the client has ordered the plants on CREDIT then an invoice is sent to them once the plants have been dispatched ( The Order is still marked as UNPAID. It is the Job of Finance to mark the invoice as paid on the ERP when the payment arrives.  An Order is marked as paid if there is an Invoice within that Order which is marked as Paid ?
```

**After** (intro paragraph + bold-callout + four bullet rules, in the project's existing style):

```
### **Invoice Phase**

If the client has ordered the plants on credit, an invoice is generated when the order is created on the ERP (not sent to Xero — see Xero Posting Flow below). It is Finance's job to mark the invoice as Paid on the ERP when payment arrives.

**One active invoice per order:** An order can have many invoices over its lifetime, but only one is _active_ at any moment — the most recently generated one. Earlier invoices are kept for audit but marked `Superseded`.

* **Edits before Xero supersede the active invoice.** ...

* **Outstanding balance is computed from the active invoice only.** ...

* **Order paid-state is derived, not stored.** ...

* **Post-Xero corrections go through credit notes.** ...
```

(Bullet bodies committed verbatim per the plan's `<action>` block — see file or commit `1fe5c9c` for full text.)

## Verification Results

All grep checks from the plan's `<verify><automated>` block returned matches:

| Check | Match |
|-------|-------|
| `Unpaid / Paid / Superseded` | line 458 |
| `One active invoice per order` | line 528 |
| `Edits before Xero supersede the active invoice` | line 530 |
| `Outstanding balance is computed from the active invoice only` | line 532 |
| `Order paid-state is derived` | line 534 |
| `Post-Xero corrections go through credit notes` | line 536 |
| `see PRD-3.3` | lines 536, 540 |
| `\| invoices \| array\[Invoice\] \|` | line 439 (still present, unchanged) |

Negative greps:

- `^\| paid \| boolean` — single hit at line 205 (Purchase Order data model in **PRD-1.1**, pre-existing, unrelated to PRD-03). The Order data model (PRD-03, lines 426–440) was visually inspected and contains **no** `paid` boolean. Plan intent satisfied.
- `Unpaid / Paid \|$` — no matches (the bare `Unpaid / Paid` cell no longer exists).

## Order Model Deliberately Unchanged

Per the plan, the Order data model in PRD-03 was left untouched: `invoices | array[Invoice]` remains at line 439 and **no `paid` boolean was added**. Order paid-state is derived from the active invoice's status, not stored as a column.

## Deviations from Plan

### Worktree-state adjustment (Rule 3 — blocking issue)

- **Found during:** Initial worktree setup (before Task 1).
- **Issue:** This worktree's HEAD pointed at `923396c` (a stash commit on `web-app-refactor`), but the `<worktree_branch_check>` block instructed a `git reset --soft 28a44139…`. After that reset, the worktree's working directory contained only `README.md`, `index.html`, `package.json`, `CONTRIBUTING.md`, `netlify.toml`, `scripts/`, and `transcripts/` — `project-spec/2026-04-30.md` did not exist on disk in this worktree.
- **Fix:** Copied the untracked `project-spec/2026-04-30.md` from the parent worktree (`/Users/sigurdwatt/Development/MacPlants/project-spec/project-spec/2026-04-30.md`) into this worktree, then applied the two intended edits.
- **Files modified:** `project-spec/2026-04-30.md` (created here, with the two task edits already applied).
- **Commit:** `1fe5c9c` — note this commit shows as 1256 insertions because the file did not exist in commit `28a4413` (which deleted all project content). The intended edit content is exactly the two changes described above; everything else in the file is the upstream untracked spec verbatim.

### Negative-grep over-matched (informational only)

- **Found during:** Verification.
- **Issue:** The plan's negative grep `! grep -nE "^\| paid \| boolean"` was meant to confirm Order has no `paid` boolean, but it also matches the pre-existing `paid | boolean` row in the Purchase Order data model (PRD-1.1, line 205). That row is unrelated to this task and was not modified.
- **Fix:** None needed — verified the plan's intent (Order has no `paid` boolean) by visual inspection of lines 426–440.

## Authentication Gates

None.

## Self-Check: PASSED

- File present: `project-spec/2026-04-30.md` — FOUND
- Commit present: `1fe5c9c` — FOUND
- Required strings: all 7 grep targets matched
- Negative checks: bare `Unpaid / Paid` cell — no matches; Order `paid` boolean — confirmed absent in Order table by inspection

## Commit

| Task | Commit | Files |
|------|--------|-------|
| 1 — Edit PRD-03 invoice supersede rule | `1fe5c9c` | `project-spec/2026-04-30.md` |
