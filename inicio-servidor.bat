@echo off
cls
echo ╔═══════════════════════════════════════════════════════════╗
echo ║  SISTEMA DE INVENTARIO - HOSPITAL REGIONAL HUEHUETENANGO ║
echo ║                  INICIANDO SERVIDOR...                    ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM Obtener IP local
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do set IP=%%a
set IP=%IP:~1%

echo 📡 IP del Servidor: %IP%
echo 🌐 URL de Acceso: http://%IP%:3000
echo.
echo ⚠️  IMPORTANTE: Los demás equipos deben usar esta URL para conectarse
echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo ⏳ Iniciando servidor...
echo.

cd server
npm start

pause