@echo off
cls
echo ╔═══════════════════════════════════════════════════════════╗
echo ║             MODO DESARROLLO - BACKEND Y FRONTEND          ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo Iniciando servidor backend en http://localhost:3000
echo Iniciando cliente frontend en http://localhost:5173
echo.
echo ═══════════════════════════════════════════════════════════

start "Backend Server" cmd /k "cd server && npm run dev"
timeout /t 3 >nul
start "Frontend Client" cmd /k "cd client && npm run dev"

echo.
echo ✅ Ambos servicios iniciados
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
pause