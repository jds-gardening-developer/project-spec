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
