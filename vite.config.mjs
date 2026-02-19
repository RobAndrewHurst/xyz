import http from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env to read DIR (and other vars) the same way Express does.
dotenv.config();
const DIR = process.env.DIR || '';
const PORT = process.env.PORT || 3000;
const EXPRESS = `http://localhost:${PORT}`;

/**
Proxy an incoming request to Express and pipe the response back.
For HTML responses, asset paths are rewritten so that JS and CSS
are served by Vite (with HMR) instead of from pre-built bundles.
*/
function proxyToExpress(req, res) {
  const proxyReq = http.request(
    {
      hostname: 'localhost',
      port: PORT,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: `localhost:${PORT}`,
        // Request uncompressed responses so we can rewrite HTML.
        'accept-encoding': 'identity',
      },
    },
    (proxyRes) => {
      // Rewrite Location header so redirects stay on Vite.
      if (proxyRes.headers.location) {
        proxyRes.headers.location = proxyRes.headers.location.replace(
          EXPRESS,
          '',
        );
      }

      const contentType = proxyRes.headers['content-type'] || '';

      // For HTML responses (login, register, default views served by
      // Express), rewrite asset paths so JS/CSS come from Vite.
      if (contentType.includes('text/html')) {
        const chunks = [];
        proxyRes.on('data', (chunk) => chunks.push(chunk));
        proxyRes.on('end', () => {
          let body = Buffer.concat(chunks).toString();

          // Replace pre-built JS bundles with Vite source modules.
          body = body.replace(
            /src="([^"]*?)\/public\/js\/lib\/mapp\.js"/g,
            'src="/lib/mapp.mjs"',
          );
          body = body.replace(
            /src="([^"]*?)\/public\/js\/lib\/ui\.js"/g,
            'src="/lib/ui.mjs"',
          );

          // Replace pre-built CSS with source CSS for HMR.
          body = body.replace(
            /href="([^"]*?)\/public\/css\/ui\.css"/g,
            'href="$1/public/css/_ui.css"',
          );
          body = body.replace(
            /href="([^"]*?)\/public\/css\/mapp\.css"/g,
            'href="$1/public/css/_mapp.css"',
          );

          // Inject Vite client script after the opening <head> tag.
          body = body.replace(
            /(<head[^>]*>)/,
            '$1<script type="module" src="/@vite/client"></script>',
          );

          // Update headers for rewritten body.
          const headers = { ...proxyRes.headers };
          headers['content-length'] = Buffer.byteLength(body);
          delete headers['content-encoding'];
          delete headers['transfer-encoding'];

          res.writeHead(proxyRes.statusCode, headers);
          res.end(body);
        });
        return;
      }

      // Non-HTML responses (JSON, redirects, etc.) pass through as-is.
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );

  proxyReq.on('error', (err) => {
    console.error(
      `[xyz-proxy] ${req.method} ${req.url} -> ${err.message || err.code}`,
    );
    res.writeHead(502);
    res.end('Express backend not running');
  });

  req.pipe(proxyReq);
}

// Paths that Vite should serve directly (not proxy to Express).
// Everything else under DIR gets proxied.
const viteStaticPrefixes = [
  '/lib/',
  '/public/',
  '/tests/',
  '/node_modules/',
  '/@vite/',
  '/@fs/',
];

export default defineConfig({
  // Root directory where index.html lives
  root: resolve(__dirname),

  // Disable Vite's default public directory handling.
  // This project's 'public/' is not a Vite public dir -- it contains
  // source CSS, fonts, and icons served as regular static files.
  publicDir: false,

  // Dev server configuration
  server: {
    port: 5173,
    // Listen on all interfaces so Tailscale (and other network) access works.
    host: true,
    // Allow Tailscale MagicDNS hostnames.
    allowedHosts: ['.ts.net'],
    open: true,
    // HMR over WebSocket
    hmr: {
      overlay: true,
    },
    // Watch for changes in these directories
    watch: {
      include: ['lib/**', 'public/css/**'],
    },
  },

  plugins: [
    {
      name: 'xyz-html-env',
      // Inject DIR, TITLE, LOGIN into index.html at serve time.
      transformIndexHtml(html) {
        return html
          .replace(/%DIR%/g, DIR)
          .replace(/%TITLE%/g, process.env.TITLE || 'GEOLYTIX | XYZ')
          .replace(
            /%LOGIN%/g,
            process.env.PRIVATE || process.env.PUBLIC ? 'true' : '',
          );
      },
    },
    {
      name: 'xyz-express-proxy',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Strip DIR prefix from static asset requests so Vite
          // can serve them from the project root.
          // e.g. /iwg/public/css/foo.css -> /public/css/foo.css
          if (DIR && req.url?.startsWith(`${DIR}/`)) {
            const pathAfterDir = req.url.slice(DIR.length);

            // If the path after DIR is a Vite static asset, rewrite
            // the URL and let Vite handle it.
            if (viteStaticPrefixes.some((p) => pathAfterDir.startsWith(p))) {
              req.url = pathAfterDir;
              return next();
            }
          }

          // Let Vite handle its own internal paths and static assets.
          if (viteStaticPrefixes.some((p) => req.url?.startsWith(p))) {
            return next();
          }

          const url = new URL(req.url, 'http://localhost');
          const pathname = url.pathname;

          // Auth query params (logout, login, register) must always be
          // proxied to Express so cookies are set/cleared server-side.
          if (
            url.searchParams.has('logout') ||
            url.searchParams.has('login') ||
            url.searchParams.has('register')
          ) {
            return proxyToExpress(req, res);
          }

          // When DIR is set, redirect root to DIR so all entry points
          // go through Express for auth checking.
          // When DIR is empty, root goes to Express directly.
          if (pathname === '/' || pathname === '/index.html') {
            if (DIR) {
              res.writeHead(302, { location: DIR + (url.search || '') });
              res.end();
              return;
            }
            return proxyToExpress(req, res);
          }

          // Bare DIR path (e.g. /iwg) is proxied to Express so auth
          // is checked. Express either returns the login/default view
          // HTML (which gets rewritten for Vite) or redirects to SAML.
          // This ensures unauthenticated users see the login page.

          // Everything else gets proxied to Express:
          // - /DIR/api/... (all API routes)
          // - /DIR/saml/... (SAML auth)
          // - /DIR/view/... (view templates)
          // - /DIR/:locale (locale routing)
          // - /DIR?logout=true, ?login=true, ?register=true
          // - /DIR (bare, redirects/auth)
          proxyToExpress(req, res);
        });
      },
    },
  ],

  // Resolve aliases so imports work cleanly
  resolve: {
    alias: {
      '/public': resolve(__dirname, 'public'),
    },
  },

  // CSS handling - Vite handles CSS imports natively with HMR
  css: {
    devSourcemap: true,
  },

  // Build configuration (for `vite build` as alternative to esbuild)
  build: {
    outDir: 'public/js',
    sourcemap: true,
    rollupOptions: {
      input: {
        mapp: resolve(__dirname, 'lib/mapp.mjs'),
        ui: resolve(__dirname, 'lib/ui.mjs'),
      },
      output: {
        entryFileNames: 'lib/[name].js',
        format: 'es',
      },
    },
  },

  // Optimize deps - exclude OpenLayers since it's loaded from CDN
  optimizeDeps: {
    exclude: ['ol'],
  },
});
