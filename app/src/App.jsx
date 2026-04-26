import { useEffect, useState } from 'react';
import SpecViewer from './SpecViewer.jsx';
import manifest from './manifest.json';

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

  // Manifest is sorted newest-first by build-manifest.mjs.
  const newest = manifest[0];

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
        <h1>MacPlants ERP — Specification</h1>
        <p style={{ color: 'crimson' }}>Error: {error}</p>
      </main>
    );
  }

  return (
    <main>
      <header>
        <small>
          Viewing: <code>project-spec/{newest?.filename}</code>
        </small>
      </header>
      <SpecViewer markdown={content} />
    </main>
  );
}
