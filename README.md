# g2url.in - Simple URL Shortener

A clean, lightweight, and fast URL shortener website built with React (frontend) and FastAPI (backend).

## Features

- ✨ Clean and modern UI with Tailwind CSS
- 🚀 Fast URL shortening with custom codes
- 📱 Fully responsive and mobile-friendly
- 🔒 URL validation and error handling
- 📋 One-click copy to clipboard
- 🔐 Automatic authentication token management
- 🌐 Integrated with external URL shortening API

## Project Structure

```
g2url/
├── backend/          # FastAPI backend
│   ├── main.py      # Main application file
│   ├── requirements.txt
│   ├── run.bat      # Windows batch runner
│   ├── run.ps1      # PowerShell runner
│   └── run.sh       # Linux/Mac shell runner
├── frontend/         # React frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── run.bat      # Windows batch runner
│   ├── run.ps1      # PowerShell runner
│   └── run.sh       # Linux/Mac shell runner
├── run-all.bat      # Run both servers (Windows)
├── run-all.ps1      # Run both servers (PowerShell)
└── README.md
```

## Prerequisites

- Node.js 16+ and npm (for frontend)
- Internet connection (uses external API)

## Quick Start (Using Runner Scripts)

### Windows

**Option 1: Run everything at once**
```bash
# Double-click or run from terminal:
run-all.bat
# or
.\run-all.ps1
```

**Option 2: Run separately**
```bash
# Backend only
cd backend
run.bat
# or
.\run.ps1

# Frontend only (in a new terminal)
cd frontend
run.bat
# or
.\run.ps1
```

### Linux/Mac

```bash
# Make scripts executable (first time only)
chmod +x backend/run.sh frontend/run.sh

# Run backend
cd backend
./run.sh

# Run frontend (in a new terminal)
cd frontend
./run.sh
```

## Manual Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (recommended):
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # Linux/Mac
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the backend server:
   ```bash
   python main.py
   ```
   
   Or using uvicorn directly:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

   The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:3000`

## API Integration

This application uses an external API for URL shortening: [https://letmehelpyou-api-production.up.railway.app](https://letmehelpyou-api-production.up.railway.app)

### Authentication
- **Endpoint:** `POST /v1/auth/guest-token`
- **Description:** Automatically handled by the frontend to get access tokens
- **Token Expiry:** 30 minutes (automatically refreshed)

### Create Short URL
- **Endpoint:** `POST /v1/shorten/create`
- **Authentication:** Required (Bearer token)
- **Request:**
```json
{
  "original_url": "https://example.com/very/long/url",
  "custom_code": "abc123",
  "expires_in_days": 30,
  "title": "",
  "description": "",
  "tags": [],
  "domain": "default"
}
```

- **Response:**
```json
{
  "id": "ad3baca1-767d-49ff-9f57-cd8f1855f3c2",
  "short_url": "https://letmehelpyou.in/abc123",
  "original_url": "https://example.com/very/long/url",
  "expires_at": "2025-12-16T07:47:45.761442Z",
  "created_at": "2025-11-16T07:47:45.825479Z",
  "access_count": 0,
  "is_active": true
}
```

### Redirect Short URL
- **Endpoint:** `GET /v1/shorten/redirect/{short_code}`
- **Description:** Handled by nginx proxying to the external API
- **Example:** `GET /abc123` → Redirects to the original long URL

## Environment Variables

### Frontend Configuration

The frontend uses environment variables to configure the external API URL.

**Development/Production** (`.env` or `.env.production`):
```env
VITE_API_URL=https://letmehelpyou-api-production.up.railway.app
```

**Note:** 
- The app uses the external API at `https://letmehelpyou-api-production.up.railway.app`
- Authentication is handled automatically via guest token endpoint
- Short URL redirects are handled by nginx proxying to the external API
- See `NGINX_CONFIG_EXTERNAL_API.md` for nginx configuration details

## Building for Production

### Frontend

1. Update the production environment variable:
   ```bash
   # Edit frontend/.env.production and set your production backend URL
   VITE_API_URL=https://your-production-domain.com
   ```

2. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

The production build will be in the `frontend/dist` directory.

### Backend

The backend is ready for production. You can use a production ASGI server like:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Deployment to DigitalOcean

### Option 1: App Platform (Recommended)

1. **Backend Deployment:**
   - Push your code to GitHub
   - Create a new App on DigitalOcean App Platform
   - Select your repository
   - Set the root directory to `backend`
   - Set the run command: `uvicorn main:app --host 0.0.0.0 --port 8080`
   - Add environment variables if needed

2. **Frontend Deployment:**
   - Create another app or add a component
   - Set root directory to `frontend`
   - Build command: `npm run build`
   - Output directory: `dist`
   - Update the API URL in frontend to point to your backend URL

### Option 2: Droplet (VPS)

1. **Setup Server:**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Python and Node.js
   sudo apt install python3 python3-pip python3-venv nginx -y
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

2. **Deploy Backend:**
   ```bash
   cd /var/www
   git clone <your-repo-url> g2url
   cd g2url/backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Setup Systemd Service:**
   Create `/etc/systemd/system/g2url-backend.service`:
   ```ini
   [Unit]
   Description=g2url Backend
   After=network.target

   [Service]
   User=www-data
   WorkingDirectory=/var/www/g2url/backend
   Environment="PATH=/var/www/g2url/backend/venv/bin"
   ExecStart=/var/www/g2url/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000

   [Install]
   WantedBy=multi-user.target
   ```

   Enable and start:
   ```bash
   sudo systemctl enable g2url-backend
   sudo systemctl start g2url-backend
   ```

4. **Deploy Frontend:**
   ```bash
   cd /var/www/g2url/frontend
   npm install
   npm run build
   ```

5. **Configure Nginx:**
   Create `/etc/nginx/sites-available/g2url`:
   ```nginx
   server {
       listen 80;
       server_name g2url.in www.g2url.in;

       # Backend API - must come before short code redirects
       location /api {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       # Short code redirects - must come before frontend root
       # Matches exactly 6 alphanumeric characters
       location ~ ^/[a-zA-Z0-9]{6}$ {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       # Frontend static files
       location / {
           root /var/www/g2url/frontend/dist;
           try_files $uri $uri/ /index.html;
       }
   }
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/g2url /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

6. **Setup SSL with Let's Encrypt:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d g2url.in -d www.g2url.in
   ```

## Environment Variables

You can customize the domain by setting environment variables:

- `DOMAIN`: Your domain name (default: `g2url.in`)
- `BACKEND_URL`: Backend API URL (for frontend)

## Database

The application uses SQLite by default. The database file (`urls.db`) will be created automatically in the backend directory.

**Schema:**
- `id`: Primary key
- `long_url`: Original long URL
- `short_code`: 6-character short code
- `created_at`: Timestamp

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
