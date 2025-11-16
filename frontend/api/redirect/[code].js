/**
 * Vercel Serverless Function to handle short URL redirects
 * Route: /api/redirect/[code]
 */

import { API_URL, getAuthToken } from '../../config'

export default async function handler(req, res) {
  const { code } = req.query;

  // Validate code format (alphanumeric only)
  if (!code || !/^[a-zA-Z0-9]+$/.test(code)) {
    return res.status(404).json({ error: 'Invalid short code format' });
  }

  // Exclude common paths that shouldn't be treated as short codes
  const excludedPaths = ['api', 'health', 'debug', 'favicon', 'assets', 'static', '_next'];
  if (excludedPaths.includes(code.toLowerCase())) {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    const apiUrl = process.env.API_URL || 'https://letmehelpyou-api-production.up.railway.app';
    const token = await getAuthToken()
    // Call external API redirect endpoint
    const response = await fetch(
      `${apiUrl}/v1/shorten/redirect/${code}`,
      {
        method: 'GET',
        redirect: 'manual', // Don't follow redirects automatically
        headers: {
          'User-Agent': 'g2url.in-redirect-service',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    // Handle redirect responses (301, 302, 307, 308)
    if (response.status === 301 || response.status === 302 || response.status === 307 || response.status === 308) {
      const location = response.headers.get('location');
      if (location) {
        // Return redirect to the original URL
        return res.redirect(response.status, location);
      }
    }

    // If 404, return not found
    if (response.status === 404) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    // Try to parse JSON response (in case API returns JSON with URL)
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.original_url || data.url || data.redirect_url) {
          return res.redirect(307, data.original_url || data.url || data.redirect_url);
        }
      }
    } catch (parseError) {
      // If JSON parsing fails, continue to error handling
    }

    // If we get here, something went wrong
    console.error(`Unexpected response status: ${response.status} for code: ${code}`);
    return res.status(500).json({ 
      error: 'Failed to redirect',
      message: `Unexpected response from API: ${response.status}`
    });
  } catch (error) {
    console.error('Redirect error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

