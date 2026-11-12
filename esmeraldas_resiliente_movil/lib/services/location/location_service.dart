import 'package:geolocator/geolocator.dart';
import '../../core/constants/api_constants.dart';

class LocationService {
  /// Obtiene la posición GPS actual del dispositivo con alta precisión para PostGIS (Point, 4326).
  static Future<Position?> getCurrentPosition() async {
    bool serviceEnabled;
    LocationPermission permission;

    // Verificar si el hardware de ubicación está activo
    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      // El servicio GPS está deshabilitado
      return null;
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        // Permiso denegado por el usuario
        return null;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      // Permiso denegado permanentemente en la configuración del SO
      return null;
    }

    try {
      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );
    } catch (_) {
      // Intentar obtener última posición conocida si el timeout expira
      return await Geolocator.getLastKnownPosition();
    }
  }

  /// Retorna un Point GeoJSON o WKT para la base de datos PostgreSQL/PostGIS
  static String formatPointWKT(double lon, double lat) {
    return 'SRID=4326;POINT($lon $lat)';
  }

  static Map<String, dynamic> formatPointGeoJson(double lon, double lat) {
    return {
      'type': 'Point',
      'coordinates': [lon, lat],
    };
  }

  /// Coordenadas de contingencia (Centro de la Ciudad de Esmeraldas)
  static Position get defaultEsmeraldasPosition {
    return Position(
      longitude: ApiConstants.esmeraldasLon,
      latitude: ApiConstants.esmeraldasLat,
      timestamp: DateTime.now(),
      accuracy: 10.0,
      altitude: 10.0,
      altitudeAccuracy: 1.0,
      heading: 0.0,
      headingAccuracy: 0.0,
      speed: 0.0,
      speedAccuracy: 0.0,
    );
  }
}
