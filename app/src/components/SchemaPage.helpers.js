/**
 * SchemaPage helpers — pure JS, no JSX. Extracted from SchemaPage.jsx so the
 * mermaid-source synthesis + slug logic can run under `node --test` without
 * the JSX/CSS import overhead.
 *
 * SchemaPage.jsx re-imports these names so production behaviour is identical
 * to what's covered here.
 */

// Lowercase + non-alphanum → '-' (collapses runs, trims leading/trailing dashes).
// Same scheme used for prd_id slugs in build-schema-index.mjs / build-search-index.mjs.
export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Mermaid identifiers can't contain spaces or special chars in attribute names —
// sanitise to [A-Za-z0-9_], collapse stray underscores at the boundaries.
export function safeMermaidIdent(text) {
  const cleaned = String(text).replace(/[^A-Za-z0-9_]/g, '_');
  const trimmed = cleaned.replace(/^_+|_+$/g, '');
  return trimmed || 'unnamed';
}

// Cap field count per entity inside the diagram so it stays legible. The full
// reference is rendered below in the <article>s — the diagram is just an at-
// a-glance overview.
export const DIAGRAM_FIELD_CAP = 6;

/**
 * Synthesise a Mermaid `erDiagram` source string from a schema-index payload.
 *
 *   data = {
 *     entities:      [{ name, prd_id, fields: [{ name, type, notes }] }],
 *     relationships: [{ from, to, label }]
 *   }
 *
 * Output is one string ready to feed into <MermaidBlock>. Returns 'erDiagram\n'
 * for empty / malformed input so the renderer still produces an empty diagram
 * frame instead of crashing.
 */
export function buildErDiagramSource(data) {
  if (!data || !Array.isArray(data.entities)) return 'erDiagram\n';
  // Entity-name-only ER diagram. The full field list is rendered in the
  // <article> cards below the diagram, so duplicating fields inside the
  // diagram boxes just makes the whole thing illegible. Mermaid accepts a
  // bare entity name on its own line as an "orphan" declaration — needed
  // because some entities have no FK relationships.
  const lines = ['erDiagram'];

  for (const entity of data.entities) {
    lines.push(`    "${entity.name}"`);
  }

  const rels = Array.isArray(data.relationships) ? data.relationships : [];
  for (const rel of rels) {
    const safeLabel = String(rel.label || '').replace(/"/g, '\\"');
    lines.push(`    "${rel.from}" }o--|| "${rel.to}" : "${safeLabel}"`);
  }

  return lines.join('\n');
}

/**
 * Stable alphabetical sort of entities for the reference list. Returns a new
 * array (does not mutate the input).
 */
export function sortedEntities(entities) {
  if (!Array.isArray(entities)) return [];
  return [...entities].sort((a, b) => a.name.localeCompare(b.name));
}
