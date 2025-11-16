// /api/redirect/[code].js
import fetch from 'node-fetch'; // optional: only if your environment needs it
// If you use a local helper to fetch token, import it correctly.
// e.g. import getAuthToken from '../../../lib/getAuthToken';
import { getAuthToken } from '../../config'; // ensure this path is correct in your project

const DEFAULT_API = 'https://letmehelpyou-api-production.up.railway.app';
const FETCH_TIMEOUT_MS = 7000;

function timeoutFetch(url, opts = {}, timeout = FETCH_TIMEOUT_MS) {
  return Promise.race([
    fetch(url, opts),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Fetch timeout')), timeout)
    ),
  ]);
}

export default async function handler(req, res) {
  const rawCode = Array.isArray(req.query.code) ? req.query.code[0] : req.query.code;
  const code = typeof rawCode === 'string' ? rawCode.trim() : '';

  console.log('redirect handler hit for code=', code);

  if (!code || !/^[a-zA-Z0-9-_]+$/.test(code)) {
    return res.status(404).send('Not found');
  }

  const excluded = new Set(['api','health','debug','favicon','assets','static','_next']);
  if (excluded.has(code.toLowerCase())) {
    return res.status(404).send('Not found');
  }

  // Resolve API URL
  const apiUrl = process.env.API_URL || DEFAULT_API;
  let token = null;

  try {
    token = await getAuthToken();
  } catch (err) {
    console.error('getAuthToken error:', err && err.message ? err.message : err);
    // If token generation is optional, continue without Authorization header
    // Otherwise return 500 so you know token is required
    return res.status(500).json({ error: 'Server token error' });
  }

  const endpoint = `${apiUrl.replace(/\/$/, '')}/v1/shorten/redirect/${encodeURIComponent(code)}`;

  try {
    const headers = {
      'User-Agent': 'g2url.in-redirect-service',
      Accept: 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await timeoutFetch(endpoint, { method: 'GET', redirect: 'manual', headers });

    // If redirect status with Location header, forward it
    const status = response.status;
    console.log('API response status:', status);

    if ([301,302,307,308].includes(status)) {
      const location = response.headers.get('location') || response.headers.get('Location');
      if (location) {
        console.log('Redirecting to location header:', location);
        return res.redirect(status, location);
      }
    }

    // If response is JSON and contains url fields, redirect
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      const url = data.original_url || data.url || data.redirect_url || data.location;
      if (url) {
        console.log('Redirecting to JSON url:', url);
        return res.redirect(307, url);
      }
    }

    // If API returned HTML with a meta redirect, try to parse location from it (best-effort)
    if (contentType.includes('text/html')) {
      const text = await response.text();
      const metaMatch = text.match(/<meta[^>]+http-equiv=["']refresh["'][^>]*>/i);
      if (metaMatch) {
        const urlMatch = text.match(/url=['"]?([^'">]+)/i);
        if (urlMatch && urlMatch[1]) {
          return res.redirect(307, urlMatch[1]);
        }
      }
    }

    // Not found response handling
    if (status === 404) {
      return res.status(404).send('Short URL not found');
    }

    // Unexpected: return friendly page or JSON for debugging
    console.error(`Unexpected API response for code ${code}: status=${status}`);
    return res.status(502).json({ error: 'Bad gateway', status });

  } catch (err) {
    console.error('Redirect handler error:', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Internal Server Error', message: String(err.message || err) });
  }
}
