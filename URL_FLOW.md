# How Short URL Redirection Works

## Important: The Frontend App Does NOT Handle Short URL Redirects

When someone visits `https://g2url.in/ypUouO`, **the frontend React app is NOT involved**. This is a direct HTTP request that bypasses the frontend entirely.

## Flow Diagram

```
User visits: https://g2url.in/ypUouO
     │
     ▼
┌─────────────────────────────────────┐
│  1. Browser makes HTTP GET request  │
│     to g2url.in/ypUouO              │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  2. Nginx (Web Server)              │
│     - Receives the request          │
│     - Matches URL pattern:          │
│       location ~ ^/[a-zA-Z0-9]{6}$  │
│     - Proxies to backend            │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  3. FastAPI Backend                 │
│     Route: GET /{short_code}        │
│     - Validates short_code format   │
│     - Looks up in database          │
│     - Returns 307 Redirect          │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  4. Browser receives redirect       │
│     Status: 307 Temporary Redirect  │
│     Location: <original_long_url>   │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  5. Browser automatically follows   │
│     redirect to original URL        │
└─────────────────────────────────────┘
```

## What the Frontend App Does

The frontend React app (`frontend/src/App.jsx`) **only** handles:

### 1. Creating Short URLs
- **Route called:** `POST /api/shorten`
- **When:** User submits the form to shorten a URL
- **Code location:** `frontend/src/App.jsx` line 25
- **Flow:**
  ```
  User enters URL → Clicks "Shorten URL" 
  → Frontend calls POST /api/shorten
  → Backend creates short code
  → Frontend displays shortened URL
  ```

### 2. Displaying the UI
- Shows the form to enter URLs
- Displays the shortened URL result
- Provides copy-to-clipboard functionality

## What Happens When Someone Clicks a Short URL

When someone visits `https://g2url.in/ypUouO`:

1. **Browser** makes a GET request to `g2url.in/ypUouO`
2. **Nginx** (web server) receives the request
3. **Nginx** matches the regex pattern `^/[a-zA-Z0-9]{6}$` (6 alphanumeric characters)
4. **Nginx** proxies the request to the FastAPI backend at `http://localhost:8000/ypUouO`
5. **FastAPI Backend** route `GET /{short_code}` handles it:
   - Validates the short code format
   - Queries the database for the original URL
   - Returns a `307 Temporary Redirect` response with the original URL
6. **Browser** receives the redirect and automatically navigates to the original URL

## Backend Route (Not Frontend)

The backend route that handles short URL redirects:

```python
@app.get("/{short_code}")
async def redirect_url(short_code: str):
    """Redirect to the original URL"""
    # Validates and looks up in database
    # Returns RedirectResponse with status_code=307
```

**This route is NOT called from the frontend app.** It's called directly by the browser when someone visits the short URL.

## Nginx Configuration

The nginx configuration routes short URLs to the backend:

```nginx
# Short code redirects - must come before frontend root
location ~ ^/[a-zA-Z0-9]{6}$ {
    proxy_pass http://localhost:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

This regex pattern `^/[a-zA-Z0-9]{6}$` matches:
- Exactly 6 alphanumeric characters
- Examples: `ypUouO`, `DE1hRd`, `abc123`
- Does NOT match: `/api/shorten`, `/health`, `/` (homepage)

## Summary

| Action | Frontend Involved? | Route Called |
|--------|-------------------|--------------|
| User visits `g2url.in/ypUouO` | ❌ NO | `GET /{short_code}` (Backend) |
| User creates short URL | ✅ YES | `POST /api/shorten` (Backend via Frontend) |
| User views homepage | ✅ YES | Frontend React app served |

## Key Takeaway

**Short URL redirects (`/ypUouO`) are handled entirely by the backend and nginx. The frontend React app is never loaded or executed for these requests.**

## Important: Nginx Configuration

If you're getting "not found" errors for short URLs, it means nginx is **NOT** routing them to the backend. The nginx configuration **MUST** have the short code location block **BEFORE** the frontend location block:

```nginx
# Short codes FIRST (before frontend!)
location ~ ^/[a-zA-Z0-9]{6}$ {
    proxy_pass http://localhost:8000;
    ...
}

# Frontend LAST (catch-all)
location / {
    root /var/www/g2url/frontend/dist;
    ...
}
```

If the frontend `location /` comes first, nginx will serve the frontend instead of proxying to the backend, causing "not found" errors.

See `NGINX_CONFIG_FIX.md` for detailed nginx configuration.

