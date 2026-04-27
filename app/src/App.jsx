import { lazy, Suspense, useEffect, useState } from 'react';
import SpecViewer from './SpecViewer.jsx';
import manifest from './manifest.json';
import { Sidebar } from './components/Sidebar.jsx';
import { SearchPanel } from './components/SearchPanel.jsx';
import { useHashScroll } from './components/useHashScroll.js';
import { useRoute } from './components/useRoute.js';

// React.lazy ensures SchemaPage + its dynamic-imported schema-index.json land
// in their own Vite chunks. The main bundle gains only the lazy() wrapper.
const SchemaPage = lazy(() => import('./components/SchemaPage.jsx'));

// Vite glob — resolved at build time. Keys are import paths relative to this file;
// values are functions returning Promise<string of file contents>.
// vite.config.js#server.fs.allow already permits ../../project-spec.
const specLoaders = import.meta.glob('../../project-spec/*.md', {
  query: '?raw',
  import: 'default',
});

function loaderKeyFor(filename) {
  return `../../project-spec/${filename}`;
}

export default function App() {
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);
  const route = useRoute();

  // Manifest is sorted newest-first by build-manifest.mjs.
  const newest = manifest[0];

  // Gate hash-driven scroll to the spec route only — on #/schema we don't
  // want useHashScroll to chase '/schema' as a heading id.
  useHashScroll(route === 'spec' ? content : null);

  useEffect(() => {
    if (!newest) {
      setError('No dated spec files found in project-spec/.');
      return;
    }
    const key = loaderKeyFor(newest.filename);
    const loader = specLoaders[key];
    if (!loader) {
      setError(
        `Manifest entry ${newest.filename} has no matching file under project-spec/. ` +
          `Run \`npm run build-manifest\` and restart the dev server.`
      );
      return;
    }
    let cancelled = false;
    loader().then(
      (text) => {
        if (!cancelled) setContent(text);
      },
      (err) => {
        if (!cancelled) setError(`Failed to load ${newest.filename}: ${err.message}`);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [newest]);

  if (error) {
    return (
      <main>
        <p style={{ color: 'crimson' }}>Error: {error}</p>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        {route === 'schema' ? (
          <Suspense fallback={<p>Loading schema…</p>}>
            <SchemaPage />
          </Suspense>
        ) : (
          <>
            <header>
              <small>
                Viewing: <code>project-spec/{newest?.filename}</code>
              </small>
            </header>
            <SpecViewer markdown={content} />
          </>
        )}
      </main>
      <SearchPanel />
    </div>
  );
}
