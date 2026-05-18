import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { slugify } from './SchemaPage.helpers.js';
import { MermaidBlock } from './MermaidPre.jsx';
import { buildComponentGraphSource } from './ComponentMapPage.helpers.js';
import './ComponentMapPage.css';

export default function ComponentMapPage({ initialData }) {
  const [data, setData] = useState(() => initialData || null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) return;
    let cancelled = false;
    import('../component-map-index.json')
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

  const components = useMemo(() => {
    const list = Array.isArray(data?.components) ? data.components : [];
    return [...list].sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [data]);

  const graphSource = useMemo(() => buildComponentGraphSource(data), [data]);

  if (error) {
    return (
      <section className="component-map component-map--error">
        <p role="alert">Failed to load component map: {error}</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="component-map component-map--loading">
        <p>Loading component map…</p>
      </section>
    );
  }

  return (
    <section className="component-map">
      <header className="component-map__header">
        <h1>Component Map</h1>
        <p className="component-map__subtitle">
          UI component structure generated from the same spec source as Schema Index.
          Each entity gets its own page bundle with standard subpages.
        </p>
      </header>

      <section className="component-map__grid" aria-label="Component map list">
        <article className="component-map__diagram-card" aria-label="Component dependency graph">
          <h2>Dependency Graph</h2>
          <p>
            Directed edges show dependencies between dedicated views inferred
            from the same Data Model references (FK links) used for Schema Index.
          </p>
          <ComponentDiagramViewport key={graphSource}>
            <MermaidBlock>
              <code>{graphSource}</code>
            </MermaidBlock>
          </ComponentDiagramViewport>
        </article>

        {components.map((item) => (
          <article
            key={item.name}
            id={`component-${slugify(item.name)}`}
            className="component-card"
          >
            <div className="component-card__head">
              <h3>{item.name}</h3>
              {item.prd_id ? (
                <a href={`#/${item.prd_id}`} className="component-card__spec-link">
                  View in spec →
                </a>
              ) : null}
            </div>

            <ul className="component-card__subpages">
              {(item.subpages || []).map((sub) => (
                <li key={sub.id}>
                  <span className="component-card__arrow" aria-hidden="true">
                    ↳
                  </span>
                  <span>{sub.label}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </section>
  );
}

const ZOOM_MIN = 0.35;
const ZOOM_MAX = 3;
const ZOOM_STEP = 1.2;
const FIT_PADDING = 20;

function ComponentDiagramViewport({ children }) {
  const viewportRef = useRef(null);
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const naturalSizeRef = useRef(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [fullscreen, setFullscreen] = useState(false);
  // Esc closes fullscreen
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  const getNaturalSize = useCallback(() => {
    if (naturalSizeRef.current) return naturalSizeRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const svg = canvas.querySelector('svg');
    if (!svg) return null;

    let x = 0;
    let y = 0;
    let w = 0;
    let h = 0;
    try {
      const bbox = svg.getBBox();
      x = bbox.x;
      y = bbox.y;
      w = bbox.width;
      h = bbox.height;
    } catch {
      // ignore
    }

    if (!w || !h) {
      const vb = svg.getAttribute('viewBox');
      if (vb) {
        const parts = vb.split(/\s+/).map(Number);
        if (parts.length === 4) {
          x = parts[0];
          y = parts[1];
          w = parts[2];
          h = parts[3];
        }
      }
    }

    if (!w || !h) return null;
    naturalSizeRef.current = { x, y, w, h };
    return naturalSizeRef.current;
  }, []);

  const fit = useCallback(() => {
    const viewport = viewportRef.current;
    const natural = getNaturalSize();
    if (!viewport || !natural) return;

    const rect = viewport.getBoundingClientRect();
    // Always use the SVG's bbox x/y as the origin offset
    const scaleByWidth = (rect.width - FIT_PADDING * 2) / natural.w;
    const scaleByHeight = (rect.height - FIT_PADDING * 2) / natural.h;
    const fitScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.min(scaleByWidth, scaleByHeight)));

    setZoom(fitScale);
    setPan({
      x: (rect.width - natural.w * fitScale) / 2 - natural.x * fitScale,
      y: (rect.height - natural.h * fitScale) / 2 - natural.y * fitScale,
    });
  }, [getNaturalSize]);

  // Restore: Only fit when user clicks the Fit button (no auto-fit on mount)
  // (No effect here)

  const reset = useCallback(() => {
    setZoom(1);
    const viewport = viewportRef.current;
    const natural = getNaturalSize();
    if (!viewport || !natural) {
      setPan({ x: 0, y: 0 });
      return;
    }
    const rect = viewport.getBoundingClientRect();
    setPan({
      x: (rect.width - natural.w) / 2 - natural.x,
      y: (rect.height - natural.h) / 2 - natural.y,
    });
  }, [getNaturalSize]);

  // Improved: Always zoom towards the cursor (center), keeping the point under the cursor fixed
  const zoomBy = useCallback((factor, center) => {
    setZoom((z) => {
      const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z * factor));
      if (center && next !== z) {
        setPan((p) => {
          // Calculate the world coordinates under the cursor before zoom
          const wx = (center.x - p.x) / z;
          const wy = (center.y - p.y) / z;
          // After zoom, pan so that the same world point is under the cursor
          return {
            x: center.x - wx * next,
            y: center.y - wy * next,
          };
        });
      }
      return next;
    });
  }, []);

  const onWheel = useCallback(
    (e) => {
      e.preventDefault();
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return;
      const center = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      zoomBy(e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP, center);
    },
    [zoomBy]
  );

  const onPointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    viewportRef.current?.setPointerCapture(e.pointerId);
  }, [pan.x, pan.y]);

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
    if (viewportRef.current?.hasPointerCapture(e.pointerId)) {
      viewportRef.current.releasePointerCapture(e.pointerId);
    }
  }, []);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  // (Removed: old fit effect, replaced by above)

  return (
    <div className="component-map-diagram-shell">
      <div className="component-map-diagram-controls">
        <button type="button" onClick={() => zoomBy(1 / ZOOM_STEP)} aria-label="Zoom out">
          −
        </button>
        <span className="component-map-diagram-zoom">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => zoomBy(ZOOM_STEP)} aria-label="Zoom in">
          +
        </button>
        <button type="button" onClick={fit}>Fit</button>
        <button type="button" onClick={reset}>Reset</button>
        <button type="button" onClick={() => setFullscreen((v) => !v)}>
          {fullscreen ? 'Close' : 'Fullscreen'}
        </button>
      </div>

      <div
        ref={viewportRef}
        className={`component-map-diagram-viewport${fullscreen ? ' is-fullscreen' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div
          ref={canvasRef}
          className="component-map-diagram-canvas"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
