# Nginx Configuration for External API Integration

Since we're now using an external API (`https://letmehelpyou-api-production.up.railway.app`), the nginx configuration needs to proxy short code redirects to the external API's redirect endpoint.

## Updated Nginx Configuration

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name g2url.in www.g2url.in;

    # Backend API endpoints (if you still have local backend)
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Short code redirects - proxy to external API
    # Matches any alphanumeric code (custom codes can vary in length)
    # CRITICAL: Must come BEFORE frontend location block
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
        proxy_redirect off;
        proxy_ssl_verify on;
        proxy_ssl_server_name on;
    }

    # Handle redirects from external API
    location @handle_redirect {
        internal;
        return 307 $upstream_http_location;
    }

    # Frontend static files - MUST be last (catch-all)
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

## Alternative: Simpler Configuration

If the external API handles redirects properly, you can use a simpler configuration:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name g2url.in www.g2url.in;

    # Short code redirects - proxy to external API
    # Matches alphanumeric codes (custom codes can vary in length)
    location ~ ^/([a-zA-Z0-9]+)$ {
        # Exclude common paths
        if ($1 = "api") { break; }
        if ($1 = "health") { break; }
        if ($1 = "debug") { break; }
        
        # Proxy to external API redirect endpoint
        proxy_pass https://letmehelpyou-api-production.up.railway.app/v1/shorten/redirect/$1;
        proxy_set_header Host letmehelpyou-api-production.up.railway.app;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        
        # SSL verification
        proxy_ssl_verify on;
    }

    # Frontend static files
    location / {
        root /var/www/g2url/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

## Important Notes

1. **Custom Code Length**: The external API allows custom codes of varying lengths (e.g., "mit" is 3 characters, not 6). The regex pattern `^/[a-zA-Z0-9]+$` matches any alphanumeric code.

2. **Exclude Common Paths**: Make sure to exclude paths like `/api`, `/health`, etc. from being treated as short codes.

3. **SSL**: The external API uses HTTPS, so nginx needs to handle SSL properly when proxying.

4. **Domain**: Short URLs returned by the API will be `https://letmehelpyou.in/{code}`, but if you want to use `g2url.in`, you'll need to configure the domain in the API request or handle it differently.

## Testing

1. **Test redirect endpoint directly:**
   ```bash
   curl -I https://letmehelpyou-api-production.up.railway.app/v1/shorten/redirect/mit
   ```

2. **Test through nginx:**
   ```bash
   curl -I https://g2url.in/mit
   ```

3. **Check nginx logs:**
   ```bash
   sudo tail -f /var/log/nginx/access.log
   sudo tail -f /var/log/nginx/error.log
   ```

## If Using SSL (HTTPS)

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

