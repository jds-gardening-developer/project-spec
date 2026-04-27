/**
 * useScrollSpy — scroll-spy hook + three pure helpers (Plan 03-02, NAV-02).
 *
 * Decisions:
 *   - D-01: H3 sub-headings expand only under the active PRD. The Sidebar uses
 *     `findActivePrd(groups, activeId)` to map an H3-active state back to its
 *     parent H2 id so the right group expands.
 *   - D-17: IntersectionObserver, threshold tuned so the topmost-visible
 *     heading wins. `rootMargin: '0px 0px -70% 0px'` shrinks the viewport
 *     trigger zone to the top 30%, which prevents flicker while scrolling
 *     past long sections (the active state only changes when a heading
 *     crosses into the top band).
 *
 * Pure helpers (named exports — unit-tested by useScrollSpy.test.js, no DOM):
 *   - pickActiveHeading(entries)        — chooses topmost intersecting entry
 *   - groupHeadingsByPrd(headings)      — flat list -> [{id,text,children}]
 *   - findActivePrd(groups, activeId)   — H3-active -> parent H2 id
 *
 * React hook:
 *   - useScrollSpy(headingIds: string[]) -> string | null
 *     Returns the id of the heading currently in the top viewport band, or
 *     null if none. Re-runs effect when `headingIds.join('|')` changes (live
 *     re-collection in Sidebar.jsx works without infinite loops).
 *
 * The hook does NOT use the helpers internally — they are exported separately
 * because Sidebar.jsx needs to group headings (groupHeadingsByPrd) and
 * resolve H3-active to its parent H2 (findActivePrd) outside the hook scope.
 */

import { useEffect, useState } from 'react';

/**
 * Pick the topmost-visible heading among a list of IntersectionObserverEntries.
 *
 * Rules (D-01 / D-17):
 *   - Skip entries that are not intersecting (preserves "previously-active"
 *     state when the user scrolls into a gap between sections).
 *   - Skip entries with no target.id (defensive — should not happen in
 *     production since we only observe getElementById hits).
 *   - Among intersecting entries, return the one with the smallest
 *     boundingClientRect.top (= closest to the viewport top = "active").
 *   - If no entries intersect, return null. Caller decides whether to keep
 *     the previously-active id or clear it; the hook below keeps it.
 */
export function pickActiveHeading(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return null;
  let best = null;
  let bestTop = Infinity;
  for (const e of entries) {
    if (!e || !e.isIntersecting) continue;
    if (!e.target || !e.target.id) continue;
    const top = e.boundingClientRect ? e.boundingClientRect.top : 0;
    if (top < bestTop) {
      best = e.target.id;
      bestTop = top;
    }
  }
  return best;
}

/**
 * Group a flat heading list by their preceding H2.
 *
 * Input shape:  [{id, level, text}, ...] where level is 2 or 3 (others ignored).
 * Output shape: [{id, text, children: [{id, text}, ...]}, ...]
 *
 * Rules:
 *   - Each H2 starts a new group.
 *   - Each H3 is appended to the most-recently-seen H2's children.
 *   - H3s before any H2 are dropped (defensive — would mean a malformed spec).
 *   - Levels other than 2 or 3 are ignored (H1 site title, H4 detail groups).
 */
export function groupHeadingsByPrd(headings) {
  if (!Array.isArray(headings) || headings.length === 0) return [];
  const groups = [];
  let current = null;
  for (const h of headings) {
    if (!h || !h.id) continue;
    if (h.level === 2) {
      current = { id: h.id, text: h.text || '', children: [] };
      groups.push(current);
    } else if (h.level === 3) {
      if (current) {
        current.children.push({ id: h.id, text: h.text || '' });
      }
      // orphan H3 (no preceding H2) is dropped — see Test 5
    }
  }
  return groups;
}

/**
 * Given a list of PRD groups and the currently-active heading id, return the
 * H2 id of the group that owns the active id (so the Sidebar knows which
 * group to expand).
 *
 * Rules:
 *   - activeId is an H2's own id        -> return that H2 id
 *   - activeId is a child H3's id       -> return parent H2 id
 *   - activeId is null                  -> null
 *   - activeId not found in any group   -> null
 */
export function findActivePrd(groups, activeId) {
  if (!activeId || !Array.isArray(groups)) return null;
  for (const g of groups) {
    if (g.id === activeId) return g.id;
    if (Array.isArray(g.children)) {
      for (const c of g.children) {
        if (c.id === activeId) return g.id;
      }
    }
  }
  return null;
}

/**
 * React hook: track the currently-active heading id via IntersectionObserver.
 *
 * Args:
 *   headingIds — string[] of heading ids to observe. Order determines the
 *                tie-breaker only if two headings share boundingClientRect.top
 *                (extremely rare; pickActiveHeading uses < not <=, so first
 *                wins implicitly).
 *
 * Returns:
 *   The active id (string) or null.
 *
 * Behavior:
 *   - Empty input: returns null and creates no observer (no-op effect).
 *   - Re-runs effect when the ids list changes (`.join('|')` as the dep key
 *     so a fresh array with the same contents does not re-trigger).
 *   - Cleanup: disconnects the observer on unmount or before re-running.
 *   - Skips ids whose getElementById returns null (heading not yet in DOM —
 *     Sidebar will re-collect on a later paint).
 */
export function useScrollSpy(headingIds) {
  const [activeId, setActiveId] = useState(null);
  const key = Array.isArray(headingIds) ? headingIds.join('|') : '';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof IntersectionObserver === 'undefined') return;
    if (!Array.isArray(headingIds) || headingIds.length === 0) return;

    const targets = [];
    for (const id of headingIds) {
      const el = document.getElementById(id);
      if (el) targets.push(el);
    }
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const next = pickActiveHeading(entries);
        if (next != null) {
          setActiveId((prev) => (prev === next ? prev : next));
        }
        // If pickActiveHeading returns null (nothing intersecting right now),
        // we intentionally leave activeId unchanged — keeps the previously
        // active section highlighted as the user scrolls between headings.
      },
      {
        // Trigger only when a heading is in the top 30% of the viewport.
        // Bottom margin -70% shrinks the trigger zone so the topmost
        // visible heading wins (D-17 tuning).
        rootMargin: '0px 0px -70% 0px',
        threshold: 0,
      }
    );

    for (const el of targets) observer.observe(el);

    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return activeId;
}
