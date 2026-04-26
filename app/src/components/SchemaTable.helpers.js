/**
 * SchemaTable helpers — pure JS, no JSX.
 *
 * These functions are exported separately from SchemaTable.jsx so they can be unit-tested
 * under `node --test` (Node 20+ has no built-in JSX parser, so a `.test.js` file that
 * imports a `.jsx` file would fail at module load).
 *
 * The helpers operate on plain JS object trees of the shape `{type, props: {children}}`,
 * which is exactly the shape of React elements. In production, SchemaTable.jsx passes
 * `props.children` from react-markdown into these helpers; in tests, hand-built fixtures
 * with the same shape work without React.
 *
 * Functions:
 *   - isSchemaHeader(headerCells)        — D-08 detection (3-col field|type|notes)
 *   - extractHeaderCells(reactChildren)  — walk to find thead's <tr> cell text
 *   - extractBodyRows(reactChildren)     — walk to find tbody rows, preserve cell children
 *   - detectFkType(typeText)             — D-11 (returns whether type contains FK arrow)
 */

/**
 * Read text content from a React-element-like tree. Strings/numbers return as-is;
 * arrays are concatenated; objects with `props.children` recurse.
 */
function readText(el) {
  if (el == null) return '';
  if (typeof el === 'string' || typeof el === 'number') return String(el);
  if (Array.isArray(el)) return el.map(readText).join('');
  if (el.props && el.props.children !== undefined) return readText(el.props.children);
  return '';
}

/**
 * D-08 — detect the schema-card header.
 * Header qualifies iff it is an array of length 3 whose entries, lowercased and trimmed,
 * equal ['field', 'type', 'notes'].
 */
export function isSchemaHeader(headerCells) {
  if (!Array.isArray(headerCells) || headerCells.length !== 3) return false;
  const normalized = headerCells.map((h) => String(h).trim().toLowerCase());
  return normalized[0] === 'field' && normalized[1] === 'type' && normalized[2] === 'notes';
}

/**
 * Walk children for a <thead> > <tr> > <th>* sequence and return the array of header text
 * values (strings). Returns null if the structure is missing.
 */
export function extractHeaderCells(children) {
  const arr = Array.isArray(children) ? children : [children];
  for (const child of arr) {
    if (!child || child.type !== 'thead') continue;
    const tr = childByType(child, 'tr');
    if (!tr) continue;
    const ths = childrenByType(tr, 'th');
    return ths.map((th) => readText(th.props && th.props.children));
  }
  return null;
}

/**
 * Walk children for a <tbody> > <tr>* > <td>* sequence and return rows-of-cells. Each cell
 * is the raw `children` value from the <td> (preserving strings, including backslash
 * escapes, and any nested elements like <em> for italics).
 */
export function extractBodyRows(children) {
  const arr = Array.isArray(children) ? children : [children];
  for (const child of arr) {
    if (!child || child.type !== 'tbody') continue;
    const trs = childrenByType(child, 'tr');
    return trs.map((tr) => {
      const tds = childrenByType(tr, 'td');
      return tds.map((td) => (td.props ? td.props.children : ''));
    });
  }
  return [];
}

/**
 * D-11 — does the type text contain the FK arrow? Used by SchemaTable.jsx to decide chip
 * style. The arrow character is preserved literally in the rendered chip; this helper
 * just exposes presence as a boolean.
 */
export function detectFkType(typeText) {
  if (typeof typeText !== 'string' || typeText.length === 0) return false;
  return typeText.includes('FK →');
}

// ---- internals ----

function childByType(parent, type) {
  const arr = Array.isArray(parent.props && parent.props.children)
    ? parent.props.children
    : [parent.props && parent.props.children];
  for (const c of arr) {
    if (c && c.type === type) return c;
  }
  return null;
}

function childrenByType(parent, type) {
  const arr = Array.isArray(parent.props && parent.props.children)
    ? parent.props.children
    : [parent.props && parent.props.children];
  return arr.filter((c) => c && c.type === type);
}
