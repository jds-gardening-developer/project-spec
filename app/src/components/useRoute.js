/**
 * useRoute — minimal hash-router hook for the Schema Index page (260427-gjf).
 *
 * Returns 'schema' when the URL hash is #/schema (with or without a trailing
 * sub-path), and 'spec' otherwise — including the empty hash, plain section
 * anchors like #prd-1-1, and Phase-3-style #/prd-1-1 deep-links.
 *
 * The schema page is the only non-spec route in v1; if more routes appear,
 * widen the union returned by parseHashRoute (and its callers) accordingly.
 *
 * Why a hand-rolled hook instead of react-router:
 *   - The viewer is a static SPA with one extra page. Pulling in a router
 *     would push the main bundle past the 100 KB soft budget for no benefit.
 *   - hashchange + a tiny parser is enough.
 */
import { useEffect, useState } from 'react';

const SCHEMA_ROUTE_RE = /^#?\/?schema(?:\/.*)?$/i;

/**
 * Parse a `location.hash` string and return the route name.
 *   '#/schema'        → 'schema'
 *   '#/schema/foo'    → 'schema'
 *   '#schema'         → 'schema'  (tolerant of missing slash)
 *   '#/prd-1-1'       → 'spec'
 *   '#prd-1-1'        → 'spec'
 *   ''                → 'spec'
 *   null / undefined  → 'spec'
 */
export function parseHashRoute(hash) {
  if (typeof hash !== 'string') return 'spec';
  return SCHEMA_ROUTE_RE.test(hash) ? 'schema' : 'spec';
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
