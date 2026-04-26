import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Vite project root is `app/`. Markdown content lives in `../project-spec/`,
// outside the Vite root, so we extend `server.fs.allow` to include the repo root.
export default defineConfig({
  root: __dirname,
  plugins: [react()],
  server: {
    port: 5173,
    fs: {
      // Allow access to ../project-spec (and the rest of the repo root) so Plan 02
      // can import markdown via `import.meta.glob('../../project-spec/*.md', { query: '?raw' })`.
      allow: [path.resolve(__dirname, '..')]
    }
  }
});
