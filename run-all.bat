@echo off
echo Starting g2url.in - Full Stack Application
echo.

REM Start backend in a new window
start "g2url Backend" cmd /k "cd backend && run.bat"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in a new window
start "g2url Frontend" cmd /k "cd frontend && run.bat"

echo.
echo Both servers are starting in separate windows.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Close the windows or press CTRL+C in each to stop the servers.
echo.

pause

