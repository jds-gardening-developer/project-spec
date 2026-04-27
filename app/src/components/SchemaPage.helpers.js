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

/**
 * Mermaid attribute-name token rule: only a SINGLE underscore is allowed
 * between alphanumerics — runs of underscores break the parser. Collapse any
 * non-alphanum run to one underscore, then strip leading/trailing underscores.
 */
function mermaidAttrName(text) {
  const collapsed = String(text).replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return collapsed || 'field';
}

/**
 * Mermaid attribute-type tokens are positional (first non-whitespace word on
 * the line) and disallow spaces. Common field types in the spec — "FK → Plant",
 * "date (nullable)", "decimal" — get squashed to alphanum + underscore.
 */
function mermaidAttrType(text) {
  const collapsed = String(text || 'string')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return collapsed || 'string';
}

/**
 * Synthesise a Mermaid `erDiagram` source string from a schema-index payload.
 *
 *   data = {
 *     entities:      [{ name, prd_id, fields: [{ name, type, notes }] }],
 *     relationships: [{ from, to, label }]
 *   }
 *
 * Each entity is rendered with its FULL field list inside a `{ ... }` block.
 * The reference cards below the diagram show the same data with proper
 * formatting (FK arrows, nullability, notes) — the diagram trades pretty
 * formatting for at-a-glance shape, so we sanitise field names/types into
 * Mermaid-safe identifiers.
 *
 * Returns 'erDiagram\n' for empty / malformed input so the renderer still
 * produces an empty diagram frame instead of crashing.
 */
export function buildErDiagramSource(data) {
  if (!data || !Array.isArray(data.entities)) return 'erDiagram\n';
  const lines = ['erDiagram'];

  for (const entity of data.entities) {
    const fields = Array.isArray(entity.fields) ? entity.fields : [];
    if (fields.length === 0) {
      // Bare-name declaration for entities with no recorded fields.
      lines.push(`    "${entity.name}"`);
      continue;
    }
    lines.push(`    "${entity.name}" {`);
    for (const field of fields) {
      const type = mermaidAttrType(field.type);
      const name = mermaidAttrName(field.name || 'field');
      lines.push(`        ${type} ${name}`);
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
