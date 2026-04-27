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
  const lines = ['erDiagram'];

  for (const entity of data.entities) {
    lines.push(`    "${entity.name}" {`);
    const fields = entity.fields || [];
    const shown = fields.slice(0, DIAGRAM_FIELD_CAP);
    for (const field of shown) {
      const safeType = safeMermaidIdent(field.type || 'string') || 'string';
      const safeName = safeMermaidIdent(field.name || 'field');
      lines.push(`        ${safeType} ${safeName}`);
    }
    lines.push('    }');
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
