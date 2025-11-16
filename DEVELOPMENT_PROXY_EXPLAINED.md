# How Vite Proxy Works in Development

## What You're Seeing

When you see `http://localhost:3000/api/shorten` in the browser's Network tab, **this is correct!** Here's why:

## How It Works

### 1. Frontend Code
```javascript
// frontend/src/config.js
// In development, API_URL = '' (empty string)

// frontend/src/App.jsx
fetch(`${API_URL}/api/shorten`, ...)
// Becomes: fetch('/api/shorten', ...)
```

### 2. Browser Makes Request
- Browser sends request to: `http://localhost:3000/api/shorten`
- This is what you see in the Network tab

### 3. Vite Dev Server Intercepts
- Vite dev server (running on port 3000) receives the request
- Sees it matches the `/api` proxy pattern
- **Automatically forwards** to: `http://localhost:8000/api/shorten`

### 4. Backend Receives Request
- Backend (running on port 8000) processes the request
- Returns response

### 5. Response Flows Back
- Backend → Vite proxy → Browser

## Visual Flow

```
Browser                    Vite Dev Server              Backend
  |                            |                          |
  | GET /api/shorten           |                          |
  |--------------------------->|                          |
  |                            | GET /api/shorten         |
  |                            |------------------------->|
  |                            |                          | Process
  |                            | Response                 |
  |                            |<-------------------------|
  | Response                   |                          |
  |<---------------------------|                          |
```

## Why This Design?

1. **No CORS Issues**: Browser thinks it's talking to the same origin (localhost:3000)
2. **Simpler Code**: Frontend uses relative paths (`/api/shorten`) instead of full URLs
3. **Environment Flexibility**: Same code works in dev and production

## Configuration

### Vite Config (`frontend/vite.config.js`)
```javascript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8000',  // Backend URL
      changeOrigin: true,
    }
  }
}
```

### Frontend Config (`frontend/src/config.js`)
```javascript
// Development: empty string = use relative paths
// Production: full URL from VITE_API_URL
const getApiUrl = () => {
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 'https://g2url.in'
  }
  return ''  // Empty = relative path, proxied by Vite
}
```

## Troubleshooting

### Issue: Proxy Not Working

**Symptoms:**
- 404 errors when calling `/api/shorten`
- CORS errors
- Network tab shows request to `localhost:3000` but backend doesn't receive it

**Solutions:**

1. **Check Vite is running:**
   ```bash
   # Should see Vite dev server output
   npm run dev
   ```

2. **Check backend is running:**
   ```bash
   # Should be accessible
   curl http://localhost:8000/health
   ```

3. **Check proxy configuration:**
   - Verify `vite.config.js` has the proxy setup
   - Make sure `VITE_BACKEND_URL` is set if you're using it

4. **Check environment variable:**
   ```bash
   # In frontend directory
   cat .env
   # Should have: VITE_BACKEND_URL=http://localhost:8000
   ```

5. **Restart Vite dev server:**
   ```bash
   # Stop and restart
   npm run dev
   ```

### Issue: Want to See Actual Backend URL

If you want to see the actual backend URL in the Network tab (for debugging), you can temporarily change the config:

```javascript
// frontend/src/config.js (temporary for debugging)
export const API_URL = 'http://localhost:8000'  // Direct backend URL
```

**Note:** This will cause CORS issues unless your backend CORS settings allow `localhost:3000`.

## Production vs Development

| Environment | API_URL | Request URL | How It Works |
|------------|---------|-------------|--------------|
| **Development** | `''` (empty) | `http://localhost:3000/api/shorten` | Vite proxy forwards to backend |
| **Production** | `https://g2url.in` | `https://g2url.in/api/shorten` | Direct request to backend (nginx routes it) |

## Summary

**Seeing `http://localhost:3000/api/shorten` is CORRECT!** 

- The browser makes the request to the Vite dev server
- Vite automatically proxies it to `http://localhost:8000/api/shorten`
- This is transparent to your frontend code
- No CORS issues, simpler code, works seamlessly

If the proxy isn't working, check that:
1. Vite dev server is running
2. Backend is running on port 8000
3. Proxy configuration in `vite.config.js` is correct

