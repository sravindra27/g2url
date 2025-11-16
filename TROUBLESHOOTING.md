# Troubleshooting Guide

## URL Redirection Not Working

If short URLs like `https://g2url.in/OgSLXu` are not redirecting, check the following:

### 1. Check Nginx Configuration

The nginx configuration **must** have location blocks in this order:

```nginx
# 1. API endpoints first
location /api { ... }

# 2. Short code redirects second (before frontend)
location ~ ^/[a-zA-Z0-9]{6}$ { ... }

# 3. Frontend static files last
location / { ... }
```

**Important:** The short code location block must come BEFORE the frontend root location block, otherwise nginx will try to serve it as a static file.

### 2. Verify Backend is Running

Check if the backend is running:
```bash
curl http://localhost:8000/health
```

Should return: `{"status":"healthy","service":"g2url.in"}`

### 3. Test Short Code Directly

Test if the short code exists in the database:
```bash
curl http://localhost:8000/debug/OgSLXu
```

Or test the redirect endpoint directly:
```bash
curl -I http://localhost:8000/OgSLXu
```

Should return a `307 Temporary Redirect` status.

### 4. Check Nginx Logs

Check nginx error logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

Check nginx access logs:
```bash
sudo tail -f /var/log/nginx/access.log
```

### 5. Reload Nginx Configuration

After updating nginx config:
```bash
sudo nginx -t  # Test configuration
sudo systemctl reload nginx  # Reload nginx
```

### 6. Verify Database

Check if the short code exists in the database:
```bash
cd /var/www/g2url/backend
source venv/bin/activate
python3 -c "import sqlite3; conn = sqlite3.connect('urls.db'); cursor = conn.cursor(); cursor.execute('SELECT * FROM urls WHERE short_code = ?', ('OgSLXu',)); print(cursor.fetchone()); conn.close()"
```

### 7. Common Issues

**Issue:** Short code returns 404
- **Solution:** Check if the short code exists in the database
- **Solution:** Verify nginx is proxying to the backend correctly

**Issue:** Short code loads frontend page instead of redirecting
- **Solution:** Reorder nginx location blocks (short code regex must come before `/`)
- **Solution:** Check nginx regex pattern matches: `^/[a-zA-Z0-9]{6}$`

**Issue:** CORS errors
- **Solution:** Verify CORS middleware in backend includes your domain
- **Solution:** Check backend `allow_origins` includes `https://g2url.in`

### 8. Test Endpoints

- Health check: `https://g2url.in/health`
- Debug short code: `https://g2url.in/debug/OgSLXu`
- API root: `https://g2url.in/`
- Short code redirect: `https://g2url.in/OgSLXu`

