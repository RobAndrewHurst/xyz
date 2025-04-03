import { defineConfig } from 'vite';
import path from 'path';
import { globSync } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find all HTML files in public/views and create the input object for Rollup
const input = Object.fromEntries(
  globSync('public/views/**/*.html', { cwd: __dirname, absolute: true }).map(
    (file) => [
      path
        .relative('public/views', file.slice(__dirname.length + 1))
        .replace(/\.html$/, ''),
      file,
    ],
  ),
);

export default defineConfig(() => {
  return {
    publicDir: 'public', // Static assets that should be copied as-is
    build: {
      target: 'esnext',
      outDir: path.resolve(__dirname, 'dist'),
      emptyOutDir: true, // Clear the folder on build
      rollupOptions: {
        input: input, // Specify multiple HTML entry points
      },
    },
  };
});
