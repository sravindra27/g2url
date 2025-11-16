# Fix 404 Error for Short URLs

## Problem
Visiting `https://g2url.in/meatin` returns 404 Not Found.

## Root Cause
Nginx is not configured to proxy short code requests to the external API. It's likely serving the frontend instead.

## Solution: Update Nginx Configuration

Update your nginx configuration file (usually `/etc/nginx/sites-available/g2url`):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name g2url.in www.g2url.in;

    # IMPORTANT: Order matters! Short codes must come BEFORE frontend

    # 1. API endpoints (if you have any local API)
    location /api {
        # Your local API or proxy to external API
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 2. Exclude common paths from being treated as short codes
    location = /health {
        return 404;
    }
    
    location = /debug {
        return 404;
    }

    # 3. Short code redirects - CRITICAL: Must come before frontend!
    # Matches any alphanumeric code (e.g., "meatin", "mit", "abc123")
    location ~ ^/([a-zA-Z0-9]+)$ {
        # Exclude paths that shouldn't be short codes
        if ($1 ~ ^(api|health|debug|favicon|assets|static)$) {
            break;
        }
        
        # Proxy to external API redirect endpoint
        proxy_pass https://letmehelpyou-api-production.up.railway.app/v1/shorten/redirect/$1;
        proxy_set_header Host letmehelpyou-api-production.up.railway.app;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Important: Don't rewrite, pass as-is
        proxy_redirect off;
        
        # Handle SSL
        proxy_ssl_verify on;
        proxy_ssl_server_name on;
    }

    # 4. Frontend static files - MUST be last (catch-all)
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

## If Using HTTPS (SSL)

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

    # Same location blocks as above
    location ~ ^/([a-zA-Z0-9]+)$ {
        if ($1 ~ ^(api|health|debug|favicon|assets|static)$) {
            break;
        }
        
        proxy_pass https://letmehelpyou-api-production.up.railway.app/v1/shorten/redirect/$1;
        proxy_set_header Host letmehelpyou-api-production.up.railway.app;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        proxy_ssl_verify on;
        proxy_ssl_server_name on;
    }

    location / {
        root /var/www/g2url/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

## Steps to Apply Fix

1. **Edit nginx configuration:**
   ```bash
   sudo nano /etc/nginx/sites-available/g2url
   ```

2. **Test configuration:**
   ```bash
   sudo nginx -t
   ```

3. **If test passes, reload nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

4. **Test the short URL:**
   ```bash
   curl -I https://g2url.in/meatin
   ```
   
   Should return: `307 Temporary Redirect` or `302 Found`

## Troubleshooting

### Check if External API is Working

Test the external API directly:
```bash
curl -I https://letmehelpyou-api-production.up.railway.app/v1/shorten/redirect/meatin
```

Expected response:
- `307 Temporary Redirect` or `302 Found`
- `Location: <original_url>` header

### Check Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### Verify Location Block Order

The short code location block **MUST** come before the frontend `location /` block. If `location /` comes first, nginx will serve the frontend for all requests, including short codes.

### Common Issues

1. **404 from nginx**: Frontend location block is catching the request first
   - **Fix**: Move short code location block before frontend location block

2. **404 from external API**: Short code doesn't exist in the external API
   - **Fix**: Verify the short code exists by testing the external API directly

3. **502 Bad Gateway**: Can't connect to external API
   - **Fix**: Check internet connectivity, DNS resolution, and SSL certificates

4. **CORS errors**: Not applicable for redirects (redirects are server-side)

## Verification Checklist

- [ ] Nginx configuration has short code location block BEFORE frontend location block
- [ ] Short code location block proxies to external API redirect endpoint
- [ ] Nginx configuration test passes (`nginx -t`)
- [ ] Nginx has been reloaded after changes
- [ ] External API redirect endpoint works directly
- [ ] Short URL works through nginx

## Quick Test Commands

```bash
# Test external API directly
curl -I https://letmehelpyou-api-production.up.railway.app/v1/shorten/redirect/meatin

# Test through nginx
curl -I https://g2url.in/meatin

# Check nginx config
sudo nginx -t

# View nginx logs
sudo tail -f /var/log/nginx/error.log
```

