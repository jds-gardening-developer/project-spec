/**
 * CrossLinkAnchor — custom <a> renderer for react-markdown.
 * Plan 02 (REND-02) replaces the stub body with click-time target resolution +
 * scrollIntoView + broken-link fallback (D-06, D-07).
 */
export function CrossLinkAnchor({ href, children, ...props }) {
  // Stub: render default anchor. Plan 02 adds the click handler that resolves the target,
  // scrolls smoothly, updates the hash, or falls back to a dimmed span on miss.
  return <a href={href} {...props}>{children}</a>;
}
