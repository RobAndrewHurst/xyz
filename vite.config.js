import legacy from '@vitejs/plugin-legacy';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11'],
      modernPolyfills: true,
      renderLegacyChunks: true,
    }),
  ],

  // Build configuration to match current esbuild setup
  build: {
    target: 'baseline-widely-available', // Use Vite 7's new default target
    outDir: 'public/js',
    emptyOutDir: false, // Don't clear the entire output directory
    rollupOptions: {
      input: {
        mapp: resolve(__dirname, 'lib/mapp.mjs'),
        ui: resolve(__dirname, 'lib/ui.mjs'),
        test: resolve(__dirname, 'tests/_mapp.test.mjs'),
      },
      output: {
        entryFileNames: 'lib/[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    sourcemap: true,
    minify: 'esbuild',
  },

  // CSS configuration for bundling
  css: {
    postcss: {},
  },

  // Public directory for static assets (excluding output directory)
  publicDir: false, // Disable to avoid conflicts with outDir in public/js

  // Development server configuration
  server: {
    port: 5173,
    cors: true,
    host: true,
  },

  // Define global variables
  define: {
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV || 'development',
    ),
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, 'lib'),
      '@tests': resolve(__dirname, 'tests'),
      '@public': resolve(__dirname, 'public'),
    },
  },
});
