import { lazy, Suspense, useEffect, useState } from 'react';
import SpecViewer from './SpecViewer.jsx';
import manifest from './manifest.json';
import { Sidebar } from './components/Sidebar.jsx';
import { SearchPanel } from './components/SearchPanel.jsx';
import { ThemeToggle } from './components/ThemeToggle.jsx';
import { useHashScroll } from './components/useHashScroll.js';
import { useRoute } from './components/useRoute.js';

// React.lazy ensures SchemaPage + its dynamic-imported schema-index.json land
// in their own Vite chunks. The main bundle gains only the lazy() wrapper.
const SchemaPage = lazy(() => import('./components/SchemaPage.jsx'));

// Vite globs — resolved at build time. Keys are import paths relative to this
// file; values are functions returning Promise<string of file contents>.
// vite.config.js#server.fs.allow permits the whole repo root, so both
// project-spec/ and stage-2/ are reachable.
const specLoaders = import.meta.glob('../../project-spec/*.md', {
  query: '?raw',
  import: 'default',
});
const stage2Loaders = import.meta.glob('../../stage-2/*.md', {
  query: '?raw',
  import: 'default',
});

function loaderKeyFor(filename) {
  return `../../project-spec/${filename}`;
}

export default function App() {
  const [content, setContent] = useState(null);
  const [stage2Content, setStage2Content] = useState(null);
  const [error, setError] = useState(null);
  const route = useRoute();

  // Manifest is sorted newest-first by build-manifest.mjs.
  const newest = manifest[0];

  // Gate hash-driven scroll to markdown-content routes only — on #/schema we
  // don't want useHashScroll to chase '/schema' as a heading id.
  const activeMarkdown =
    route === 'spec' ? content : route === 'stage-2' ? stage2Content : null;
  useHashScroll(activeMarkdown);

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

  useEffect(() => {
    if (route !== 'stage-2' || stage2Content !== null) return;
    const loader = stage2Loaders['../../stage-2/index.md'];
    if (!loader) {
      setError('stage-2/index.md not found.');
      return;
    }
    let cancelled = false;
    loader().then(
      (text) => {
        if (!cancelled) setStage2Content(text);
      },
      (err) => {
        if (!cancelled) setError(`Failed to load stage-2/index.md: ${err.message}`);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [route, stage2Content]);

  if (error) {
    return (
      <>
        <ThemeToggle />
        <main>
          <p style={{ color: 'crimson' }}>Error: {error}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <ThemeToggle />
      <div className="app-shell">
        <Sidebar />
        <main className="app-main">
          {route === 'schema' ? (
            <Suspense fallback={<p>Loading schema…</p>}>
              <SchemaPage />
            </Suspense>
          ) : route === 'stage-2' ? (
            <>
              <header>
                <small>
                  Viewing: <code>stage-2/index.md</code>
                </small>
              </header>
              <SpecViewer markdown={stage2Content} />
            </>
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
    </>
  );
}
