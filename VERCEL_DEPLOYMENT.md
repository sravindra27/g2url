# Deploying to Vercel

Since your frontend is hosted on Vercel, here's how to configure it properly.

## 1. Deploy Frontend to Vercel

### Option A: Using Vercel CLI

```bash
cd frontend
npm install -g vercel
vercel
```

### Option B: Using GitHub Integration

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Set root directory to `frontend`
5. Deploy

## 2. Configure Environment Variables in Vercel

In your Vercel project settings:

1. Go to **Settings** → **Environment Variables**
2. Add:
   ```
   VITE_API_URL=https://letmehelpyou-api-production.up.railway.app
   ```
3. Apply to: **Production**, **Preview**, and **Development**

## 3. Handle Short URL Redirects

Since Vercel hosts the frontend, you have a few options for handling short URL redirects:

### Option 1: Vercel Rewrites (Recommended)

Create a `vercel.json` file in the `frontend` directory:

```json
{
  "rewrites": [
    {
      "source": "/:code([a-zA-Z0-9]+)",
      "destination": "https://letmehelpyou-api-production.up.railway.app/v1/shorten/redirect/:code",
      "has": [
        {
          "type": "header",
          "key": "accept",
          "value": "text/html.*"
        }
      ]
    }
  ],
  "headers": [
    {
      "source": "/:code([a-zA-Z0-9]+)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    }
  ]
}
```

**Note:** This approach proxies the request, but the external API should return a redirect response.

### Option 2: Vercel Serverless Function (Better for Redirects)

Create a serverless function to handle redirects:

1. Create `frontend/api/redirect/[code].js`:

```javascript
export default async function handler(req, res) {
  const { code } = req.query;

  // Validate code format
  if (!code || !/^[a-zA-Z0-9]+$/.test(code)) {
    return res.status(404).json({ error: 'Invalid short code' });
  }

  try {
    // Call external API redirect endpoint
    const response = await fetch(
      `https://letmehelpyou-api-production.up.railway.app/v1/shorten/redirect/${code}`,
      {
        method: 'GET',
        redirect: 'manual', // Don't follow redirects automatically
      }
    );

    // Check if it's a redirect
    if (response.status === 301 || response.status === 302 || response.status === 307 || response.status === 308) {
      const location = response.headers.get('location');
      if (location) {
        return res.redirect(response.status, location);
      }
    }

    // If not a redirect, return error
    if (response.status === 404) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    // For other status codes, try to get the location from response
    const data = await response.json();
    if (data.original_url || data.url) {
      return res.redirect(307, data.original_url || data.url);
    }

    return res.status(500).json({ error: 'Failed to redirect' });
  } catch (error) {
    console.error('Redirect error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

2. Update `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/:code([a-zA-Z0-9]+)",
      "destination": "/api/redirect/:code"
    }
  ]
}
```

### Option 3: Use External API Domain Directly

If the external API returns short URLs like `https://letmehelpyou.in/{code}`, you could:
- Use that domain for short URLs
- Or configure a CNAME record pointing to the external API domain

## 4. Complete vercel.json Configuration

Here's a complete `vercel.json` for the frontend:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/:code([a-zA-Z0-9]+)",
      "destination": "/api/redirect/:code",
      "has": [
        {
          "type": "header",
          "key": "accept",
          "value": "text/html.*"
        }
      ]
    }
  ],
  "headers": [
    {
      "source": "/api/redirect/:code",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    }
  ]
}
```

## 5. Project Structure

After setup, your `frontend` directory should have:

```
frontend/
├── api/
│   └── redirect/
│       └── [code].js    # Serverless function for redirects
├── src/
│   ├── App.jsx
│   ├── config.js
│   └── ...
├── vercel.json          # Vercel configuration
├── package.json
└── vite.config.js
```

## 6. Testing

1. **Deploy to Vercel:**
   ```bash
   cd frontend
   vercel --prod
   ```

2. **Test short URL:**
   Visit: `https://your-vercel-domain.vercel.app/meatin`
   
   Should redirect to the original URL.

3. **Test API endpoint:**
   ```bash
   curl -I https://your-vercel-domain.vercel.app/meatin
   ```

## 7. Custom Domain Setup

If you want to use `g2url.in`:

1. In Vercel dashboard, go to **Settings** → **Domains**
2. Add `g2url.in` and `www.g2url.in`
3. Follow DNS configuration instructions
4. Update environment variable if needed

## Troubleshooting

### Issue: 404 on short URLs
- **Check:** `vercel.json` is in the `frontend` directory
- **Check:** Serverless function exists at `api/redirect/[code].js`
- **Check:** Rewrite rule is correct

### Issue: Redirect not working
- **Check:** External API endpoint is accessible
- **Check:** Serverless function logs in Vercel dashboard
- **Check:** Response from external API

### Issue: CORS errors
- **Note:** Redirects are server-side, so CORS shouldn't be an issue
- If you see CORS errors, check the external API CORS settings

## Environment Variables Summary

In Vercel dashboard, set:
- `VITE_API_URL=https://letmehelpyou-api-production.up.railway.app`

## Next Steps

1. Create `vercel.json` in `frontend` directory
2. Create `api/redirect/[code].js` serverless function
3. Set environment variables in Vercel
4. Deploy to Vercel
5. Test short URL redirects

