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

