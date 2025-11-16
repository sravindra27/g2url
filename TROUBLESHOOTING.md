# Troubleshooting Guide

## URL Redirection Not Working (404 Error)

If short URLs like `https://g2url.in/DE1hRd` are returning 404, follow these steps:

### Step 1: Check if Short Code Exists in Database

Run the diagnostic script:
```bash
cd /var/www/g2url/backend
source venv/bin/activate
python check_short_code.py DE1hRd
```

Or manually check:
```bash
python3 -c "import sqlite3; conn = sqlite3.connect('urls.db'); cursor = conn.cursor(); cursor.execute('SELECT * FROM urls WHERE short_code = ?', ('DE1hRd',)); print(cursor.fetchone()); conn.close()"
```

### Step 2: Test Backend Directly

Test if the backend can handle the request:
```bash
curl -I http://localhost:8000/DE1hRd
```

Should return `307 Temporary Redirect` if working.

### Step 3: Check Nginx Configuration

The nginx config **MUST** have this exact order:

```nginx
# 1. API endpoints
location /api { ... }

# 2. Short code redirects (regex pattern)
location ~ ^/[a-zA-Z0-9]{6}$ { ... }

# 3. Frontend static files (LAST)
location / { ... }
```

**Critical:** If the frontend `location /` comes before the short code regex, nginx will serve the frontend instead of proxying to the backend!

### Step 4: Verify Nginx is Routing Correctly

Check nginx access logs:
```bash
sudo tail -f /var/log/nginx/access.log
```

Then visit `https://g2url.in/DE1hRd` and see if the request appears in the logs.

### Step 5: Test Debug Endpoint

Visit: `https://g2url.in/debug/DE1hRd`

This will tell you if:
- The short code exists in the database
- The backend is accessible
- The route is working

## URL Redirection Not Working (Other Issues)

If short URLs are not redirecting for other reasons, check the following:

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

