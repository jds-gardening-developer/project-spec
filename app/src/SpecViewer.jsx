import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import remarkCrossLinks from './components/crossLinkPlugin.js';
import { CrossLinkAnchor } from './components/CrossLinkText.jsx';
import { SchemaOrTable } from './components/SchemaTable.jsx';
import { Pre } from './components/Pre.jsx';

/**
 * SpecViewer — renders the spec markdown with Phase 2 enrichments wired in.
 *
 * Pipeline:
 *   - remarkGfm:        GFM tables, fenced code, strikethrough (REND-01, Phase 1)
 *   - remarkCrossLinks: rewrites `(see PRD-X.Y)` text into <a> link nodes (REND-02, Plan 02)
 *   - rehypeSlug:       auto-IDs on headings so cross-links can resolve targets (REND-02, D-05)
 *
 * Component overrides (D-17):
 *   - a:     CrossLinkAnchor — handles click-to-scroll + broken-link fallback (REND-02)
 *   - table: SchemaOrTable    — schema-card vs plain-table dispatch (REND-03)
 *   - pre:   Pre               — copy-button + mermaid-block dispatch (REND-04, REND-05)
 *
 * Default react-markdown sanitization is preserved — NO rehype-raw, NO HTML passthrough.
 */
const components = {
  a: CrossLinkAnchor,
  table: SchemaOrTable,
  pre: Pre,
};

const remarkPlugins = [remarkGfm, remarkCrossLinks];
const rehypePlugins = [rehypeSlug];

export default function SpecViewer({ markdown }) {
  if (typeof markdown !== 'string') {
    return <p>Loading…</p>;
  }
  if (markdown.length === 0) {
    return <p>(spec file is empty)</p>;
  }
  return (
    <article className="spec-viewer">
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  );
}
