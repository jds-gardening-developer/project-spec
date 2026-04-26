import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * SpecViewer — renders a markdown string with GitHub-flavored markdown support.
 *
 * Phase 1 scope:
 *   - GFM tables, fenced code, strikethrough (REND-01)
 *   - Default react-markdown sanitization (no rehype-raw, no HTML passthrough)
 *
 * Out of scope here (later phases):
 *   - Cross-link rewriting (Phase 2 / REND-02)
 *   - Data-model card renderer (Phase 2 / REND-03)
 *   - Mermaid blocks (Phase 2 / REND-04)
 *   - Copy-code buttons (Phase 2 / REND-05)
 *   - Syntax highlighting
 *   - Theming (Phase 4)
 */
export default function SpecViewer({ markdown }) {
  if (typeof markdown !== 'string') {
    return <p>Loading…</p>;
  }
  if (markdown.length === 0) {
    return <p>(spec file is empty)</p>;
  }
  return (
    <article className="spec-viewer">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </article>
  );
}
