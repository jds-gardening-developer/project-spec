/**
 * SchemaTable helpers — pure JS, no JSX.
 *
 * Lives in a `.js` file (not `.jsx`) so it can be imported and exercised by
 * `app/src/components/SchemaTable.test.js` running under `node --test`. Node 20+
 * does not have a built-in JSX parser; keeping all testable logic here lets us
 * validate detection + AST traversal without spinning up Vitest / esbuild / babel.
 *
 * Plan 04 (REND-03) fills in:
 *   - isSchemaHeader(headerCells)        — D-08 detection rule (3-col field|type|notes)
 *   - extractHeaderCells(reactChildren)  — walk React children to find thead row
 *   - extractBodyRows(reactChildren)     — walk React children to find tbody rows
 *   - detectFkType(typeText)             — D-11 (returns whether the type text contains
 *                                         the FK arrow so SchemaTable.jsx can chip it)
 *
 * Stub: no exports yet. Plan 04 adds the four named exports above.
 */
// Intentionally empty. Plan 04 fills in pure helpers.
export {};
