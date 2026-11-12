# 📱 Esmeraldas Resiliente Móvil (Flutter)

Aplicación móvil oficial en Flutter para el **Sistema de Gestión de Riesgos, Monitoreo Comunitario y Censo de Desastres del Cantón Esmeraldas**.

Conectada en vivo al **Backend en Render**:  
🌐 **`https://esmeraldasresiliente-6b.onrender.com/api/v1`**  
*(Compatible con cualquier red WiFi o datos móviles 4G/5G, con respaldo de sincronización offline SQLite)*

---

## 👥 Separación Estricta de Roles

1. **👷 Trabajador / Censista (Ficha Censal en Territorio):**
   - Acceso inmediato al **Formulario de Levantamiento Censal** (`CensoFormScreen`).
   - Registro de familias afectadas:
     * Cédula ecuatoriana del jefe de hogar (validación módulo 10).
     * Nombre, celular, barrio (autocompletado de sectores de Esmeraldas: Teaone, 50 Casas, Las Palmas, Propicia, Codesa).
     * Ubicación satelital GPS automática (PostGIS).
     * Contadores de vulnerabilidad (niños < 5 años, tercera edad, discapacitados).
     * Nivel de daño en vivienda (Leve, Parcial, Total) y necesidad de evacuación.
   - Sincronización híbrida: Si hay red, se guarda directamente en la base de datos PostgreSQL + PostGIS de Render; si no hay cobertura en campo, se almacena en la cola local SQLite y se sube al reconectarse (`CensoOfflineQueueScreen`).

2. **👤 Ciudadano (Las 5 Pantallas Tácticas de la Maqueta / Mockup):**
   - **📱 Phone 1 — Citizen Alert App (`citizen_alert_tab.dart`):** Alerta activa en tiempo real (*"POTENTIAL FLOODING at Esmeraldas"*), triángulo neón pulsante y botón SOS *"Report Incident"*.
   - **🗺️ Phone 2 — GIS Risk Map (`gis_risk_map_tab.dart`):** Mapa interactivo CartoDB Dark Matter con polígonos PostGIS reales de inundación del Río Teaone y deslizamientos, pines de incidentes activos y botón flotante de centrado GPS *"Current Location"*.
   - **📡 Phone 3 — COE Incident Tracking (`incident_tracking_tab.dart`):** Búsqueda táctica *"Search..."*, selector de sector *"Este ▼"* y tarjetas de reportes con severidad crítica/media/atendido y distancia calculada por GPS (*"150m de ti"*, *"420m de ti"*).
   - **🏃 Phone 4 — Evacuation & Help (`evacuation_help_tab.dart`):** Trazado de ruta óptima en línea azul hacia el albergue seguro más cercano con cupos reales desde PostGIS, switch activo *"Family Help Status"* y botón *"Calculate Help"* para asignación de kits de alimentos, salud y abrigo según el censo.
   - **⚙️ Phone 5 — Mi Perfil y Ajustes (`perfil_ajustes_screen.dart`):** Modificación de datos personales, teléfono de emergencia y selector de red (Render Nube / WiFi Local / Emulador).

---

## 🚀 Cómo Instalar y Ejecutar en tu Celular (TECNO SPARK 10 Pro)

### Opción 1: Instalación Rápida con el instalador automático (`.bat`)
1. En tu teléfono **TECNO SPARK 10 Pro**, activa la **Depuración por USB**:
   - Ve a **Ajustes** ➔ **Mi teléfono**.
   - Pulsa 7 veces sobre **Número de compilación**.
   - Ve a **Ajustes** ➔ **Sistema** ➔ **Opciones de desarrollador**.
   - Activa el interruptor **Depuración por USB**.
   - En la pantalla de tu celular aparecerá un mensaje: marca *"Permitir siempre desde esta computadora"* y pulsa **Aceptar**.
2. Haz doble clic en el archivo:
   ```cmd
   instalar_en_celular.bat
   ```
   ¡Se instalará e iniciará automáticamente en la pantalla de tu celular!

### Opción 2: Instalar el archivo APK directamente
El archivo APK ya compilado y listo para instalar se encuentra en:
📁 **`esmeraldas_resiliente_movil/esmeraldas_resiliente.apk`**
Copia este archivo a la memoria de tu celular y ábrelo para instalar.

### Opción 3: Probar en Microsoft Edge sin cables
Haz doble clic en:
```cmd
ejecutar_en_edge.bat
```
o abre el simulador visual en:
```cmd
abrir_en_edge.bat
```

---

## 🔑 Credenciales de Prueba y Demostración

- **Modo Ciudadano:**
  - Teléfono / Usuario: `0991234567`
  - Contraseña: `password123`
  - *(O pulsar el botón directo "Ver Mockup Ciudadano")*

- **Modo Trabajador de Censo / Brigadista:**
  - Teléfono / Usuario: `0998877665` o `admin`
  - Contraseña: `password123`
  - *(O pulsar el botón directo "Ver Formulario Censo")*
