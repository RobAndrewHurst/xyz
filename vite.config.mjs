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
Rewrite an Express HTML response so that JS and CSS are served by
Vite (with HMR) instead of from pre-built esbuild bundles.
*/
function rewriteHtml(body) {
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

  return body;
}

/**
Proxy an incoming request to Express and pipe the response back.
HTML responses are rewritten via rewriteHtml().
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

      // For HTML responses, buffer the body and rewrite asset paths.
      if (contentType.includes('text/html')) {
        const chunks = [];
        proxyRes.on('data', (chunk) => chunks.push(chunk));
        proxyRes.on('end', () => {
          const body = rewriteHtml(Buffer.concat(chunks).toString());

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
const viteStaticPrefixes = [
  '/lib/',
  '/public/',
  '/tests/',
  '/node_modules/',
  '/@vite/',
  '/@fs/',
];

export default defineConfig({
  root: resolve(__dirname),

  // Disable Vite's default public directory handling.
  // This project's 'public/' is not a Vite public dir -- it contains
  // source CSS, fonts, and icons served as regular static files.
  publicDir: false,

  server: {
    port: 5173,
    // Listen on all interfaces so Tailscale (and other network) access works.
    host: true,
    // Allow Tailscale MagicDNS hostnames.
    allowedHosts: ['.ts.net'],
    open: true,
    hmr: {
      overlay: true,
    },
    watch: {
      include: ['lib/**', 'public/css/**'],
    },
  },

  plugins: [
    {
      name: 'xyz-express-proxy',
      configureServer(server) {
        // All routing goes through Express. Vite only serves static
        // assets (source JS modules, CSS, fonts, etc.).
        // Express handles auth, views, API, SAML, locale routing.
        // HTML responses from Express are rewritten so JS/CSS load
        // from Vite source files with HMR support.
        server.middlewares.use((req, res, next) => {
          // Strip DIR prefix from static asset requests so Vite
          // can serve them from the project root.
          // e.g. /iwg/public/css/foo.css -> /public/css/foo.css
          if (DIR && req.url?.startsWith(`${DIR}/`)) {
            const pathAfterDir = req.url.slice(DIR.length);

            if (viteStaticPrefixes.some((p) => pathAfterDir.startsWith(p))) {
              req.url = pathAfterDir;
              return next();
            }
          }

          // Let Vite handle its own internal paths and static assets.
          if (viteStaticPrefixes.some((p) => req.url?.startsWith(p))) {
            return next();
          }

          // Everything else goes to Express:
          // - / (root, redirects to DIR)
          // - /DIR (auth check, default view or login view)
          // - /DIR/api/... (all API routes)
          // - /DIR/saml/... (SAML auth)
          // - /DIR/view/... (view templates)
          // - /DIR/:locale (locale routing)
          // - ?logout, ?login, ?register (auth actions)
          proxyToExpress(req, res);
        });
      },
    },
  ],

  resolve: {
    alias: {
      '/public': resolve(__dirname, 'public'),
    },
  },

  css: {
    devSourcemap: true,
  },

  optimizeDeps: {
    exclude: ['ol'],
  },
});
