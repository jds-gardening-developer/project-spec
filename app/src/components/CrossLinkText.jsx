import { useState } from 'react';
import './CrossLinkText.css';

/**
 * CrossLinkAnchor — react-markdown `<a>` override for Phase 2 (REND-02).
 *
 * Plan 02 of Phase 2. Implements CONTEXT.md decisions D-05, D-06, D-07.
 *
 * Strategy:
 *   - First render: ALWAYS render a real <a>. We do NOT query the DOM during render
 *     because on first paint the heading nodes have not been committed yet, so a
 *     querySelector check would return null for every cross-link and the page would
 *     show every reference as broken until the user clicks somewhere to trigger a
 *     re-render. Click-time resolution is correct on every render path and survives
 *     React StrictMode double-rendering.
 *
 *   - On click:
 *       1. preventDefault() so the browser does not jump-and-reload the hash.
 *       2. document.querySelector(`[id^="${prdId}"]`) — prefix match per D-05 (rehype-slug
 *          generates ids like `prd-1-1-plant-variants`; we match by `prd-1-1` prefix).
 *       3a. If found: scrollIntoView({behavior:'smooth', block:'start'}) and update
 *           location.hash via history.replaceState (D-07; replaceState avoids spamming
 *           browser history on every click).
 *       3b. If NOT found: setBroken(true). The component re-renders as a dimmed <span>
 *           with a `title` tooltip. Emit one console.warn per missing prdId (deduped
 *           across the page via a module-level Set).
 *
 *   - Non-cross-link anchors (no data-prd-id; e.g. external https:// URLs in the
 *     markdown — none in today's spec, but possible later) pass through as a normal
 *     <a> with target="_blank" + rel="noopener noreferrer" defaults.
 *
 * Identification: the remark plugin attaches `data-prd-id="prd-x-y"` to every cross-link
 * node. Presence of that attribute distinguishes our links from any other anchors.
 */
export function CrossLinkAnchor(props) {
  const { href, children, className, node, ...rest } = props;
  const prdId = props['data-prd-id'];
  const [broken, setBroken] = useState(false);

  // Branch 1 — non-cross-link anchor (no data-prd-id). Pass through with safe defaults.
  if (!prdId) {
    const isExternal = typeof href === 'string' && /^https?:/.test(href);
    if (isExternal) {
      return (
        <a href={href} className={className} target="_blank" rel="noopener noreferrer" {...rest}>
          {children}
        </a>
      );
    }
    return <a href={href} className={className} {...rest}>{children}</a>;
  }

  // Branch 2 — cross-link with broken state (D-06). Render dimmed span; no nav.
  if (broken) {
    return (
      <span
        className={(className ? className + ' ' : '') + 'cross-link cross-link--broken'}
        title={`${labelText(children)} not found in current spec`}
      >
        {children}
      </span>
    );
  }

  // Branch 3 — cross-link active. Always render <a>; resolve at click time.
  const onClick = (event) => {
    event.preventDefault();
    const target = typeof document !== 'undefined'
      ? document.querySelector(`[id^="${prdId}"]`)
      : null;
    if (!target) {
      // D-06: missing target → swap in place to broken UI + warn once.
      warnOnce(prdId, children);
      setBroken(true);
      return;
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const hash = '#' + target.id;
    if (typeof window !== 'undefined' && window.location.hash !== hash) {
      // Use replaceState (not pushState) to avoid spamming browser history on every click.
      window.history.replaceState(null, '', hash);
    }
  };

  return (
    <a
      href={href}
      className={(className ? className + ' ' : '') + 'cross-link'}
      onClick={onClick}
      {...rest}
    >
      {children}
    </a>
  );
}

// ---- helpers ----

const _warned = new Set();
function warnOnce(prdId, children) {
  if (_warned.has(prdId)) return;
  _warned.add(prdId);
  // eslint-disable-next-line no-console
  console.warn(`[spec-viewer] cross-link: ${labelText(children)} not found`);
}

function labelText(children) {
  // children is typically the text "PRD-1.1" wrapped by react-markdown.
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) {
    return children.map(labelText).join('');
  }
  if (children && children.props && children.props.children) {
    return labelText(children.props.children);
  }
  return 'PRD reference';
}
