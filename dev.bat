@echo off
title Pasaporte Digital NFC - Dev Runner
echo ======================================================
echo   Iniciando Backend y Frontend de Pasaporte Digital NFC
echo ======================================================

echo.
echo [1/2] Abriendo Backend en una nueva ventana...
start "Backend (Port 3000/API)" cmd /k "cd /d %~dp0backend && npm run dev"

echo [2/2] Abriendo Frontend en una nueva ventana...
start "Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Todo listo. Se abrieron ambas consolas independientes.
echo Puedes cerrar esta ventana sin afectar los servidores.
pause
