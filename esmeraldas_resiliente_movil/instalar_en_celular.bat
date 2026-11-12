@echo off
chcp 65001 > nul
echo ===============================================================================
echo     ESMERALDAS RESILIENTE MÓVIL - INSTALADOR DIRECTO EN DISPOSITIVO ANDROID
echo ===============================================================================
echo.

set APK_PATH=%~dp0build\app\outputs\flutter-apk\app-debug.apk

if not exist "%APK_PATH%" (
    echo [!] Compilando APK actualizada...
    call flutter build apk --debug
)

if not exist "%APK_PATH%" (
    echo [ERROR] No se pudo encontrar el archivo APK en:
    echo %APK_PATH%
    pause
    exit /b 1
)

echo.
echo [1/3] Verificando dispositivo móvil conectado...
adb devices
echo.

adb get-state 1>nul 2>nul
if %errorlevel% neq 0 (
    echo -------------------------------------------------------------------------------
    echo [AVISO] Tu teléfono está conectado por cable, pero debes activar la:
    echo         👉 "DEPURACIÓN POR USB" (USB DEBUGGING)
    echo.
    echo Pasos en tu TECNO SPARK 10 Pro (HiOS):
    echo  1. Ve a "Ajustes" -> "Mi teléfono".
    echo  2. Pulsa 7 veces seguidas sobre "Número de compilación" hasta ver el mensaje.
    echo  3. Vuelve a "Ajustes" -> "Sistema" -> "Opciones de desarrollador".
    echo  4. Activa el interruptor "Depuración por USB".
    echo  5. En la pantalla de tu celular aparecerá un mensaje:
    echo     Marca "Permitir siempre desde esta computadora" y pulsa ACEPTAR.
    echo -------------------------------------------------------------------------------
    echo.
    echo Presiona cualquier tecla una vez que hayas activado la Depuración USB...
    pause > nul
)

echo [2/3] Instalando Esmeraldas Resiliente Móvil en el dispositivo...
adb install -r "%APK_PATH%"

if %errorlevel% equ 0 (
    echo.
    echo [3/3] ¡Instalación exitosa! Iniciando la aplicación en tu celular...
    adb shell monkey -p com.example.esmeraldas_resiliente_movil -c android.intent.category.LAUNCHER 1
    echo.
    echo ===============================================================================
    echo   ¡APLICACIÓN FUNCIONANDO EN TU DISPOSITIVO MÓVIL!
    echo   Conectada a la API de Render en la nube:
    echo   https://esmeraldasresiliente-6b.onrender.com/api/v1/
    echo ===============================================================================
) else (
    echo [!] No se pudo instalar automáticamente por ADB.
    echo Puedes copiar el APK manualmente a tu teléfono:
    echo Archivo APK: %APK_PATH%
)

echo.
pause

