import { useEffect, useRef, useState } from 'react';
import { useScrollSpy } from './useScrollSpy.js';
import { useScrollToAnchor } from './useScrollToAnchor.js';
import './MobileTocBar.css';

const MAX_PAINT_RETRIES = 3;
const RECOLLECT_DEBOUNCE_MS = 200;

function collectH1s() {
  if (typeof document === 'undefined') return [];
  const nodes = document.querySelectorAll('.spec-viewer h1[id]');
  const out = [];
  for (const el of nodes) {
    const text = (el.textContent || '').trim();
    if (text.startsWith('PRD-')) {
      out.push({ id: el.id, text });
    }
  }
  return out;
}

export function MobileTocBar() {
  const [headings, setHeadings] = useState([]);
  const scrollToAnchor = useScrollToAnchor();
  const listRef = useRef(null);
  const activeRef = useRef(null);

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
        return;
      }
      setHeadings(collectH1s());
      observer = new MutationObserver(() => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          if (!cancelled) setHeadings(collectH1s());
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

  const ids = headings.map((h) => h.id);
  const activeId = useScrollSpy(ids);

  useEffect(() => {
    const el = activeRef.current;
    const list = listRef.current;
    if (!el || !list) return;
    const elRect = el.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    if (elRect.left < listRect.left || elRect.right > listRect.right) {
      const targetLeft =
        list.scrollLeft + (elRect.left - listRect.left) - (listRect.width - elRect.width) / 2;
      list.scrollTo({ left: targetLeft, behavior: 'smooth' });
    }
  }, [activeId]);

  function handleClick(event, id) {
    event.preventDefault();
    scrollToAnchor(id);
  }

  if (headings.length === 0) return null;

  return (
    <nav className="mobile-toc" aria-label="Section navigation">
      <ul className="mobile-toc-list" ref={listRef}>
        {headings.map((h) => {
          const active = activeId === h.id;
          return (
            <li key={h.id} className="mobile-toc-item">
              <a
                ref={active ? activeRef : null}
                href={'#' + h.id}
                className={
                  'mobile-toc-link' + (active ? ' mobile-toc-link--active' : '')
                }
                onClick={(e) => handleClick(e, h.id)}
              >
                {h.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
