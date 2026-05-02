---
phase: 260502-1dr
plan: 01
subsystem: spec/deposits
tags: [spec, deposits, prd-3.1, prd-5, scope-decisions, action-items, dated-snapshot, docsify]
requires: []
provides:
  - "Order schema fields: deposit_amount, deposit_requested_at, deposit_received_at"
  - "PRD-3.1 limited deposit-request feature definition (admin-triggered, holding-account treatment, Stripe link routing, Order Paid status under deposits)"
  - "Email Notification trigger enum value: deposit_requested"
  - "Scope Decisions IN list entry: deposit requests for long-lead orders"
  - "Action Items: VAT tax-point treatment confirmation with Ariane / accountant"
  - "Dated snapshot project-spec/2026-05-02.md (live Docsify homepage)"
affects:
  - "project-spec/2026-05-01.md"
  - "project-spec/2026-05-02.md"
  - "index.html"
tech-stack:
  added: []
  patterns:
    - "Dated-snapshot publishing — copy edited 2026-05-01.md byte-for-byte to 2026-05-02.md, then update Docsify homepage one line"
key-files:
  created:
    - "project-spec/2026-05-02.md"
  modified:
    - "project-spec/2026-05-01.md"
    - "index.html"
decisions:
  - "Deposits modelled as 3 Order fields, NOT a separate Invoice entity — keeps Invoice model clean for the dispatch-time invoice"
  - "Deposit cash held in Xero 'Other Debtors' holding account; no Xero invoice raised for the deposit itself; reconciled at dispatch against the single full-amount Invoice"
  - "Stripe link routing splits Invoice payments and Deposit payments via Stripe metadata; the two webhook code paths must never share logic"
  - "Order Paid status unchanged — deposit fields do not affect Paid calculation; UI surfaces a derived 'Deposit Received' state for visibility"
metrics:
  duration: "~2.6 minutes"
  completed: "2026-05-02"
  tasks: 3
  files_changed: 3
  commits: 3
---

# Quick Task 260502-1dr: Add Limited Deposit-Request Feature to ERP Spec — Summary

**One-liner:** Three Order fields (`deposit\_amount`, `deposit\_requested\_at`, `deposit\_received\_at`) plus a customer-facing payment-request flow held in Xero's "Other Debtors" until dispatch — published as the new `2026-05-02.md` snapshot.

## What Changed

Seven surgical edits to `project-spec/2026-05-01.md` capturing the recent design decision that deposits live on the Order (not as a separate Invoice), then a verbatim copy to `project-spec/2026-05-02.md` and a one-line `index.html` homepage swap. Three atomic commits with `spec(deposits):` prefix.

### Edit-by-edit ledger

| # | Where | What | Notes |
|---|-------|------|-------|
| 1 | Order Data Model table (L514+) | Added 3 schema rows: `deposit\_amount`, `deposit\_requested\_at`, `deposit\_received\_at` | All `decimal (nullable)` / `datetime (nullable)`. 3-column shape preserved. Escaped underscores preserved. |
| 2 | L562 deposits paragraph | Replaced single denial line with full multi-bullet feature description | Covers admin "Request Deposit" action, modal default 50% subtotal ex-VAT, email-with-Stripe-link, holding-account treatment, dispatch-time reconciliation, refund flow if order shrinks, Order Paid status under deposits, Stripe link routing via metadata. |
| 3 | Email Notification trigger enum | Appended `/ deposit\_requested` to the existing trigger list | Keeps the enum row 3-column. |
| 4 | PRD-5 totals bullet (L1098 → drifted) | Replaced `NO deposits — Macplants does not take deposits.` with cross-ref to PRD-3.1 | Portal-checkout no longer denies deposits exist. |
| 5 | PRD-5 acceptance bullet (L1142 → drifted) | Replaced `No deposit logic.` with PRD-3.1 cross-ref | Acceptance criterion stays true: portal totals don't show deposit, deposits are admin-side. |
| 6a | Scope Decisions IN list | Inserted `deposit requests for long-lead orders (admin-triggered customer-facing payment request — see PRD-3.1; not a Xero entity)` before `multi-tenancy baked in from start.` | Single-paragraph comma-separated shape preserved. |
| 6b | Scope Decisions OUT list | Deleted `deposits (removed entirely — never used), ` (with trailing comma + space) | Adjacent items joined cleanly: `promise-date engine, cancellation restocking fees`. No double-comma artefact. |
| 7 | Action Items | New bullet: **Confirm VAT tax-point treatment for deposits with Ariane / accountant** | Inserted directly after the existing Xero-posting-timing bullet. UK VAT generally treats deposit receipt as a tax point — this needs explicit accountant confirmation given the holding-account treatment. |

### Files

- **`project-spec/2026-05-01.md`** — modified (Tasks 1 & 2): all 7 edits applied
- **`project-spec/2026-05-02.md`** — created (Task 3): byte-identical copy of post-edit `2026-05-01.md`, verified with `diff` (clean)
- **`index.html`** — modified (Task 3): line 51 `homepage:` swapped from `'project-spec/2026-04-26.md'` → `'project-spec/2026-05-02.md'`

### Commits

| Task | Commit | Subject |
|------|--------|---------|
| 1 | `b81bf2a` | spec(deposits): add deposit fields to Order schema and replace L562 deposits paragraph |
| 2 | `114f67c` | spec(deposits): align trigger enum, portal copy, scope decisions, and action items with deposit-request feature |
| 3 | `99b1161` | spec(deposits): publish 2026-05-02 snapshot and point Docsify homepage at it |

## Verification

All `<verify>` automated blocks returned PASS.

```
--- Schema fields in 05-01 ---
7
--- Schema fields in 05-02 ---
7
--- Negations ---
NO deposits absent: PASS
No deposit logic absent: PASS
removed entirely absent: PASS
--- Snapshots identical ---
snapshots identical: PASS
--- Homepage ---
      homepage: 'project-spec/2026-05-02.md',
--- Three commits ---
99b1161 spec(deposits): publish 2026-05-02 snapshot and point Docsify homepage at it
114f67c spec(deposits): align trigger enum, portal copy, scope decisions, and action items with deposit-request feature
b81bf2a spec(deposits): add deposit fields to Order schema and replace L562 deposits paragraph
---commit count---
3
```

The 7 deposit-field reference count comes from: 3 schema rows + 1 mention in the L562 opening paragraph + 1 mention in bullet 2 (`deposit\_amount and deposit\_requested\_at`) + 1 mention in bullet 3 (`deposit\_received\_at`) + 1 mention in the Stripe-link-routing paragraph (`deposit\_received\_at`).

## Deviations from Plan

### 1. README.md exists in this worktree (plan asserted it does not)

**Found during:** Initial plan read.

**Issue:** The plan's `<objective>` block (note 1) and Task 3 explicitly state `README.md does NOT exist at the repo root`, and the plan's `<verification>` block includes `[ ! -f README.md ] && echo "README.md correctly absent"`. However, in this worktree `README.md` is tracked at HEAD `c739bd7` and is present in the working tree (72KB, ~70KB of spec content matching the older snapshots). `git ls-files | grep -i readme` confirms it's tracked. The plan was generated against a different state where README.md was absent.

**Fix:** Honored the actionable directive (`do NOT create one as a side effect` and `do not mirror edits into README.md`). README.md was untouched. No new README was created.

**Consequence to flag for Sigurd:**
- `CONTRIBUTING.md` line 3 says "The single source of truth is `README.md`. Every change is just an edit to that file." — but in practice the live Docsify site reads from the dated snapshot in `project-spec/`, and the existing `README.md` is already stale relative to `project-spec/2026-05-01.md` (e.g. README.md predates the 2026-04-30 / 2026-05-01 changes). With this plan, README.md is now also stale on the deposit feature.
- The plan accepted this stale-README state as the on-disk reality. If you want README.md kept in lockstep, that is a separate quick-task — either re-mirror it from the new snapshot or formally retire README.md as the source-of-truth claim in `CONTRIBUTING.md`.

**Files modified:** None (no fix applied — flagged for follow-up).

**Commit:** N/A.

### 2. index.html homepage was at `2026-04-26.md`, not `2026-05-01.md`

**Found during:** Plan inspection (already noted in the plan's `<objective>` deviation note 2).

**Issue:** The original task brief assumed the homepage was at `2026-05-01.md`. In reality it was at `2026-04-26.md` — so updating it to `2026-05-02.md` skips two snapshots (`2026-04-27.md` and `2026-04-30.md` were created but never wired to the homepage; `2026-05-01.md` was never wired either).

**Fix:** Plan already accommodated this — the Edit-tool replacement uses the actual `2026-04-26.md` value. No deviation from the plan as authored, but flagging here so the historical context is captured.

**Files modified:** `index.html` (line 51).

**Commit:** `99b1161`.

### 3. Worktree branch base correction (Windows-style EnterWorktree symptom)

**Found during:** Initial worktree branch check.

**Issue:** `git merge-base HEAD c739bd7…` returned `923396c…`, indicating the worktree HEAD was ahead of the documented base. Per the prompt's `<worktree_branch_check>`, ran `git reset --soft c739bd7…` to correct the base. This left the index showing the c739bd7 → 923396c diff as "to be committed", and the worktree's working tree was sparse (only ~7 of 122 tracked files present). Restored the working tree with `git checkout HEAD -- .` after the soft reset cleared the index.

**Fix:** Ran `git reset HEAD` (mixed) to clear the staged "deletions", then `git checkout HEAD -- .` to materialize all tracked files in the working directory. After this the working tree had all of `project-spec/`, `index.html`, etc., and edits proceeded normally.

**Files modified:** None of the spec files — purely a worktree bring-up step.

**Commit:** N/A — no commit was created from the reset.

## Spec Conventions Honored

- 3-column Data Model tables preserved (no 4th column added; new rows match the existing `Field | Type | Notes` shape).
- Escaped underscores preserved verbatim in field names (`deposit\_amount`, `deposit\_requested\_at`, `deposit\_received\_at`) and in inline code spans (`` `deposit\_amount` ``).
- PRD numbering immutable — no PRDs renamed, reordered, or removed; PRD-3.1 / PRD-5 / PRD-3.3 / PRD-3.4 references preserved.
- No unrelated cosmetic typos fixed (the existing "Superseeded" spelling at L548 was left alone, as called out in the plan).
- Heading bold convention (`## **…**`, `### **…**`) preserved — none of the 7 edits introduced new headings.
- Action Items section appended to (not reordered); existing items untouched.
- Scope Decisions IN/OUT lists preserved as comma-separated single-paragraph runs; no bulletisation; no double-comma artefacts after the OUT-list deletion.
- Inline cross-references use the canonical `(see PRD-X.Y)` form (e.g. `see PRD-3.1`, `(PRD-3.3)`).

## Known Stubs

None. All 7 edits substitute concrete content; no placeholders, "TODO" markers, or empty stubs were introduced.

## Threat Flags

None. The edits are spec-text changes only — no new endpoints, auth paths, file access patterns, or trust-boundary schema changes. The Stripe link routing description is a *forward-looking specification of a security boundary* (Invoice vs Deposit metadata routing, "the two flows must never share code paths"), but no code is being introduced — this is the spec for future work.

## Self-Check: PASSED

**Files exist:**
- FOUND: project-spec/2026-05-01.md
- FOUND: project-spec/2026-05-02.md
- FOUND: index.html

**Commits exist:**
- FOUND: b81bf2a (Task 1)
- FOUND: 114f67c (Task 2)
- FOUND: 99b1161 (Task 3)

**Plan-level invariants:**
- Three commits with `spec(deposits):` prefix: PASS
- All `<verify>` blocks PASS: PASS
- Snapshots byte-identical: PASS
- Homepage points at 2026-05-02.md: PASS
- README.md not created as a side effect: PASS (it pre-existed; not modified, not created)
