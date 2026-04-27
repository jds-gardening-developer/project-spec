/**
 * searchPanel.helpers — pure JS for the SearchPanel component.
 *
 * Plan 03-05 (Phase 3, SEA-01/SEA-03). Implements D-09 (keyboard) and D-10
 * (result format). Kept as pure functions so node:test can exercise them
 * without JSDOM, mirroring the SchemaTable.helpers.js / .test.js pattern
 * established in Phase 2 (D-09 / SchemaTable.helpers precedent).
 *
 * Exports:
 *   - isSearchHotkey(event)              — D-09 Cmd+K (macOS) / Ctrl+K (others)
 *   - buildSnippet(body, query, maxLen)  — D-10 segment list, XSS-safe
 *   - formatBreadcrumb(prd_id, level)    — D-10 'PRD-1' / 'PRD-1.1' label
 *
 * SECURITY (T-03-05-01): buildSnippet returns Array<{type, text}> — segment
 * list, NOT an HTML string. SearchPanel.jsx renders each segment as React
 * text or a <mark> element via normal JSX — never via raw HTML injection.
 * This eliminates XSS at the type level.
 */

/**
 * isSearchHotkey(event) — returns true when the keydown event matches
 * Cmd+K (macOS) or Ctrl+K (Linux/Windows). Case-insensitive on the key.
 *
 * Defensive: returns false for null/undefined/non-object inputs and for
 * non-string `key` values; never throws.
 */
export function isSearchHotkey(event) {
  if (!event || typeof event !== 'object') return false;
  if (typeof event.key !== 'string') return false;
  if (event.key.toLowerCase() !== 'k') return false;
  return Boolean(event.metaKey || event.ctrlKey);
}

/**
 * formatBreadcrumb(prd_id, level) — small grey context label per D-10.
 *
 * Converts the internal slug (e.g. 'prd-1', 'prd-1-1') back to the human
 * PRD identifier ('PRD-1', 'PRD-1.1'). Returns empty string when no
 * breadcrumb is appropriate (H1 doc title, non-PRD H2 like Meeting
 * Action Items).
 *
 * The `level` parameter is currently unused — both H2 and H3 records get
 * the same breadcrumb shape (the H3's title above already names itself,
 * so the breadcrumb is just the parent PRD identifier). Kept as a
 * parameter so callers can pass `record.level` without conditional logic
 * and so future tweaks (e.g. include H4 sub-grouping) have a hook.
 */
export function formatBreadcrumb(prd_id, _level) {
  if (typeof prd_id !== 'string' || prd_id.length === 0) return '';
  // 'prd-1'   → ['prd', '1']        → 'PRD-1'
  // 'prd-1-1' → ['prd', '1', '1']   → 'PRD-1.1'
  // 'prd-3-4' → ['prd', '3', '4']   → 'PRD-3.4'
  const m = prd_id.match(/^prd-(\d+)(?:-(\d+))?$/i);
  if (!m) return prd_id.toUpperCase();
  return m[2] ? `PRD-${m[1]}.${m[2]}` : `PRD-${m[1]}`;
}

/**
 * buildSnippet(body, query, maxLen) — segment list with <mark> ranges.
 *
 * Returns Array<{type: 'text'|'mark', text: string}>. SearchPanel renders
 * each segment as React text or a <mark> element — no raw HTML injection.
 *
 * Behavior:
 *   - Empty body → [].
 *   - Empty/whitespace-only query → first maxLen chars (with '…' suffix if
 *     truncated), one text segment.
 *   - Otherwise: split query on whitespace into terms, escape each term for
 *     literal regex matching, build a single case-insensitive alternation,
 *     find the FIRST match for windowing, then walk the windowed body
 *     producing alternating text/mark segments. Window is centered on the
 *     first match when body exceeds maxLen, with '…' prefix/suffix as
 *     applicable. If no match, return first maxLen chars + '…' truncation.
 *
 * Security (T-03-05-03): all regex special chars in query terms are
 * escaped via escapeRegex() before constructing the alternation; no
 * pathological backtracking possible (single alternation, no nested
 * quantifiers). Body is capped at 800 chars upstream by the build-search-
 * index pipeline (Plan 03-04 BODY_MAX_CHARS), so the linear walk is O(n).
 */
export function buildSnippet(body, query, maxLen = 160) {
  if (typeof body !== 'string' || body.length === 0) return [];

  const trimmedQuery = (typeof query === 'string') ? query.trim() : '';
  if (trimmedQuery.length === 0) {
    return [{
      type: 'text',
      text: body.length > maxLen ? body.slice(0, maxLen) + '…' : body,
    }];
  }

  // Split into whitespace-separated terms; escape each before regex use.
  const terms = trimmedQuery.split(/\s+/).filter(Boolean).map(escapeRegex);
  if (terms.length === 0) {
    return [{
      type: 'text',
      text: body.length > maxLen ? body.slice(0, maxLen) + '…' : body,
    }];
  }
  const re = new RegExp('(' + terms.join('|') + ')', 'gi');

  // Find first match in the original body for windowing decisions.
  re.lastIndex = 0;
  const first = re.exec(body);

  // Decide window. Default: full body.
  let windowStart = 0;
  let windowEnd = body.length;
  let prefix = '';
  let suffix = '';

  if (first && body.length > maxLen) {
    // Center the window on the first match.
    const half = Math.floor(maxLen / 2);
    windowStart = Math.max(0, first.index - half);
    windowEnd = Math.min(body.length, windowStart + maxLen);
    if (windowStart > 0) prefix = '…';
    if (windowEnd < body.length) suffix = '…';
  } else if (!first && body.length > maxLen) {
    // No match — return the head with truncation marker.
    windowEnd = maxLen;
    suffix = '…';
  }

  const window_ = body.slice(windowStart, windowEnd);

  // If no match in body OR no match in window, return single text segment
  // (with prefix/suffix ellipsis as decided).
  // (Window can lack matches if first match landed near body edge and
  // windowStart slid past it — defensive.)
  re.lastIndex = 0;
  const segments = [];
  if (prefix) segments.push({ type: 'text', text: prefix });
  let cursor = 0;
  let m;
  let matchedAny = false;
  while ((m = re.exec(window_)) !== null) {
    matchedAny = true;
    if (m.index > cursor) {
      segments.push({ type: 'text', text: window_.slice(cursor, m.index) });
    }
    segments.push({ type: 'mark', text: m[0] });
    cursor = m.index + m[0].length;
    if (m[0].length === 0) re.lastIndex++; // guard against zero-width matches
  }
  if (cursor < window_.length) {
    segments.push({ type: 'text', text: window_.slice(cursor) });
  }
  if (!matchedAny && segments.length === 0) {
    // Window was empty AND prefix was empty — body is empty (handled above)
    // or pathological. Fall through to suffix.
  }
  if (suffix) segments.push({ type: 'text', text: suffix });

  // If we somehow produced an empty list (e.g. no match, no prefix, no
  // suffix, but window_ had length), emit it as one text segment.
  if (segments.length === 0 && window_.length > 0) {
    return [{ type: 'text', text: window_ }];
  }
  return segments;
}

// ---------- internals ----------

/**
 * escapeRegex(s) — escape the 11 regex special characters so a query term
 * matches literally. Order in the character class is intentional (backslash
 * last avoids a self-escape pitfall in some engines, though JS handles it
 * fine).
 */
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
