/**
@module server
@description

Runtime server powered by Bun's native HTTP stack.
*/

import './mod/utils/processEnv.js';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import api from './api/api.js';

if (typeof Bun === 'undefined') {
  throw new Error('This server entrypoint requires Bun.');
}

const RATE_LIMIT = Number.parseInt(xyzEnv.RATE_LIMIT, 10);
const RATE_LIMIT_WINDOW = Number.parseInt(xyzEnv.RATE_LIMIT_WINDOW, 10);
const DIR = xyzEnv.DIR || '';
const BODY_LIMIT_BYTES = 5 * 1024 * 1024;
const REQ_TIMEOUT_MS = 30_000;

const rateLimitMap = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap) {
    if (record.resetAt <= now) {
      rateLimitMap.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW).unref();

Bun.serve({
  fetch: async (request, server) => {
    const url = new URL(request.url);

    const staticResponse = serveStatic(url.pathname);
    if (staticResponse) return staticResponse;

    const remoteIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      server.requestIP(request)?.address ||
      'unknown';

    if (!checkRateLimit(remoteIp)) {
      return new Response('Too many requests', {
        headers: {
          'Content-Type': 'text/plain',
        },
        status: 429,
      });
    }

    const req = {
      body: await parseBody(request),
      cookies: parseCookies(request.headers.get('cookie')),
      headers: toHeaderObject(request.headers, url),
      ip: remoteIp,
      ips: request.headers
        .get('x-forwarded-for')
        ?.split(',')
        .map((ip) => ip.trim())
        .filter(Boolean),
      method: request.method,
      params: getRouteParams(url.pathname),
      query: toQueryObject(url.searchParams),
      url: `${url.pathname}${url.search}`,
    };

    return await new Promise((resolve) => {
      const res = new BunResponse(resolve);
      const timeout = setTimeout(() => {
        if (!res.finished) {
          res.status(504).send('Request timed out');
        }
      }, REQ_TIMEOUT_MS);

      try {
        api(req, res);
      } catch (error) {
        res.status(500).send(error?.message || 'Internal server error');
      }

      const clear = () => clearTimeout(timeout);
      const originalSend = res.send.bind(res);
      res.send = (value) => {
        clear();
        return originalSend(value);
      };
    });
  },
  idleTimeout: 30,
  port: xyzEnv.PORT,
});

function checkRateLimit(ip) {
  const now = Date.now();
  const current = rateLimitMap.get(ip);

  if (!current || current.resetAt <= now) {
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (current.count >= RATE_LIMIT) {
    return false;
  }

  current.count += 1;
  return true;
}

function serveStatic(pathname) {
  let response;

  if (pathname.startsWith('/xyz')) {
    response = readStatic('docs', pathname.slice('/xyz'.length), true);
    if (response) return response;
  }

  if (pathname.startsWith(`${DIR}/public`)) {
    response = readStatic('public', pathname.slice(`${DIR}/public`.length));
    if (response) return response;
  }

  if (pathname.startsWith(`${DIR}/tests`)) {
    response = readStatic('tests', pathname.slice(`${DIR}/tests`.length));
    if (response) return response;
  }

  if (DIR && pathname.startsWith(DIR)) {
    const relativePath = pathname.slice(DIR.length);
    response =
      readStatic('public', relativePath) || readStatic('tests', relativePath);
    if (response) return response;
  }
}

function readStatic(baseDir, requestPath, htmlExtension = false) {
  const relativePath = decodeURIComponent(requestPath || '/');
  const candidates = new Set();

  candidates.add(relativePath);

  if (relativePath.endsWith('/')) {
    candidates.add(`${relativePath}index.html`);
  }

  if (!path.extname(relativePath)) {
    candidates.add(`${relativePath}/index.html`);
    if (htmlExtension) {
      candidates.add(`${relativePath}.html`);
    }
  }

  for (const candidate of candidates) {
    const target = safePath(baseDir, candidate);
    if (!target || !existsSync(target)) continue;
    if (!statSync(target).isFile()) continue;
    return new Response(Bun.file(target));
  }
}

function safePath(baseDir, relativePath) {
  const root = path.resolve(process.cwd(), baseDir);
  const target = path.resolve(root, `.${relativePath}`);
  return target.startsWith(root) ? target : null;
}

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};

  const cookies = {};

  for (const cookiePair of cookieHeader.split(';')) {
    const [key, ...rest] = cookiePair.trim().split('=');
    if (!key) continue;
    cookies[key] = decodeURIComponent(rest.join('='));
  }

  return cookies;
}

function toHeaderObject(headers, url) {
  const object = {};

  for (const [key, value] of headers.entries()) {
    object[key] = value;
  }

  object.host ??= url.host;

  return object;
}

function toQueryObject(searchParams) {
  const query = {};

  for (const [key, value] of searchParams.entries()) {
    if (Object.hasOwn(query, key)) {
      const previous = query[key];
      query[key] = Array.isArray(previous)
        ? [...previous, value]
        : [previous, value];
      continue;
    }
    query[key] = value;
  }

  return query;
}

function getRouteParams(pathname) {
  const routePath =
    DIR && pathname.startsWith(DIR)
      ? pathname.slice(DIR.length) || '/'
      : pathname;

  const provider = /^\/api\/provider(?:\/([^/]+))?$/.exec(routePath);
  if (provider) return { provider: provider[1] };

  const signer = /^\/api\/sign(?:\/([^/]+))?$/.exec(routePath);
  if (signer) return { signer: signer[1] };

  const query = /^\/api\/query(?:\/([^/]+))?$/.exec(routePath);
  if (query) return { template: query[1] };

  const workspace = /^\/api\/workspace(?:\/([^/]+))?$/.exec(routePath);
  if (workspace) return { key: workspace[1] };

  const user = /^\/api\/user(?:\/([^/]+))?(?:\/([^/]+))?$/.exec(routePath);
  if (user) return { key: user[2], method: user[1] };

  const view = /^\/view(?:\/([^/]+))?$/.exec(routePath);
  if (view) return { template: view[1] };

  const locale = /^\/([^/]+)$/.exec(routePath);
  if (locale) return { locale: locale[1] };

  return {};
}

async function parseBody(request) {
  if (!['POST', 'PUT', 'PATCH'].includes(request.method)) {
    return undefined;
  }

  const contentLength = Number.parseInt(
    request.headers.get('content-length') || '0',
    10,
  );
  if (contentLength > BODY_LIMIT_BYTES) {
    throw new Error('Request body exceeded 5mb limit');
  }

  const contentType = request.headers.get('content-type') || '';
  const text = await request.text();
  if (!text) return undefined;

  if (contentType.includes('application/json')) {
    return JSON.parse(text);
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(text).entries());
  }

  return undefined;
}

class BunResponse {
  constructor(resolve) {
    this.finished = false;
    this.headers = new Headers();
    this.resolve = resolve;
    this.statusCode = 200;
  }

  status(code) {
    this.statusCode = code;
    return this;
  }

  setHeader(name, value) {
    if (Array.isArray(value)) {
      if (name.toLowerCase() === 'set-cookie') {
        for (const cookie of value) this.headers.append(name, cookie);
      } else {
        this.headers.set(name, value.join(', '));
      }
      return this;
    }

    this.headers.set(name, String(value));
    return this;
  }

  json(value) {
    this.headers.set('Content-Type', 'application/json');
    return this.send(JSON.stringify(value));
  }

  send(value = '') {
    if (this.finished) return this;
    this.finished = true;

    let body = value;

    if (body === null || body === undefined) {
      body = '';
    } else if (typeof body === 'object') {
      if (!this.headers.has('Content-Type')) {
        this.headers.set('Content-Type', 'application/json');
      }
      body = JSON.stringify(body);
    } else {
      body = String(body);

      if (!this.headers.has('Content-Type')) {
        const trimmed = body.trimStart().toLowerCase();
        if (
          trimmed.startsWith('<!doctype html') ||
          trimmed.startsWith('<html') ||
          trimmed.startsWith('<head') ||
          trimmed.startsWith('<body')
        ) {
          this.headers.set('Content-Type', 'text/html; charset=utf-8');
        } else {
          this.headers.set('Content-Type', 'text/plain; charset=utf-8');
        }
      }
    }

    this.resolve(
      new Response(body, {
        headers: this.headers,
        status: this.statusCode,
      }),
    );

    return this;
  }
}
