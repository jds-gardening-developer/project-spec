/**
 * useScrollToAnchor — reusable scroll-to-heading mechanism (D-12, D-17).
 *
 * Extracted from CrossLinkText.jsx (Phase 2) so sidebar entries (Plan 03-02)
 * and search results (Plan 03-05) can reuse the same scroll + hash semantics
 * without copying logic. CrossLinkText.jsx itself is intentionally NOT
 * modified in Phase 3 (it owns its broken-link useState branch); this hook
 * just exposes the happy-path scroll mechanic separately.
 *
 * Returns scrollToAnchor(id) — a stable function that:
 *   1. Resolves the heading via document.getElementById(id) (Phase 3 hash format
 *      matches rehype-slug output exactly per D-15, so getElementById is
 *      sufficient; no querySelector prefix-match needed here — sidebar/search
 *      records carry full slug ids).
 *   2. On hit: scrollIntoView({behavior:'smooth', block:'start'}) and
 *      history.replaceState(null,'','#'+id) — replaceState (NOT pushState)
 *      so back-button history is not polluted (mirrors CrossLinkText.jsx).
 *   3. On miss: silently returns false (D-14 unknown-hash handling).
 *
 * Returns true on hit, false on miss, so callers can branch (Plan 03-03's
 * useHashScroll uses the boolean to decide whether to retry on next paint).
 */
import { useCallback } from 'react';

export function useScrollToAnchor() {
  return useCallback((id) => {
    if (typeof document === 'undefined' || !id) return false;
    const target = document.getElementById(id);
    if (!target) return false;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const hash = '#' + id;
    if (typeof window !== 'undefined' && window.location.hash !== hash) {
      window.history.replaceState(null, '', hash);
    }
    return true;
  }, []);
}
