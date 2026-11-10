@echo off
chcp 65001 > nul
echo ===============================================================================
echo   ABRIENDO ESMERALDAS RESILIENTE MÓVIL EN MICROSOFT EDGE
echo ===============================================================================
start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" "%~dp0esmeraldas_resiliente_movil\simulador_edge.html"
echo.
echo Abierto exitosamente en Microsoft Edge.
pause
