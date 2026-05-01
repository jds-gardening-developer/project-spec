import { useEffect, useMemo, useState } from 'react';
import {
  useScrollSpy,
  groupHeadingsByPrd,
  findActivePrd,
} from './useScrollSpy.js';
import { useScrollToAnchor } from './useScrollToAnchor.js';
import { useRoute } from './useRoute.js';
import './Sidebar.css';

/**
 * Sidebar — Plan 03-02 (Phase 3, NAV-01..03).
 *
 * Decisions:
 *   - D-18: heading source is the rendered DOM. After SpecViewer mounts we
 *     run `document.querySelectorAll('.spec-viewer h1[id], .spec-viewer h2[id]')`
 *     to build the entry list. No parallel AST, no markdown re-parse.
 *   - D-01: H2 sub-sections auto-expand under the active PRD only. Computed
 *     by passing the flat id list through useScrollSpy + findActivePrd.
 *   - D-17: scroll-spy via IntersectionObserver (handled inside useScrollSpy).
 *   - D-03: active state = bold text + 3px left accent bar
 *     (var(--sidebar-active-bar), neutral grey in Phase 3; Phase 4 swaps in
 *     MacPlants green).
 *   - D-04: NO sidebar header. First child of <aside> is <nav>. Phase 4 owns
 *     site title.
 *   - D-02: below 768px the <aside> is display:none; a hamburger button
 *     toggles it as an overlay drawer with a backdrop.
 *
 * Re-collection strategy:
 *   - One-shot effect on mount waits for the SpecViewer's first paint via
 *     requestAnimationFrame (up to 3 retries). Once .spec-viewer is in the
 *     DOM, we attach a debounced MutationObserver so future content changes
 *     (manifest reload, future hot-reload) re-populate the sidebar without
 *     needing a render-tree change in App.jsx.
 *   - The observer is debounced to 200ms (T-03-02-03 mitigation): rapid DOM
 *     mutations during react-markdown's render burst collapse into a single
 *     re-collection.
 */

const MAX_PAINT_RETRIES = 3;
const RECOLLECT_DEBOUNCE_MS = 200;

function collectHeadings() {
  if (typeof document === 'undefined') return [];
  const nodes = document.querySelectorAll('.spec-viewer h1[id], .spec-viewer h2[id]');
  const out = [];
  for (const el of nodes) {
    const level = el.tagName === 'H1' ? 1 : 2;
    out.push({ id: el.id, level, text: el.textContent || '' });
  }
  return out;
}

export function Sidebar() {
  const [headings, setHeadings] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const scrollToAnchor = useScrollToAnchor();
  const route = useRoute();

  // ----- Heading collection (D-18) -----
  useEffect(() => {
    if (typeof document === 'undefined') return;

    let cancelled = false;
    let retries = 0;
    let observer = null;
    let debounceTimer = null;

    function attemptCollect() {
      if (cancelled) return;
      const root = document.querySelector('.spec-viewer');
      if (!root) {
        if (retries < MAX_PAINT_RETRIES) {
          retries += 1;
          requestAnimationFrame(attemptCollect);
        }
        // Give up silently after MAX_PAINT_RETRIES — sidebar shows empty.
        return;
      }

      // Initial collection.
      setHeadings(collectHeadings());

      // Subsequent re-collection on content mutation (T-03-02-03 debounced).
      observer = new MutationObserver(() => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          if (!cancelled) setHeadings(collectHeadings());
        }, RECOLLECT_DEBOUNCE_MS);
      });
      observer.observe(root, { childList: true, subtree: true });
    }

    requestAnimationFrame(attemptCollect);

    return () => {
      cancelled = true;
      if (observer) observer.disconnect();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, []);

  // ----- Group + scroll-spy -----
  const groups = useMemo(() => groupHeadingsByPrd(headings), [headings]);
  const flatIds = useMemo(() => {
    const ids = [];
    for (const g of groups) {
      ids.push(g.id);
      for (const c of g.children) ids.push(c.id);
    }
    return ids;
  }, [groups]);

  const activeId = useScrollSpy(flatIds);
  const activePrdId = findActivePrd(groups, activeId);

  // ----- Mobile drawer: Escape closes (D-02) -----
  useEffect(() => {
    if (!drawerOpen) return;
    if (typeof window === 'undefined') return;
    function onKey(e) {
      if (e.key === 'Escape') setDrawerOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  // ----- Click handler: smooth-scroll + close drawer (D-02, NAV-03) -----
  function handleEntryClick(event, id) {
    event.preventDefault();
    scrollToAnchor(id);
    setDrawerOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className="sidebar-hamburger"
        aria-expanded={drawerOpen}
        aria-controls="sidebar-nav"
        aria-label="Toggle navigation"
        onClick={() => setDrawerOpen((v) => !v)}
      >
        ☰
      </button>
      <div
        className="sidebar-backdrop"
        data-open={drawerOpen ? 'true' : 'false'}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
      <aside
        className="sidebar"
        data-drawer-open={drawerOpen ? 'true' : 'false'}
        aria-label="PRD navigation"
      >
        <nav id="sidebar-nav">
          {/* Class names sidebar-link--h2 / --h3 are cosmetic group/child
              indicators, intentionally decoupled from the underlying heading
              level (which migrated H2->H1 and H3->H2 with the spec format
              change). Do not rename — it would touch Sidebar.css and the
              Schema Index static link for zero behavioral gain. */}
          {/* 260427-gjf: static "Schema Index" entry — always visible above
              the dynamic PRD list so the route is reachable from both the
              spec view and the schema view. Active when route === 'schema'.
              260501-wll: leaf logo added on the same row — clicking it clears
              the hash and scrolls to top, returning to the spec home. */}
          <ul className="sidebar-list sidebar-list--static">
            <li className="sidebar-item sidebar-static-row">
              <a
                href="#/"
                className="sidebar-logo"
                aria-label="Home — back to spec"
                onClick={(e) => {
                  e.preventDefault();
                  if (typeof window !== 'undefined') {
                    if (window.location.hash) {
                      window.location.hash = '';
                    }
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                  setDrawerOpen(false);
                }}
              >
                <svg
                  className="sidebar-logo-icon"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M3 21c0-9 7-17 18-18-1 11-9 18-18 18z"
                    fill="currentColor"
                  />
                  <path
                    d="M3 21l9-9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.55"
                  />
                </svg>
              </a>
              <a
                href="#/schema"
                className={
                  'sidebar-link sidebar-link--h2 sidebar-link--static' +
                  (route === 'schema' ? ' sidebar-link--active' : '')
                }
                onClick={() => {
                  // Let the browser update the hash naturally so useRoute's
                  // hashchange listener fires; just close the mobile drawer.
                  setDrawerOpen(false);
                }}
              >
                Schema Index
              </a>
            </li>
          </ul>
          {groups.length === 0 ? (
            <p className="sidebar-empty">
              {route === 'schema' ? '(open the spec to see PRD nav)' : '(no sections)'}
            </p>
          ) : (
            <ul className="sidebar-list">
              {groups.map((g) => {
                const isActiveGroup = activePrdId === g.id;
                const h2Active = activeId === g.id;
                return (
                  <li key={g.id} className="sidebar-item">
                    <a
                      href={'#' + g.id}
                      className={
                        'sidebar-link sidebar-link--h2' +
                        (h2Active ? ' sidebar-link--active' : '')
                      }
                      onClick={(e) => handleEntryClick(e, g.id)}
                    >
                      {g.text}
                    </a>
                    {isActiveGroup && g.children.length > 0 ? (
                      <ul className="sidebar-sublist">
                        {g.children.map((c) => (
                          <li key={c.id}>
                            <a
                              href={'#' + c.id}
                              className={
                                'sidebar-link sidebar-link--h3' +
                                (activeId === c.id ? ' sidebar-link--active' : '')
                              }
                              onClick={(e) => handleEntryClick(e, c.id)}
                            >
                              {c.text}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </nav>
      </aside>
    </>
  );
}
