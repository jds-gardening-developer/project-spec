import { useEffect, useId, useRef, useState } from 'react';
import './MermaidPre.css';

/**
 * MermaidBlock — renders a fenced ```mermaid block as an SVG diagram.
 *
 * Decisions implemented:
 *   D-01: default light theme; no hard-coded MacPlants green. Phase 4 owns theming.
 *   D-02: mermaid is loaded via dynamic import('mermaid') inside useEffect, so the
 *         module is fetched only when at least one MermaidBlock mounts. Vite code-splits
 *         this into its own chunk; if the page has zero mermaid blocks, the chunk is
 *         never requested.
 *   D-03: on parse/render failure, show a visible red banner above the original source.
 *
 * Security: mermaid.initialize({ securityLevel: 'strict' }) — Mermaid sanitizes diagram
 * source and produces SVG without script tags or arbitrary HTML.
 *
 * Pitfall: mermaid.render is not fully reentrant; concurrent renders may flicker.
 * Acceptable at current scope (fixture has 2 diagrams; real spec has 0). If Phase 4
 * introduces concurrent renders, queue calls through a module-level promise chain.
 */

// Module-level singleton: initialize mermaid only once across all MermaidBlocks.
let mermaidPromise = null;
function loadMermaid() {
  if (mermaidPromise) return mermaidPromise;
  mermaidPromise = import('mermaid').then((mod) => {
    const mermaid = mod.default || mod;
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'default',
      // ER diagram defaults are tiny — the SchemaPage uses ER for the schema map.
      // Per-diagram %%{init}%% directives are ignored under strict securityLevel,
      // so we bump these globally. The spec uses flowchart/sequence diagrams (not
      // ER) so this only takes effect on the SchemaPage.
      er: {
        fontSize: 18,
        entityPadding: 15,
        minEntityWidth: 160,
        minEntityHeight: 80,
      },
    });
    return mermaid;
  });
  return mermaidPromise;
}

function extractSource(children) {
  // children is the <code> element produced by react-markdown.
  // Its `children` prop is the diagram source as a string (or [string]).
  const arr = Array.isArray(children) ? children : [children];
  for (const child of arr) {
    if (child && child.props && child.props.children) {
      const inner = child.props.children;
      if (typeof inner === 'string') return inner;
      if (Array.isArray(inner)) return inner.filter((x) => typeof x === 'string').join('');
    }
  }
  return '';
}

export function MermaidBlock({ children }) {
  const source = extractSource(children);
  const reactId = useId();
  // useId returns something like ":r1:" — invalid for SVG IDs; sanitize.
  const safeId = 'mermaid-' + reactId.replace(/[^a-zA-Z0-9-]/g, '');
  const containerRef = useRef(null);
  const [error, setError] = useState(null);
  const [svg, setSvg] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!source.trim()) {
      setError('empty mermaid block');
      return;
    }
    loadMermaid().then((mermaid) => {
      if (cancelled) return;
      // mermaid.render returns Promise<{svg, bindFunctions?}>. It throws on parse error.
      mermaid
        .render(safeId, source)
        .then(({ svg: rendered }) => {
          if (!cancelled) {
            setSvg(rendered);
            setError(null);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setSvg(null);
            setError(err && err.message ? err.message : String(err));
          }
        });
    }, (loadErr) => {
      if (!cancelled) {
        setError('failed to load mermaid: ' + (loadErr && loadErr.message ? loadErr.message : String(loadErr)));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [source, safeId]);

  if (error) {
    // D-03: visible banner ABOVE the original source so the author sees both.
    return (
      <div className="mermaid-block mermaid-block--error">
        <div className="mermaid-block__error-banner" role="alert">
          Mermaid parse error: {error}
        </div>
        <pre className="mermaid-block__source"><code>{source}</code></pre>
      </div>
    );
  }

  if (!svg) {
    // Loading or pre-render state. Show the source as a placeholder so the layout
    // doesn't shift dramatically once the diagram renders.
    return (
      <div className="mermaid-block mermaid-block--loading">
        <pre className="mermaid-block__source"><code>{source}</code></pre>
      </div>
    );
  }

  return (
    <div
      className="mermaid-block"
      ref={containerRef}
      // Mermaid produces sanitized SVG (securityLevel: 'strict'). dangerouslySetInnerHTML
      // is the supported v10 idiom for embedding the result.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
