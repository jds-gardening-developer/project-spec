import './SchemaTable.css';
import { isSchemaHeader, extractHeaderCells, extractBodyRows, detectFkType } from './SchemaTable.helpers.js';

/**
 * SchemaOrTable — react-markdown <table> override.
 *
 * Detection (D-08): exactly 3 columns AND header row text content,
 * lowercased and trimmed cell-by-cell, equals ["field", "type", "notes"].
 * Detection logic lives in SchemaTable.helpers.js so it is JSX-free and
 * unit-testable under `node --test`.
 *
 * On match → render schema card (D-09).
 * On miss  → render default <table> with all original children.
 *
 * D-10: cell content is rendered through React's normal text-child path; backslash
 * escapes survive untouched (React does not interpret them as escape sequences).
 * D-11: type cells containing `FK →` get a `--fk` modifier class on the chip; the
 * arrow itself is rendered literally.
 * D-12: all colors come from CSS custom properties set in styles.css (Plan 01).
 */
export function SchemaOrTable({ children, ...props }) {
  const headerCells = extractHeaderCells(children);
  if (!isSchemaHeader(headerCells)) {
    // Fall through: regular table.
    return <table {...props}>{children}</table>;
  }

  const rows = extractBodyRows(children);

  return (
    <div className="schema-card" role="group" aria-label="Data model">
      <div className="schema-card__rows">
        {rows.map((row, idx) => {
          const typeText = readChildText(row[1]);
          const isFk = detectFkType(typeText);
          return (
            <div className="schema-card__row" key={idx}>
              <div className="schema-card__field">{row[0]}</div>
              <div className="schema-card__type">
                <span className={'schema-card__type-chip' + (isFk ? ' schema-card__type-chip--fk' : '')}>
                  {row[1]}
                </span>
              </div>
              <div className="schema-card__notes">{row[2]}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Minimal local readText — duplicated from helpers (which is JSX-free) so the JSX file
// does not pull the helper into the render path for non-schema tables.
function readChildText(el) {
  if (el == null) return '';
  if (typeof el === 'string' || typeof el === 'number') return String(el);
  if (Array.isArray(el)) return el.map(readChildText).join('');
  if (el.props && el.props.children !== undefined) return readChildText(el.props.children);
  return '';
}
