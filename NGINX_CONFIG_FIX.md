# Nginx Configuration Fix for Short URL Redirects

## The Problem

When visiting `https://g2url.in/ypUouO`, if you're getting a "not found" error, it means nginx is **NOT** routing the request to the backend. Instead, it's likely serving the frontend, which doesn't know how to handle short codes.

## The Solution

Short URL redirects (`/ypUouO`) must be handled by nginx routing directly to the backend, **NOT** through the frontend.

## Correct Nginx Configuration

Update your nginx configuration file (usually `/etc/nginx/sites-available/g2url`):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name g2url.in www.g2url.in;

    # IMPORTANT: Order matters! More specific routes first.

    # 1. Backend API endpoints
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 2. Health check endpoint
    location /health {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 3. Debug endpoint
    location /debug {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 4. Short code redirects - CRITICAL: Must come before frontend!
    # Matches exactly 6 alphanumeric characters (case-insensitive)
    location ~ ^/[a-zA-Z0-9]{6}$ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Important: Don't rewrite the URL, pass it as-is
        proxy_redirect off;
    }

    # 5. Frontend static files - MUST be last (catch-all)
    location / {
        root /var/www/g2url/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

## If Using SSL (HTTPS)

If you have SSL configured, make sure both HTTP and HTTPS are configured:

```nginx
# HTTP - redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name g2url.in www.g2url.in;
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name g2url.in www.g2url.in;

    ssl_certificate /etc/letsencrypt/live/g2url.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/g2url.in/privkey.pem;

    # ... same location blocks as above ...
}
```

## Testing the Configuration

1. **Test nginx configuration:**
   ```bash
   sudo nginx -t
   ```

2. **Reload nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

3. **Test short code directly:**
   ```bash
   curl -I http://localhost:8000/ypUouO
   ```
   Should return: `307 Temporary Redirect`

4. **Test through nginx:**
   ```bash
   curl -I https://g2url.in/ypUouO
   ```
   Should return: `307 Temporary Redirect`

5. **Check nginx logs:**
   ```bash
   sudo tail -f /var/log/nginx/access.log
   sudo tail -f /var/log/nginx/error.log
   ```

## Common Issues

### Issue 1: Frontend is being served instead of backend
**Symptom:** Visiting `/ypUouO` shows the frontend homepage or React app

**Solution:** The `location /` block is catching the request before the short code regex. Make sure the short code `location ~` block comes **BEFORE** the `location /` block.

### Issue 2: 404 Not Found
**Symptom:** Getting 404 when visiting short URLs

**Possible causes:**
- Backend is not running
- Short code doesn't exist in database
- Nginx is not proxying correctly

**Solution:**
```bash
# Check if backend is running
curl http://localhost:8000/health

# Check if short code exists
curl http://localhost:8000/debug/ypUouO

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Issue 3: Regex not matching
**Symptom:** Short codes with mixed case or special characters not working

**Solution:** The regex `^/[a-zA-Z0-9]{6}$` matches exactly 6 alphanumeric characters. Make sure your short codes follow this pattern.

## Verification Checklist

- [ ] Nginx configuration has short code location block BEFORE frontend location block
- [ ] Backend is running on port 8000
- [ ] Short code exists in database
- [ ] Nginx configuration test passes (`nginx -t`)
- [ ] Nginx has been reloaded after changes
- [ ] Direct backend test works: `curl -I http://localhost:8000/ypUouO`
- [ ] Through nginx test works: `curl -I https://g2url.in/ypUouO`

