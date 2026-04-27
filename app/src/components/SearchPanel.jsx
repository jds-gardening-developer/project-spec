import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import searchIndexData from '../search-index.json';
import { isSearchHotkey, buildSnippet, formatBreadcrumb } from './searchPanel.helpers.js';
import { useScrollToAnchor } from './useScrollToAnchor.js';
import './SearchPanel.css';

/**
 * SearchPanel — Cmd/Ctrl+K modal overlay over the spec viewer.
 *
 * Plan 03-05 (Phase 3, SEA-01 + SEA-03). Replaces the Plan 03-01 stub.
 * Implements D-08 (modal shape), D-09 (keyboard), D-10 (result format),
 * D-11 (empty state), D-12 (selection behavior), D-19 (CSS variables).
 *
 * Architecture:
 *   - Module-level promise singleton hydrates MiniSearch ONLY on first
 *     open. The dynamic import keeps minisearch out of the main entry
 *     chunk; Vite splits it into its own lazy chunk. Mirrors the
 *     MermaidPre.jsx precedent from Phase 2.
 *   - Renders into document.body via createPortal so the modal is above
 *     the sticky sidebar regardless of stacking context (D-08).
 *   - Reuses useScrollToAnchor() from Plan 03-01 for D-12 selection
 *     behavior — same scroll + history.replaceState mechanic the
 *     sidebar uses, so search-driven navigation feels identical.
 *   - Snippet rendering uses the segment-list output from buildSnippet:
 *     each segment is a React text node or <mark> element, NOT an HTML
 *     string. No raw HTML injection — XSS-safe by design (T-03-05-01).
 */

// ---------- module-level lazy MiniSearch singleton (D-05) ----------

let miniSearchPromise = null;
function loadMiniSearch() {
  if (miniSearchPromise) return miniSearchPromise;
  miniSearchPromise = import('minisearch').then((mod) => {
    const MiniSearch = mod.default || mod;
    const ms = new MiniSearch({
      idField: 'id',
      fields: ['title', 'body', 'prd_id'],          // searchable fields
      storeFields: ['id', 'title', 'prd_id', 'level', 'body'], // returned in results
      searchOptions: {
        boost: { title: 3, prd_id: 2, body: 1 },
        prefix: true,
        fuzzy: 0.2,
      },
    });
    if (Array.isArray(searchIndexData) && searchIndexData.length > 0) {
      ms.addAll(searchIndexData);
    }
    return ms;
  });
  return miniSearchPromise;
}

// ---------- component ----------

export function SearchPanel() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [miniSearch, setMiniSearch] = useState(null);

  const scrollToAnchor = useScrollToAnchor();
  const inputRef = useRef(null);
  const activeItemRef = useRef(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults([]);
    setActiveIndex(-1);
  }, []);

  const select = useCallback((record) => {
    if (!record) return;
    setOpen(false);
    setQuery('');
    setResults([]);
    setActiveIndex(-1);
    // Wait one paint cycle so the modal unmounts and the body scroll-lock
    // releases before scrollIntoView fires; otherwise the smooth scroll
    // can be canceled by the modal's overflow:hidden style. (D-12)
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        scrollToAnchor(record.id);
      });
    } else {
      scrollToAnchor(record.id);
    }
  }, [scrollToAnchor]);

  // Global Cmd+K / Ctrl+K listener (D-09).
  useEffect(() => {
    const onKey = (event) => {
      if (isSearchHotkey(event)) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Lazy-hydrate MiniSearch on first open. The dynamic import is what
  // splits minisearch into its own chunk; this useEffect is what triggers
  // it for the first time.
  useEffect(() => {
    if (!open) return;
    if (miniSearch) return;
    let cancelled = false;
    loadMiniSearch().then(
      (ms) => {
        if (!cancelled) setMiniSearch(ms);
      },
      (err) => {
        // Swallow — search will appear empty until a successful retry on
        // next open. Logging once helps the dev catch chunk-load errors.
        // eslint-disable-next-line no-console
        console.warn('[search-panel] failed to load minisearch chunk:', err);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [open, miniSearch]);

  // Run search when query or miniSearch changes.
  useEffect(() => {
    if (!open) return;
    if (!miniSearch) {
      setResults([]);
      return;
    }
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      // D-11: empty input → empty result list.
      setResults([]);
      setActiveIndex(-1);
      return;
    }
    const hits = miniSearch.search(trimmed, {
      prefix: true,
      fuzzy: 0.2,
    });
    setResults(hits.slice(0, 20));
    setActiveIndex(hits.length > 0 ? 0 : -1);
  }, [query, miniSearch, open]);

  // Body scroll-lock while modal is open — UX polish so the page beneath
  // doesn't scroll on wheel / touchmove.
  useEffect(() => {
    if (!open) return;
    if (typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Keep the active result scrolled into view when keyboard nav moves it.
  useEffect(() => {
    if (activeIndex < 0) return;
    const node = activeItemRef.current;
    if (node && typeof node.scrollIntoView === 'function') {
      node.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  // Modal-scoped keyboard handlers (D-09).
  const onInputKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => {
        if (results.length === 0) return -1;
        return Math.min(i + 1, results.length - 1);
      });
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => {
        if (results.length === 0) return -1;
        return Math.max(i - 1, 0);
      });
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const record = results[activeIndex];
      if (record) select(record);
      return;
    }
  }, [close, results, activeIndex, select]);

  if (!open) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="search-modal-backdrop"
      onClick={close}
      role="presentation"
    >
      <div
        className="search-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search the spec"
      >
        <input
          ref={inputRef}
          type="search"
          className="search-modal-input"
          placeholder="Search the spec..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onInputKeyDown}
          autoFocus
          aria-label="Search query"
          aria-controls="search-modal-results"
          aria-activedescendant={
            activeIndex >= 0 && results[activeIndex]
              ? `search-result-${results[activeIndex].id}`
              : undefined
          }
        />
        {results.length > 0 && (
          <ul
            id="search-modal-results"
            className="search-results"
            role="listbox"
          >
            {results.map((r, i) => {
              const breadcrumb = formatBreadcrumb(r.prd_id, r.level);
              const isActive = i === activeIndex;
              return (
                <li
                  key={r.id}
                  id={`search-result-${r.id}`}
                  ref={isActive ? activeItemRef : null}
                  className={
                    'search-result' + (isActive ? ' search-result--active' : '')
                  }
                  onClick={() => select(r)}
                  onMouseEnter={() => setActiveIndex(i)}
                  role="option"
                  aria-selected={isActive}
                >
                  <div className="search-result-title">{r.title}</div>
                  {breadcrumb && (
                    <div className="search-result-context">{breadcrumb}</div>
                  )}
                  <div className="search-result-snippet">
                    {buildSnippet(r.body || '', query, 160).map((seg, j) =>
                      seg.type === 'mark' ? (
                        <mark key={j}>{seg.text}</mark>
                      ) : (
                        <span key={j}>{seg.text}</span>
                      )
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>,
    document.body
  );
}
