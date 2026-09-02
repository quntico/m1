@echo off
setlocal enabledelayedexpansion
title M1 CONTROL CENTER

echo ==========================================================
echo               M1 CONTROL CENTER
echo ==========================================================
echo Iniciando sistema...
echo.

:: 1. Cambiar al directorio raiz del proyecto
cd /d "%~dp0\..\.."

:: 2. Verificar Node.js y npm
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] M1 requiere Node.js para ejecutarse.
    echo Por favor, descarga e instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] M1 requiere npm para ejecutarse. Verifica tu instalacion de Node.js.
    pause
    exit /b 1
)

:: 3. Verificar dependencias
if not exist "node_modules\" (
    echo [INFO] Detectada primera ejecucion o falta de node_modules. Instalando dependencias...
    call npm install
    if !errorlevel! neq 0 (
        echo [ERROR] Ocurrio un problema instalando las dependencias.
        pause
        exit /b 1
    )
)

:: 4. Comprobar si localhost:3000 ya esta respondiendo
echo Comprobando si M1 ya esta en ejecucion...
powershell -NoProfile -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 1; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
if %errorlevel% equ 0 (
    echo [OK] El sistema ya esta en ejecucion localmente. Abriendo navegador...
    start http://localhost:3000
    exit /b 0
)

:: 5. Si no esta corriendo, iniciar el servidor
echo [INFO] Encendiendo Frontend y API de Bid Architect...
start "M1 PRECAL ENGINE" cmd /c "npm run dev & pause"

:: 6. Esperar a que el servidor este listo
echo Esperando a que el sistema arranque (localhost:3000)...
:waitloop
powershell -NoProfile -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 1; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
if %errorlevel% neq 0 (
    timeout /t 2 >nul
    goto waitloop
)

:: 7. Listos!
echo.
echo ==========================================================
echo           M1 CONTROL CENTER ONLINE
echo.          
echo Frontend: http://localhost:3000
echo API:      http://localhost:3001
echo.          
echo Abriendo navegador automaticamente...
echo ==========================================================
ping 127.0.0.1 -n 2 > nul
start http://localhost:3000
exit /b 0
