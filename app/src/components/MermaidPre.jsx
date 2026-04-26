/**
 * MermaidBlock — renders a ```mermaid fenced block as a live diagram.
 * Plan 03 (REND-04) replaces the stub with dynamic-import mermaid (D-02), parse-error
 * banner (D-03), and securityLevel: 'strict' init.
 */
export function MermaidBlock({ children }) {
  // Stub: render the source as a plain <pre> (Phase 1 fallback). Plan 03 swaps this for an SVG render.
  return <pre className="mermaid-source-stub">{children}</pre>;
}
