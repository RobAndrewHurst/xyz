/**
@module /provider

@description
Functions for handling 3rd party service provider requests
*/

import cloudfront from './cloudfront.js';
import file from './file.js';
import s3 from './s3.js';

/**
@function provider
@async

@description
The provider method looks up a provider module method matching the provider request parameter and passes the req/res objects as argument to the matched method.

The response from the method is returned with the HTTP response.

Object responses are returned as JSON. String responses are returned as text unless the requested resource URL ends in `.js` or `.mjs`, in which case `text/javascript` is used so plugins can be loaded as ES modules from any provider. User supplied JavaScript content types are ignored for non-JavaScript resource URLs.

@param {req} req HTTP request.
@param {Object} res HTTP response.
@param {Object} req.params Request parameter.
@param {string} params.signer Provider module to handle the request.

@returns {Promise} The promise resolves into the response from the provider modules method.
*/
export default async function provider(req, res) {
  const provider = {
    cloudfront,
    file,
    s3,
  };

  if (!Object.hasOwn(provider, req.params.provider)) {
    return res.status(404).send('Failed to validate provider param.');
  }

  if (provider[req.params.provider] === null) {
    return res.status(405).send('Provider is not configured.');
  }

  const response = await provider[req.params.provider](req, res);

  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (response instanceof Error) {
    return res.status(500).send('Provider request failed.');
  }

  if (typeof response === 'object') {
    return res.json(response);
  }

  const contentType = getContentType(req.params);

  res.setHeader('content-type', contentType);

  res.send(response);
}

function getContentType(params) {
  const allowedContentTypes = new Set(['application/json', 'text/plain']);

  // Plugin modules can be served by any provider, but executable MIME types
  // must be derived from the requested resource rather than user input.
  if (params.url?.match(/\.m?js(?:[?#].*)?$/i)) {
    return 'text/javascript';
  }

  return allowedContentTypes.has(params.content_type)
    ? params.content_type
    : 'text/plain';
}
