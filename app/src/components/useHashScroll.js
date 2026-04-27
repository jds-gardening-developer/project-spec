/**
 * useHashScroll — consume location.hash on first content render (NAV-04).
 *
 * Plan 03-03 of Phase 3. Implements CONTEXT.md D-13, D-14, D-15.
 *
 * Behaviour:
 *   - When `content` transitions from null/empty → non-empty string AND a hash
 *     is present in the URL, schedule a single scrollIntoView attempt on the
 *     next animation frame (after react-markdown commits its DOM).
 *   - Two resolution strategies (mirrors CrossLinkText.jsx D-05 pattern):
 *       1. document.getElementById(id) — full slug match
 *       2. document.querySelector(`[id^="${id}"]`) — prefix match for PRD-only
 *          hashes like #prd-1-1 (rehype-slug emits #prd-1-1-plant-variants)
 *   - On miss: silently do nothing (D-14). No log output, no URL alteration.
 *   - Re-fires only when `content` itself transitions (not on every render).
 *     Implementation: `useRef` flag set after first successful run for a given
 *     content value; reset when content drops back to null/empty so a fresh
 *     load re-arms the effect.
 *
 * Why animation frame instead of setTimeout(0):
 *   - rAF runs after layout but before paint of the next frame. setTimeout(0)
 *     can fire BEFORE rehype-slug ids are committed in StrictMode double-render.
 *   - rAF is the documented React-friendly "wait for DOM" primitive.
 *
 * Why ONE attempt (no retries):
 *   - The content prop transition gates the effect — if SpecViewer commits late
 *     (which it doesn't; markdown is synchronous), `content` won't have flipped
 *     to non-empty yet, so the effect won't fire prematurely.
 *   - Simpler than retry-with-backoff; D-14 silent miss is the safety net.
 *
 * Why NOT reuse useScrollToAnchor (Plan 03-01):
 *   - useScrollToAnchor only does getElementById; useHashScroll needs the
 *     prefix-match fallback (CrossLinkText D-05 parity).
 *   - useScrollToAnchor mutates the URL hash via the History API; D-14 implies
 *     preserving the user's deep-link verbatim so refresh re-triggers the
 *     same scroll. This hook therefore leaves location.hash untouched.
 */
import { useEffect, useRef } from 'react';

// Match PRD numbering with dots: 'prd-1.1', 'prd-12.3.4' (case-insensitive).
// ROADMAP success criterion 3 cites '/#/prd-1.1' literally; rehype-slug emits
// 'prd-1-1' (dashes), so normalise the PRD pattern only. Non-PRD ids that
// happen to contain a dot (e.g. 'some.thing') are left alone so D-14's silent
// miss kicks in rather than us mangling an unrelated anchor.
const PRD_DOT_RE = /^prd-\d+(\.\d+)+$/i;

export function parseHashToId(hash) {
  if (typeof hash !== 'string' || hash.length === 0) return null;
  let id = hash.startsWith('#') ? hash.slice(1) : hash;
  if (id.startsWith('/')) id = id.slice(1);
  // Strip query portion defensively (some clipboard managers append '?utm=…').
  const qIdx = id.indexOf('?');
  if (qIdx >= 0) id = id.slice(0, qIdx);
  id = id.trim();
  if (id.length === 0) return null;
  if (PRD_DOT_RE.test(id)) id = id.replace(/\./g, '-');
  return id;
}

function resolveHeading(id) {
  if (typeof document === 'undefined' || !id) return null;
  const direct = document.getElementById(id);
  if (direct) return direct;
  // Prefix match for PRD-only hashes (e.g. #prd-1-1 → prd-1-1-plant-variants).
  // CSS.escape guards against malformed ids; fall back to no-op on error.
  try {
    const escaped = (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(id) : id;
    return document.querySelector(`[id^="${escaped}"]`);
  } catch {
    return null;
  }
}

export function useHashScroll(content) {
  const consumedRef = useRef(false);

  useEffect(() => {
    // Wait for content to load. While null/empty, re-arm so the next non-empty
    // transition (e.g. a fresh navigation) triggers the effect.
    if (typeof content !== 'string' || content.length === 0) {
      consumedRef.current = false;
      return;
    }
    if (consumedRef.current) return;
    consumedRef.current = true;

    if (typeof window === 'undefined') return;
    const id = parseHashToId(window.location.hash);
    if (!id) return;

    // Wait for SpecViewer's DOM to be committed before resolving.
    const rafId = window.requestAnimationFrame(() => {
      const target = resolveHeading(id);
      if (!target) return; // D-14 silent no-op on unknown hash
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Note: do NOT alter location.hash — preserve the user's deep link
      // verbatim so they can copy/share the URL and a refresh re-triggers
      // the same scroll.
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [content]);
}
