/**
 * remarkCrossLinks — rewrites inline `(see PRD-X)` and `(see PRD-X.Y)` references
 * in body text into mdast `link` nodes pointing at `#prd-x-y` anchors.
 *
 * Plan 02 of Phase 2 (REND-02). Implements CONTEXT.md decisions D-04, D-05, D-18.
 *
 * Detection rule (D-04):
 *   - Match the literal sequence `see PRD-N` or `see PRD-N.M` after an opening paren
 *     and before either a comma+space (continuation) or a closing paren / end of group.
 *   - Comma-separated lists like `(see PRD-1, PRD-3.4)` produce multiple links.
 *   - Bare PRD-X.Y (no `see` prefix) is NOT linked — avoids false positives in headings/tables.
 *   - Skip text nodes whose ancestor chain includes a `code`, `inlineCode`, or `heading` parent.
 *
 * Anchor format (D-05): `#prd-X-Y` (lowercase, dot replaced with dash). rehype-slug
 * generates heading IDs like `prd-1-1-plant-variants`; the `<a>` href is a prefix the
 * click handler in CrossLinkText.jsx resolves to the actual heading id at click time.
 *
 * Surrounding `(see ` and `)` characters remain as plain text nodes around the link(s)
 * so the visible reading-flow still includes the parens — only the PRD token itself
 * becomes the clickable anchor.
 *
 * Walk strategy: a small recursive walker over `children` arrays, mutating in place.
 * No `unist-util-visit` import needed — keeps the plugin to pure mdast operations and
 * avoids adding a new transitive dep beyond what remark-gfm already brings in.
 */

// Match a single PRD identifier inside the comma-list:  `PRD-1` or `PRD-3.4`. Capture the digits.
const PRD_TOKEN = /PRD-(\d+(?:\.\d+)?)/g;

// Match the surrounding `(see ... )` group. Capture the inner list of identifiers.
// Tolerate spaces around commas inside the list. Non-capturing group for the comma-tail.
const SEE_GROUP = /\(see\s+(PRD-\d+(?:\.\d+)?(?:\s*,\s*PRD-\d+(?:\.\d+)?)*)\s*\)/g;

const SKIP_PARENT_TYPES = new Set(['code', 'inlineCode', 'heading']);

function shouldSkip(ancestors) {
  for (const a of ancestors) {
    if (SKIP_PARENT_TYPES.has(a.type)) return true;
  }
  return false;
}

function prdToAnchor(token) {
  // 'PRD-1.1' -> 'prd-1-1'; 'PRD-3' -> 'prd-3'
  return token.toLowerCase().replace(/\./g, '-');
}

function buildLinkNode(token) {
  const anchor = prdToAnchor(token);
  return {
    type: 'link',
    url: '#' + anchor,
    title: null,
    children: [{ type: 'text', value: token }],
    data: {
      hProperties: {
        className: ['cross-link'],
        'data-prd-id': anchor,
      },
    },
  };
}

/**
 * Split a single text-node value into an array of mdast nodes (text and/or link)
 * after cross-link substitution.
 *
 * Returns null if no `(see PRD-...)` group was found, signalling "leave the original
 * text node as-is" — important for idempotency (a tree containing only already-converted
 * link nodes has no remaining text-node matches, so a second walk is a no-op).
 */
function splitTextNode(value) {
  SEE_GROUP.lastIndex = 0;
  const out = [];
  let lastIndex = 0;
  let groupMatch;
  let foundAny = false;

  while ((groupMatch = SEE_GROUP.exec(value)) !== null) {
    foundAny = true;
    const [fullGroup, inner] = groupMatch;
    const groupStart = groupMatch.index;
    const groupEnd = groupStart + fullGroup.length;

    // Locate the start of the inner identifier list inside the matched group.
    // The text before that point is preserved literally (it ends with `(see `).
    const prefixEnd = value.indexOf(inner, groupStart);
    const beforeText = value.slice(lastIndex, prefixEnd);
    if (beforeText.length > 0) out.push({ type: 'text', value: beforeText });

    // Walk the inner list, capturing each PRD token and the literal commas/spaces between.
    PRD_TOKEN.lastIndex = 0;
    let innerLast = 0;
    let tokenMatch;
    while ((tokenMatch = PRD_TOKEN.exec(inner)) !== null) {
      const sep = inner.slice(innerLast, tokenMatch.index);
      if (sep.length > 0) out.push({ type: 'text', value: sep });
      out.push(buildLinkNode(tokenMatch[0]));
      innerLast = tokenMatch.index + tokenMatch[0].length;
    }
    const trailingInner = inner.slice(innerLast);
    if (trailingInner.length > 0) out.push({ type: 'text', value: trailingInner });

    // The closing `)` (plus any whitespace between the last token and it) is intentionally
    // NOT emitted as a separate text node. Instead, advance `lastIndex` to the position
    // right after the inner list so the closing paren is absorbed into the next
    // iteration's `beforeText` (or the final `tail`). This produces one merged text node
    // like `") bar."` instead of two split nodes `")"` + `" bar."`.
    const afterInnerStart = prefixEnd + inner.length;
    lastIndex = afterInnerStart;
  }

  if (!foundAny) return null;

  const tail = value.slice(lastIndex);
  if (tail.length > 0) out.push({ type: 'text', value: tail });
  return out;
}

function walk(node, ancestors) {
  if (!node || !node.children) return;
  const next = ancestors.concat(node);
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (child.type === 'text' && !shouldSkip(next)) {
      const replacement = splitTextNode(child.value);
      if (replacement !== null) {
        node.children.splice(i, 1, ...replacement);
        i += replacement.length - 1;
      }
    } else if (child.children) {
      walk(child, next);
    }
  }
}

export default function remarkCrossLinks() {
  return function transform(tree) {
    walk(tree, []);
    return tree;
  };
}
