class AlbergueModel {
  final int id;
  final String nombre;
  final String direccion;
  final int capacidadMaxima;
  final int ocupacionActual;
  final String? contactoResponsable;
  final String? telefonoContacto;
  final double lat;
  final double lon;
  final bool activo;
  double? distanciaMetros;

  AlbergueModel({
    required this.id,
    required this.nombre,
    required this.direccion,
    required this.capacidadMaxima,
    required this.ocupacionActual,
    this.contactoResponsable,
    this.telefonoContacto,
    required this.lat,
    required this.lon,
    this.activo = true,
    this.distanciaMetros,
  });

  int get cuposDisponibles => (capacidadMaxima - ocupacionActual).clamp(0, capacidadMaxima);

  factory AlbergueModel.fromJson(Map<String, dynamic> json) {
    double parsedLat = 0.9681;
    double parsedLon = -79.6582;

    if (json['geometry'] != null && json['geometry']['coordinates'] is List) {
      final coords = json['geometry']['coordinates'] as List;
      if (coords.length >= 2) {
        parsedLon = (coords[0] as num).toDouble();
        parsedLat = (coords[1] as num).toDouble();
      }
    } else {
      if (json['lat'] != null) parsedLat = (json['lat'] as num).toDouble();
      if (json['lon'] != null) parsedLon = (json['lon'] as num).toDouble();
      if (json['latitud'] != null) parsedLat = (json['latitud'] as num).toDouble();
      if (json['longitud'] != null) parsedLon = (json['longitud'] as num).toDouble();
    }

    final props = json['properties'] ?? json;

    return AlbergueModel(
      id: (props['id'] as num?)?.toInt() ?? 1,
      nombre: props['nombre']?.toString() ?? 'Albergue Seguro',
      direccion: props['direccion']?.toString() ?? 'Esmeraldas, Ecuador',
      capacidadMaxima: (props['capacidad_maxima'] as num?)?.toInt() ?? 250,
      ocupacionActual: (props['ocupacion_actual'] as num?)?.toInt() ?? 0,
      contactoResponsable: props['contacto_responsable']?.toString(),
      telefonoContacto: props['telefono_contacto']?.toString(),
      lat: parsedLat,
      lon: parsedLon,
      activo: props['activo'] != false,
      distanciaMetros: (props['distancia_metros'] as num?)?.toDouble(),
    );
  }
}
