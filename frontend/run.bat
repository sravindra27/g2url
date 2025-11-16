@echo off
echo Starting g2url.in Frontend Development Server...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Dependencies not found. Installing...
    call npm install
)

echo.
echo Frontend server starting on http://localhost:3000
echo Press CTRL+C to stop the server
echo.

call npm run dev

pause

