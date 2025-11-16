You are building a clean and simple URL Shortener website for the domain g2url.in.

Build the entire project structure including frontend and backend.  
The website must be lightweight, minimal, fast, and mobile-friendly.

=====================================================
PROJECT NAME: g2url.in – Simple URL Shortener
=====================================================

### FRONTEND REQUIREMENTS (React + Tailwind preferred)

1. Create a simple landing page with:
   - A centered card
   - A heading: "Shorten Your Link"
   - A small tagline: "Fast, simple, reliable — g2url.in"
   - An input field where users can paste a long URL
   - A button: "Shorten URL"
   - Show the shortened URL result below with a copy button

2. When a user clicks “Shorten URL”, call the backend endpoint:
   POST /api/shorten
   Body: { "url": "<long_url>" }

3. After receiving the result:
   - Show the generated short URL (e.g., https://g2url.in/abc123)
   - Provide a "Copy" button

4. Add a simple footer:
   - "© 2025 g2url.in | Simple URL Shortener"

5. Make the UI clean, modern, and responsive.

-----------------------------------------------------

### BACKEND REQUIREMENTS (FastAPI)

1. Create a FastAPI backend with:
   - POST /api/shorten → accepts long_url and returns short code + short URL
   - GET /{short_code} → redirects to the original long URL

2. Use a simple SQLite or JSON file for saving URLs (for now).
   Table schema: id, long_url, short_code, created_at

3. Generate short codes:
   - Use random strings (length 6)
   - Ensure uniqueness

4. Handle validations:
   - Invalid URL format → return HTTP 400
   - Missing URL → return HTTP 400

5. Handle redirections with:
   return RedirectResponse(long_url)

-----------------------------------------------------

### ADDITIONAL REQUIREMENTS

- Provide a clean folder structure:
  /frontend (React)
  /backend (FastAPI)
  
- Add README with instructions:
  - How to run frontend
  - How to run backend
  - How to deploy to DigitalOcean (optional)

- Generate minimal styling but keep UI clean and user-friendly.

=====================================================
GOAL:
A complete, working, simple URL shortener website for g2url.in
that I can deploy instantly. 
=====================================================



use api: https://letmehelpyou-api-production.up.railway.app/ 
for url shortner.
End Point: v1/shorten/create
POST
Input:

{
  "original_url": "https://meatintowns.com",
  "custom_code": "mit",
  "expires_in_days": 30,
  "title": "meatintowns",
  "description": "meatintowns",
  "tags": [
    "meatintowns"
  ],
  "domain": "default"
}

Output:

{
  "id": "ad3baca1-767d-49ff-9f57-cd8f1855f3c2",
  "short_url": "https://letmehelpyou.in/mit",
  "original_url": "https://meatintowns.com/",
  "expires_at": "2025-12-16T07:47:45.761442Z",
  "created_at": "2025-11-16T07:47:45.825479Z",
  "title": "meatintowns",
  "description": "meatintowns",
  "tags": [
    "meatintowns"
  ],
  "domain": "default",
  "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUoAAAFKAQAAAABTUiuoAAAB40lEQVR4nO2bQYrcMBBFX0WGXsqQA+Qo9s1yNesofYCAtRyw+VlI6u5JNu0B92iYqqX8Fh/Er/qSsIknK/14lgRHHXXUUUcdPRO1WgOQB8xswObclufTBTh6BJ0kSSvYDEh6My0ESZLeo+cIcPQImquFtMQNm/NQlqvfXiDA0Q+gZXvSWF32egGOHkC1xA0tUf+fw7rT+v3Q1ueigAxG3AfAEBke9+zTtTpa0WRmZiMwXS9iWoNsZi+R8BUCHH2mirfuFlIaMZF3q347W4CjB1AeMvq0AsQNIKhNsK0gWj5dq6MPu6UlStIaSidk0oYk363eUGkNup+ygN1IdtFjlu9E63dGm3GiBFG632qUmtTW3Fu9oDYDkAdINkD6taGFIMieCftB69ya1hYrpNvp2FNGx6j9vl4E+VIcpSUP2IzPrX7Q5q2box7i4IrPrb7QlgLzT9l0tXI6JlmQtQ+bzhTg6PFMeKvmsq3aiti+uLd6Qd+9Hdd7whIRp6u/HfeD3uZWvcaoVYZXC4burc7Q9nZcTTbuRjKzciX/CgGOfhQtN4YLQaRx907YL1r6Xx6oeYPg3uoG/fftGPKIJu0G8c8AcT1XgKPHU0atoPq+VTphKz8dd4Ka/7XgqKOOOuroF0L/Apr6U7LdwNZsAAAAAElFTkSuQmCC",
  "access_count": 0,
  "is_active": true
}

Login token generator end point 
https://letmehelpyou-api-production.up.railway.app/v1/auth/guest-token 

Output:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MWM1MGJmMC02MDViLTRmOTItOTY3My00YWFmYzBiY2NmNWQiLCJlbWFpbCI6ImFkbWluQGxldG1laGVscHlvdS5jb20iLCJ1c2VybmFtZSI6ImFkbWluQGxldG1laGVscHlvdS5jb20iLCJpYXQiOjE3NjMyNzk3NDcsImV4cCI6MTc2MzI4MTU0N30.PefM8RFluTeQ8MTcjI2ZRRuoE7SiPMKOX5pVdkbE51Q",
  "token_type": "bearer",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MWM1MGJmMC02MDViLTRmOTItOTY3My00YWFmYzBiY2NmNWQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MzI3OTc0NywiZXhwIjoxNzYzODg0NTQ3LCJqdGkiOiJ1c3N6MmhwWlplUSJ9.ny1WG9H7CPSn4wtVaIB6LHhP7v_9aGlUeh8ELlw1Dk0",
  "expires_in": 1800
}

Use access_token

Call: v1/shorten/redirect/{short_code} for redirection

