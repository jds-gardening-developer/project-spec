/**
 * useRoute — minimal hash-router hook for non-spec pages (260427-gjf).
 *
 * Returns one of:
 *   - 'schema'  when the URL hash is #/schema (with or without a sub-path)
 *   - 'stage-2' when the URL hash is #/stage-2 (with or without a sub-path)
 *   - 'spec'    otherwise — including the empty hash, plain section
 *               anchors like #prd-1-1, and Phase-3-style #/prd-1-1 deep-links
 *
 * If more routes appear, widen the union returned by parseHashRoute (and its
 * callers) accordingly.
 *
 * Why a hand-rolled hook instead of react-router:
 *   - The viewer is a static SPA with a couple of extra pages. Pulling in a
 *     router would push the main bundle past the 100 KB soft budget for no
 *     benefit.
 *   - hashchange + a tiny parser is enough.
 */
import { useEffect, useState } from 'react';

const SCHEMA_ROUTE_RE = /^#?\/?schema(?:\/.*)?$/i;
const STAGE2_ROUTE_RE = /^#?\/?stage-2(?:\/.*)?$/i;

/**
 * Parse a `location.hash` string and return the route name.
 *   '#/schema'        → 'schema'
 *   '#/schema/foo'    → 'schema'
 *   '#schema'         → 'schema'  (tolerant of missing slash)
 *   '#/stage-2'       → 'stage-2'
 *   '#stage-2'        → 'stage-2'
 *   '#/prd-1-1'       → 'spec'
 *   '#prd-1-1'        → 'spec'
 *   ''                → 'spec'
 *   null / undefined  → 'spec'
 */
export function parseHashRoute(hash) {
  if (typeof hash !== 'string') return 'spec';
  if (SCHEMA_ROUTE_RE.test(hash)) return 'schema';
  if (STAGE2_ROUTE_RE.test(hash)) return 'stage-2';
  return 'spec';
}

export function useRoute() {
  const [route, setRoute] = useState(() =>
    typeof window === 'undefined' ? 'spec' : parseHashRoute(window.location.hash)
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onHash = () => setRoute(parseHashRoute(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return route;
}
