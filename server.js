/**
The root backend composes the base XYZ app with optional direct routes.

SAML is mounted here as an extracted backend app so fork-level server wiring is
kept explicit in the root application.
  */

import { prepareVercelGcpCredentials } from './apps/xyz/mod/utils/vercelGcpCredentials.js';

let appPromise;

if (!process.env.VERCEL) {
  await getApp();
}

export default async function handler(req, res) {
  // Varlock loads during app import, so Vercel OIDC must be bridged first.
  await prepareVercelGcpCredentials(req);

  const app = await getApp();

  return app(req, res);
}

async function getApp() {
  return (await (appPromise ??= import('@geolytix/xyz-app/server'))).default;
}
