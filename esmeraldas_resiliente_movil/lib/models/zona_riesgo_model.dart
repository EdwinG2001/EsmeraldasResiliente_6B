class ZonaRiesgoModel {
  final int id;
  final String nombre;
  final String tipoEvento;
  final String nivelRiesgo;
  final String? descripcion;
  final double lat;
  final double lon;
  final List<List<double>> poligono;
  final bool alertaActiva;
  final String? nivelAlerta;
  final String? mensajeAlerta;
  double? distanciaMetros;

  ZonaRiesgoModel({
    required this.id,
    required this.nombre,
    required this.tipoEvento,
    required this.nivelRiesgo,
    this.descripcion,
    required this.lat,
    required this.lon,
    this.poligono = const [],
    this.alertaActiva = false,
    this.nivelAlerta,
    this.mensajeAlerta,
    this.distanciaMetros,
  });

  factory ZonaRiesgoModel.fromJson(Map<String, dynamic> json) {
    double parsedLat = 0.9681;
    double parsedLon = -79.6582;
    final List<List<double>> puntos = [];

    if (json['geometry'] != null) {
      final geom = json['geometry'];
      final coords = geom['coordinates'];
      if (coords is List && coords.isNotEmpty) {
        // En GeoJSON Polygon: [ [ [lon, lat], [lon, lat] ... ] ]
        List ring = coords;
        if (coords[0] is List && coords[0].isNotEmpty && coords[0][0] is List) {
          ring = coords[0];
        }
        double sumLat = 0;
        double sumLon = 0;
        int count = 0;
        for (final pt in ring) {
          if (pt is List && pt.length >= 2) {
            final pLon = (pt[0] as num).toDouble();
            final pLat = (pt[1] as num).toDouble();
            puntos.add([pLat, pLon]);
            sumLon += pLon;
            sumLat += pLat;
            count++;
          }
        }
        if (count > 0) {
          parsedLat = sumLat / count;
          parsedLon = sumLon / count;
        }
      }
    }

    final props = json['properties'] ?? json;

    return ZonaRiesgoModel(
      id: (props['id'] as num?)?.toInt() ?? 0,
      nombre: props['nombre']?.toString() ?? 'Zona de Riesgo',
      tipoEvento: props['tipo_evento']?.toString() ?? 'INUNDACION',
      nivelRiesgo: props['nivel_riesgo']?.toString() ?? 'ALTO',
      descripcion: props['descripcion']?.toString(),
      lat: parsedLat,
      lon: parsedLon,
      poligono: puntos,
      alertaActiva: props['alerta_activa'] == true,
      nivelAlerta: props['nivel_alerta']?.toString(),
      mensajeAlerta: props['mensaje_alerta']?.toString(),
    );
  }
}
