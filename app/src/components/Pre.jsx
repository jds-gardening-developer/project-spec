/**
 * Pre — dispatcher for fenced code blocks.
 *  - If the inner <code> has className "language-mermaid", render via MermaidBlock (Plan 03 / REND-04).
 *  - Otherwise render a plain <pre> (Plan 05 / REND-05 will wrap this branch with a copy button).
 *
 * D-13: copy button is excluded from mermaid blocks. The branching here enforces that.
 */
import { MermaidBlock } from './MermaidPre.jsx';

function getCodeChildClassName(children) {
  // react-markdown passes a single <code> child; its className carries the fence language.
  // children may be a single React element or an array containing it.
  const arr = Array.isArray(children) ? children : [children];
  for (const child of arr) {
    if (child && child.props && typeof child.props.className === 'string') {
      return child.props.className;
    }
  }
  return '';
}

export function Pre({ children, ...props }) {
  const cls = getCodeChildClassName(children);
  if (cls.includes('language-mermaid')) {
    return <MermaidBlock>{children}</MermaidBlock>;
  }
  // Stub: default <pre>. Plan 05 wraps this branch with a copy button.
  return <pre {...props}>{children}</pre>;
}
