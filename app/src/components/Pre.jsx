/**
 * Pre — react-markdown <pre> override.
 *
 *   - language-mermaid → MermaidBlock (Plan 03 / REND-04)
 *   - else            → <div class="copy-button-wrapper"> + <CopyButton> + <pre>
 *
 * D-13 enforced: mermaid blocks render as diagrams, NOT as code-with-copy-button.
 * D-14: copy button is always visible, positioned top-right inside the wrapper.
 */
import { MermaidBlock } from './MermaidPre.jsx';
import { CopyButton } from './CopyButton.jsx';

function getCodeChildClassName(children) {
  const arr = Array.isArray(children) ? children : [children];
  for (const child of arr) {
    if (child && child.props && typeof child.props.className === 'string') {
      return child.props.className;
    }
  }
  return '';
}

function getCodeText(children) {
  // The <pre>'s child is a <code> element; its children is the source string.
  const arr = Array.isArray(children) ? children : [children];
  for (const child of arr) {
    if (child && child.props && child.props.children !== undefined) {
      const inner = child.props.children;
      if (typeof inner === 'string') return inner;
      if (Array.isArray(inner)) return inner.filter((x) => typeof x === 'string').join('');
    }
  }
  return '';
}

export function Pre({ children, ...props }) {
  const cls = getCodeChildClassName(children);
  if (cls.includes('language-mermaid')) {
    return <MermaidBlock>{children}</MermaidBlock>;
  }
  const text = getCodeText(children);
  return (
    <div className="copy-button-wrapper" style={{ position: 'relative' }}>
      <CopyButton text={text} />
      <pre {...props}>{children}</pre>
    </div>
  );
}
