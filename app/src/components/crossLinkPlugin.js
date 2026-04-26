/**
 * crossLinkPlugin — remark plugin that rewrites inline "(see PRD-X.Y)" cross-references
 * into <a> link nodes. Plan 02 (REND-02) replaces this stub with the real implementation.
 *
 * Stub behavior: identity transformer (no-op). Mounted by SpecViewer in Plan 01 so the
 * remarkPlugins array is locked in; Plan 02 only edits this file's body.
 */
export default function remarkCrossLinks() {
  return function transform(tree) {
    // Stub: no-op. Plan 02 will walk text nodes here and split them into link nodes.
    return tree;
  };
}
