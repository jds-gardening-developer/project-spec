import { useEffect, useMemo, useState } from 'react';
import { MermaidBlock } from './MermaidPre.jsx';
import { buildErDiagramSource, slugify, sortedEntities } from './SchemaPage.helpers.js';
import './SchemaPage.css';

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
        <MermaidBlock>
          <code>{erSource}</code>
        </MermaidBlock>
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
