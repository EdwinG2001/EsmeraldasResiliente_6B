class ApiConstants {
  // Base URLs de Producción (Render) y Desarrollo Local
  // URL verificada en vivo en Render (Cloudflare + Gunicorn + PostGIS)
  static const String prodBaseUrl = 'https://esmeraldasresiliente-6b.onrender.com/api/v1';
  static const String devLocalUrl = 'http://192.168.1.4:8080/api/v1';
  static const String devEmulatorUrl = 'http://10.0.2.2:8080/api/v1';
  static const String devWebUrl = 'http://localhost:8080/api/v1';

  // URL Activa por defecto (Render en la nube)
  static String activeBaseUrl = prodBaseUrl;

  // Autenticación JWT
  static const String login = '/auth/login/';
  static const String registro = '/auth/registro/';
  static const String tokenRefresh = '/auth/token/refresh/';
  static const String perfil = '/auth/perfil/';

  // Keycloak IAM (Single Sign-On para Censadores y Operativos)
  static const String keycloakBaseUrl = 'https://innocent-arrivals-sec-penetration.trycloudflare.com';
  static const String keycloakRealm = 'esmeraldas-resiliente';
  static const String keycloakClientId = 'frontend-web';
  static const String keycloakTokenUrl = '$keycloakBaseUrl/realms/$keycloakRealm/protocol/openid-connect/token';
  static const String keycloakUserInfoUrl = '$keycloakBaseUrl/realms/$keycloakRealm/protocol/openid-connect/userinfo';

  // Asistencia Humanitaria y Censo (Tabla: familias_censo)
  static const String censoFamilias = '/humanitaria/censo-familias/';
  static const String verificarCenso = '/humanitaria/censo-familias/verificar/';
  static const String solicitudesCenso = '/humanitaria/solicitudes-censo/';
  static const String suministros = '/humanitaria/suministros/';

  // Reportes Ciudadanos e Incidentes (Tabla: reportes_incidentes)
  static const String reportesList = '/reportes/';
  static const String crearReporte = '/reportes/crear/';
  static const String sincronizarOffline = '/reportes/sincronizar-offline/';

  // Módulo Geoespacial GIS (PostGIS)
  static const String zonasRiesgo = '/gis/zonas-riesgo/';
  static const String redHidricaVial = '/gis/red-hidrica-vial/';
  static const String infraestructuras = '/gis/infraestructuras/';

  // Módulos 4 & 5: Evacuación, Albergues y Asistencia Humanitaria
  static const String albergues = '/evacuacion/albergues/';
  static const String albergueCercano = '/evacuacion/albergue-cercano/';
  static const String vias = '/evacuacion/vias/';

  // Clima
  static const String climaActual = '/clima/actual/?canton=esmeraldas';

  // Coordenadas predeterminadas (Centro del Cantón Esmeraldas)
  static const double esmeraldasLat = 0.9681;
  static const double esmeraldasLon = -79.6582;
}
