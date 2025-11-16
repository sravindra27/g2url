from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
import sqlite3
import string
import random
from urllib.parse import urlparse

# Initialize database on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="g2url.in URL Shortener", lifespan=lifespan)

# CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "https://g2url.in"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DB_PATH = "urls.db"

def init_db():
    """Initialize the SQLite database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS urls (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            long_url TEXT NOT NULL,
            short_code TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

def generate_short_code(length=6):
    """Generate a random short code"""
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

def get_unique_short_code():
    """Generate a unique short code"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    while True:
        code = generate_short_code()
        cursor.execute("SELECT id FROM urls WHERE short_code = ?", (code,))
        if not cursor.fetchone():
            conn.close()
            return code
    conn.close()


# Request/Response models
class ShortenRequest(BaseModel):
    url: str

class ShortenResponse(BaseModel):
    short_code: str
    short_url: str
    long_url: str

# API Endpoints
@app.post("/api/shorten", response_model=ShortenResponse)
async def shorten_url(request: ShortenRequest):
    """Shorten a long URL"""
    if not request.url:
        raise HTTPException(status_code=400, detail="URL is required")
    
    # Validate URL format
    url = request.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL cannot be empty")
    
    # Ensure URL has a scheme
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    
    # Validate URL format
    try:
        result = urlparse(url)
        if not all([result.scheme, result.netloc]):
            raise ValueError("Invalid URL")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid URL format")
    
    # Check if URL already exists
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT short_code FROM urls WHERE long_url = ?", (url,))
    existing = cursor.fetchone()
    
    if existing:
        short_code = existing[0]
    else:
        # Generate new short code
        short_code = get_unique_short_code()
        cursor.execute(
            "INSERT INTO urls (long_url, short_code) VALUES (?, ?)",
            (url, short_code)
        )
        conn.commit()
    
    conn.close()
    
    return ShortenResponse(
        short_code=short_code,
        short_url=f"https://g2url.in/{short_code}",
        long_url=url
    )

@app.get("/{short_code}")
async def redirect_url(short_code: str):
    """Redirect to the original URL"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT long_url FROM urls WHERE short_code = ?", (short_code,))
    result = cursor.fetchone()
    conn.close()
    
    if not result:
        raise HTTPException(status_code=404, detail="Short URL not found")
    
    return RedirectResponse(url=result[0])

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "g2url.in URL Shortener API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

