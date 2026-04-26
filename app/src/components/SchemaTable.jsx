/**
 * SchemaOrTable — custom <table> renderer.
 * Plan 04 (REND-03) replaces the stub with: detect 3-col Field|Type|Notes header (D-08),
 * render schema card (D-09), preserve backslash escapes (D-10), FK chip (D-11),
 * CSS custom properties (D-12).
 *
 * The pure-JS detection + traversal logic lives in SchemaTable.helpers.js so it is
 * testable under `node --test` (which cannot parse JSX).
 */
export function SchemaOrTable({ children, ...props }) {
  // Stub: render default table. Plan 04 inspects children for thead and routes.
  return <table {...props}>{children}</table>;
}
