@echo off
chcp 65001 > nul
echo ===============================================================================
echo     ESMERALDAS RESILIENTE MÓVIL - EJECUCIÓN DIRECTA EN CELULAR ANDROID
echo ===============================================================================
echo.
echo Verificando dispositivo conectado...
adb devices
echo.
echo Ejecutando la aplicación en tu celular con Flutter...
cd /d "%~dp0"
flutter run
pause

