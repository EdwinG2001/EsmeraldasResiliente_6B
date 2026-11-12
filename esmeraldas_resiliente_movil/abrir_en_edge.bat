@echo off
chcp 65001 > nul
echo ===============================================================================
echo   ABRIENDO SIMULADOR ESMERALDAS RESILIENTE MÓVIL EN MICROSOFT EDGE
echo ===============================================================================
start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" "%~dp0simulador_edge.html"
echo.
echo Simulador iniciado en Microsoft Edge.
pause
