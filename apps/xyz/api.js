import { prepareVercelGcpCredentials } from './mod/utils/vercelGcpCredentials.js';

let appPromise;

export default async function handler(req, res) {
  // Varlock loads during app import, so Vercel OIDC must be bridged first.
  await prepareVercelGcpCredentials(req);

  const { default: app } = await (appPromise ??= import('./server.js'));

  return app(req, res);
}
