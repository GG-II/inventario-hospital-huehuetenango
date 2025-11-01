@echo off
cls
echo ╔═══════════════════════════════════════════════════════════╗
echo ║  SISTEMA DE INVENTARIO - HOSPITAL REGIONAL HUEHUETENANGO ║
echo ║                      INSTALADOR                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo [1/5] Verificando Node.js...

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js no está instalado
    echo.
    echo Por favor instala Node.js desde: https://nodejs.org
    echo.
    pause
    exit
)

echo ✅ Node.js encontrado
echo.
echo [2/5] Instalando dependencias del servidor...
cd server
call npm install
if %errorlevel% neq 0 (
    echo ❌ Error al instalar dependencias del servidor
    pause
    exit
)

echo.
echo [3/5] Instalando dependencias del cliente...
cd ..\client
call npm install
if %errorlevel% neq 0 (
    echo ❌ Error al instalar dependencias del cliente
    pause
    exit
)

echo.
echo [4/5] Compilando aplicación cliente...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Error al compilar cliente
    pause
    exit
)

echo.
echo [5/5] Moviendo archivos al servidor...
cd ..
xcopy /E /I /Y client\dist server\public

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║              ✅ INSTALACIÓN COMPLETADA                    ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo El sistema está listo para ejecutarse.
echo.
echo Para iniciar el servidor, ejecute: inicio-servidor.bat
echo.
pause