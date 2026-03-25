/**
## /sign/cloudfront

The cloudfront sign module exports a method to sign requests to an AWS cloudfront service.

@requires fs
@requires crypto
@requires /utils/processEnv
@module /sign/cloudfront
*/

import { createSign } from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let privateKey;
let getSignedUrl;
const signedUrlCache = new Map();
const SIGNED_URL_TTL = Number.parseInt(xyzEnv.CLOUDFRONT_SIGN_TTL || '', 10);
const DEFAULT_SIGNED_URL_TTL = 55 * 60 * 1000;
const SIGN_ALGORITHM = xyzEnv.CLOUDFRONT_SIGN_ALGORITHM || 'RSA-SHA1';

try {
  ({ getSignedUrl } = await import('@aws-sdk/cloudfront-signer'));
} catch {
  // Optional fallback only
}

//Export nothing if the cloudfront key is not provided
export default xyzEnv.KEY_CLOUDFRONT
  ? (() => {
      try {
        privateKey = String(
          readFileSync(resolve(`${xyzEnv.KEY_CLOUDFRONT}.pem`)),
        );
        return cloudfront_signer;
      } catch (error) {
        console.error(error);
        return null;
      }
    })()
  : null; /**
@function cloudfront_signer
@async

@description
The method creates a signed URL for a cloudfront resource.

@param {req|string} req Request object or URL string.

@returns {Promise<String>} The method resolves to a string which contains the signed url.
*/
async function cloudfront_signer(req) {
  try {
    // Substitutes {*} with xyzEnv.SRC_* key values.
    const rawUrl = (req.params?.url || req).replaceAll(
      /{(?!{)(.*?)}/g,
      (matched) => xyzEnv[`SRC_${matched.replace(/(^{)|(}$)/g, '')}`],
    );
    const url = normalizeUrl(rawUrl);

    const cacheEntry = signedUrlCache.get(url);

    if (cacheEntry && cacheEntry.expiresAt > Date.now()) {
      return cacheEntry.signedURL;
    }

    const ttl = Number.isFinite(SIGNED_URL_TTL)
      ? SIGNED_URL_TTL
      : DEFAULT_SIGNED_URL_TTL;
    const expiresAt = Date.now() + ttl;
    const expiresAtEpoch = Math.floor(expiresAt / 1000);
    let signedURL;

    try {
      const policy = buildCannedPolicy(url, expiresAtEpoch);
      const signature = signPolicy(policy);

      const signed = new URL(url);
      signed.searchParams.set('Expires', String(expiresAtEpoch));
      signed.searchParams.set('Key-Pair-Id', xyzEnv.KEY_CLOUDFRONT);
      signed.searchParams.set('Signature', signature);

      signedURL = signed.toString();
    } catch (nativeSignError) {
      if (!getSignedUrl) {
        throw nativeSignError;
      }

      signedURL = getSignedUrl({
        dateLessThan: new Date(expiresAt).toISOString(),
        keyPairId: xyzEnv.KEY_CLOUDFRONT,
        privateKey,
        url,
      });
    }

    signedUrlCache.set(url, {
      expiresAt,
      signedURL,
    });

    // Return signedURL only from request.
    return signedURL;
  } catch (err) {
    console.error(err);
    return err;
  }
}

function normalizeUrl(url) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function buildCannedPolicy(resource, epoch) {
  return JSON.stringify({
    Statement: [
      {
        Condition: {
          DateLessThan: {
            'AWS:EpochTime': epoch,
          },
        },
        Resource: resource,
      },
    ],
  });
}

function signPolicy(policy) {
  const signer = createSign(SIGN_ALGORITHM);
  signer.update(policy);
  signer.end();
  const signature = signer.sign(privateKey);
  return cloudfrontBase64(signature);
}

function cloudfrontBase64(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/=/g, '_')
    .replace(/\//g, '~');
}
