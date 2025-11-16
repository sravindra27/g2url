# PowerShell script to run the frontend development server
Write-Host "Starting g2url.in Frontend Development Server..." -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Dependencies not found. Installing..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "Frontend server starting on http://localhost:3000" -ForegroundColor Green
Write-Host "Press CTRL+C to stop the server" -ForegroundColor Yellow
Write-Host ""

npm run dev

