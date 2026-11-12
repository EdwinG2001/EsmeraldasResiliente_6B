@echo off
chcp 65001 > nul
echo ===============================================================================
echo     ESMERALDAS RESILIENTE MÓVIL - EJECUCIÓN WEB EN MICROSOFT EDGE
echo ===============================================================================
echo.
echo Iniciando Flutter Web en Microsoft Edge conectado a la API de Render...
cd /d "%~dp0"
flutter run -d edge --web-port=8081
pause

