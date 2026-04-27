import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MermaidBlock } from './MermaidPre.jsx';
import { buildErDiagramSource, slugify, sortedEntities } from './SchemaPage.helpers.js';
import './SchemaPage.css';

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 8;
const ZOOM_STEP = 1.2;
const FIT_PADDING = 24;

/**
 * SchemaPage — interactive ER overview of every entity in the spec.
 *
 * Plan 260427-gjf, Task 2. Lazy-loaded by App.jsx (`React.lazy(() => import(…))`),
 * so this module + its sole runtime dep (the schema-index JSON) are split into
 * their own chunk and never enter the main bundle.
 *
 * Contract:
 *   - schema-index.json is dynamic-imported on mount via `import('../schema-index.json')`
 *     so Vite emits a separate asset.
 *   - The Mermaid `erDiagram` source is synthesised from data.entities + data.relationships
 *     and rendered through the existing <MermaidBlock> (which already lazy-loads mermaid).
 *   - Each entity gets an <article id="entity-<slug>"> with a "View in spec →" anchor
 *     that targets `#/<prd_id>` — useRoute flips the route back to 'spec', useHashScroll
 *     resolves the slug (prefix-match handles the PRD-1.1 → prd-1-1-plant-variants case).
 *
 * `initialData` prop is a TEST SEAM ONLY. Production callers never pass it; the dynamic
 * import is the canonical data source.
 *
 * Pure helpers (buildErDiagramSource, sortedEntities, slugify) live in
 * SchemaPage.helpers.js so they can be unit-tested without a JSX/CSS toolchain.
 */

export default function SchemaPage({ initialData }) {
  const [data, setData] = useState(() => initialData || null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) return; // Test seam — skip the network round-trip.
    let cancelled = false;
    import('../schema-index.json')
      .then((m) => {
        if (cancelled) return;
        setData(m.default || m);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err && err.message ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [initialData]);

  const erSource = useMemo(() => (data ? buildErDiagramSource(data) : ''), [data]);
  const entitiesSorted = useMemo(() => sortedEntities(data && data.entities), [data]);

  if (error) {
    return (
      <section className="schema-page schema-page--error">
        <p role="alert">Failed to load schema index: {error}</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="schema-page schema-page--loading">
        <p>Loading schema…</p>
      </section>
    );
  }

  return (
    <section className="schema-page">
      <header className="schema-page__header">
        <h1>Schema Index</h1>
        <p className="schema-page__subtitle">
          Every entity in the spec, its fields, and the foreign-key relationships
          between them. Click "View in spec →" on any entity to jump to its PRD.
        </p>
      </header>

      <section className="schema-page__diagram" aria-label="Entity relationship diagram">
        <DiagramViewport>
          <MermaidBlock>
            <code>{erSource}</code>
          </MermaidBlock>
        </DiagramViewport>
      </section>

      <section className="schema-page__entities" aria-label="Entity reference list">
        {entitiesSorted.map((entity) => {
          const slug = slugify(entity.name);
          return (
            <article
              id={`entity-${slug}`}
              key={entity.name}
              className="schema-entity"
            >
              <h3>{entity.name}</h3>
              <p className="schema-entity__link">
                <a href={`#/${entity.prd_id}`}>View in spec →</a>
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Type</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(entity.fields || []).map((f) => (
                    <tr key={f.name}>
                      <td>
                        <code>{f.name}</code>
                      </td>
                      <td>{f.type}</td>
                      <td>{f.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          );
        })}
      </section>
    </section>
  );
}

function DiagramViewport({ children }) {
  const viewportRef = useRef(null);
  const canvasRef = useRef(null);
  const naturalSizeRef = useRef(null); // { w, h } of the rendered SVG at scale=1
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [fullscreen, setFullscreen] = useState(false);
  const dragRef = useRef(null);

  // Capture (and cache) the SVG's natural size from getBBox the first time it's
  // available. Returns the cached size on subsequent calls so getBBox isn't
  // re-measured against an already-resized SVG.
  const getNaturalSize = useCallback(() => {
    if (naturalSizeRef.current) return naturalSizeRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const svg = canvas.querySelector('svg');
    if (!svg) return null;
    let w = 0;
    let h = 0;
    try {
      const bbox = svg.getBBox();
      w = bbox.width;
      h = bbox.height;
    } catch {
      // ignore
    }
    if (!w || !h) {
      // viewBox fallback — Mermaid emits a viewBox like "0 0 1234 567"
      const vb = svg.getAttribute('viewBox');
      if (vb) {
        const parts = vb.split(/\s+/).map(Number);
        if (parts.length === 4) {
          w = parts[2];
          h = parts[3];
        }
      }
    }
    if (!w || !h) return null;
    naturalSizeRef.current = { w, h };
    return naturalSizeRef.current;
  }, []);

  const fit = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return false;
    const natural = getNaturalSize();
    if (!natural) return false;
    const vRect = viewport.getBoundingClientRect();
    const fitScale = Math.min(
      ZOOM_MAX,
      (vRect.width - FIT_PADDING * 2) / natural.w,
      (vRect.height - FIT_PADDING * 2) / natural.h
    );
    setZoom(fitScale);
    setPan({
      x: (vRect.width - natural.w * fitScale) / 2,
      y: (vRect.height - natural.h * fitScale) / 2,
    });
    return true;
  }, [getNaturalSize]);

  const reset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const zoomBy = useCallback((factor, center) => {
    setZoom((z) => {
      const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z * factor));
      if (center && next !== z) {
        // Keep the cursor's underlying point stationary across the zoom.
        setPan((p) => ({
          x: center.x - ((center.x - p.x) * next) / z,
          y: center.y - ((center.y - p.y) * next) / z,
        }));
      }
      return next;
    });
  }, []);

  const onWheel = useCallback(
    (e) => {
      e.preventDefault();
      const rect = viewportRef.current.getBoundingClientRect();
      const center = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      zoomBy(e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP, center);
    },
    [zoomBy]
  );

  const onPointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, panX: 0, panY: 0 };
    setPan((p) => {
      dragRef.current.panX = p.x;
      dragRef.current.panY = p.y;
      return p;
    });
    viewportRef.current.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e) => {
    const drag = dragRef.current;
    if (!drag) return;
    setPan({
      x: drag.panX + (e.clientX - drag.startX),
      y: drag.panY + (e.clientY - drag.startY),
    });
  }, []);

  const onPointerUp = useCallback((e) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (viewportRef.current.hasPointerCapture(e.pointerId)) {
      viewportRef.current.releasePointerCapture(e.pointerId);
    }
  }, []);

  // Wheel events must be attached non-passively to call preventDefault,
  // and React's onWheel is passive by default.
  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  // Esc closes fullscreen.
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  // Capture natural size once the SVG appears (so the Fit button works), but
  // do NOT auto-fit — the diagram opens at 100% native size by default.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const tryCapture = () => {
      if (naturalSizeRef.current) return;
      getNaturalSize();
    };
    tryCapture();
    const observer = new MutationObserver(tryCapture);
    observer.observe(canvas, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [getNaturalSize]);

  // Apply zoom to the SVG via width/height ATTRIBUTES (not CSS transform).
  // This forces the browser to re-rasterize the SVG vector at the new size, so
  // text stays crisp at any zoom level. CSS scale on the canvas div would
  // stretch a low-resolution texture and produce blurry/illegible labels.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const apply = () => {
      const natural = naturalSizeRef.current;
      if (!natural) return;
      const svg = canvas.querySelector('svg');
      if (!svg) return;
      const w = natural.w * zoom;
      const h = natural.h * zoom;
      svg.setAttribute('width', String(w));
      svg.setAttribute('height', String(h));
      svg.style.width = w + 'px';
      svg.style.height = h + 'px';
      svg.style.maxWidth = 'none';
    };
    apply();
    // The SVG may not exist yet on first render; observe and reapply when it does.
    const observer = new MutationObserver(apply);
    observer.observe(canvas, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [zoom]);

  return (
    <div
      ref={viewportRef}
      className={`schema-diagram-viewport${fullscreen ? ' is-fullscreen' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="schema-diagram-controls" onPointerDown={(e) => e.stopPropagation()}>
        <button type="button" onClick={() => zoomBy(ZOOM_STEP)} aria-label="Zoom in">+</button>
        <span className="schema-diagram-zoom-display">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => zoomBy(1 / ZOOM_STEP)} aria-label="Zoom out">−</button>
        <button type="button" onClick={fit}>Fit</button>
        <button type="button" onClick={reset}>1:1</button>
        <button type="button" onClick={() => setFullscreen((v) => !v)}>
          {fullscreen ? 'Close' : 'Fullscreen'}
        </button>
      </div>
      <div
        ref={canvasRef}
        className="schema-diagram-canvas"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
