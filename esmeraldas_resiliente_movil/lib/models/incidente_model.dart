import 'package:uuid/uuid.dart';

class IncidenteModel {
  final String id;
  final String tipoEvento;
  final String nivelGravedad;
  final String descripcion;
  final double lat;
  final double lon;
  final double? precisionGpsMetros;
  final int personasAtrapadas;
  final int familiasAfectadas;
  final String? estimacionDanosVivienda;
  final String estado;
  final bool esSimulacion;
  final bool sincronizadoOffline;
  final String fechaIncidente;
  final List<String> fotos;
  final String? usuarioNombre;

  // Campos calculados por el motor geoespacial PostGIS (Cruce con Familias Censadas a 25m)
  final int personasAfectadasEstimadas;
  final int familiasEnPerimetro;
  final int ninosEnRiesgo;
  final int adultosMayoresRiesgo;
  final int discapacitadosRiesgo;
  final double radioAnalisisMetros;

  // Propiedad en memoria calculada contra el GPS del dispositivo
  double? distanciaMetros;

  IncidenteModel({
    String? id,
    required this.tipoEvento,
    this.nivelGravedad = 'MEDIO',
    required this.descripcion,
    required this.lat,
    required this.lon,
    this.precisionGpsMetros,
    this.personasAtrapadas = 0,
    this.familiasAfectadas = 0,
    this.estimacionDanosVivienda,
    this.estado = 'PENDIENTE',
    this.esSimulacion = false,
    this.sincronizadoOffline = false,
    String? fechaIncidente,
    this.fotos = const [],
    this.usuarioNombre,
    this.personasAfectadasEstimadas = 0,
    this.familiasEnPerimetro = 0,
    this.ninosEnRiesgo = 0,
    this.adultosMayoresRiesgo = 0,
    this.discapacitadosRiesgo = 0,
    this.radioAnalisisMetros = 25.0,
    this.distanciaMetros,
  })  : id = id ?? const Uuid().v4(),
        fechaIncidente = fechaIncidente ?? DateTime.now().toIso8601String();

  factory IncidenteModel.fromJson(Map<String, dynamic> json) {
    double _parseDouble(dynamic val, [double def = 0.0]) {
      if (val == null) return def;
      if (val is num) return val.toDouble();
      if (val is String) return double.tryParse(val) ?? def;
      return def;
    }

    int _parseInt(dynamic val, [int def = 0]) {
      if (val == null) return def;
      if (val is num) return val.toInt();
      if (val is String) return int.tryParse(val) ?? def;
      return def;
    }

    double parsedLat = 0.9681;
    double parsedLon = -79.6582;

    if (json['geometry'] != null && json['geometry']['coordinates'] is List) {
      final coords = json['geometry']['coordinates'] as List;
      if (coords.length >= 2) {
        parsedLon = _parseDouble(coords[0], -79.6582);
        parsedLat = _parseDouble(coords[1], 0.9681);
      }
    } else {
      if (json['lat'] != null) parsedLat = _parseDouble(json['lat'], 0.9681);
      if (json['lon'] != null) parsedLon = _parseDouble(json['lon'], -79.6582);
    }

    final props = json['properties'] ?? json;

    final fotosList = <String>[];
    if (props['fotos'] is List) {
      for (final f in props['fotos']) {
        if (f is Map && f['url_archivo'] != null) {
          fotosList.add(f['url_archivo'].toString());
        } else if (f is String) {
          fotosList.add(f);
        }
      }
    }

    return IncidenteModel(
      id: props['id']?.toString() ?? '',
      tipoEvento: props['tipo_evento']?.toString() ?? 'EMERGENCIA',
      nivelGravedad: props['nivel_gravedad']?.toString() ?? 'MEDIO',
      descripcion: props['descripcion']?.toString() ?? '',
      lat: parsedLat,
      lon: parsedLon,
      precisionGpsMetros: props['precision_gps_metros'] != null ? _parseDouble(props['precision_gps_metros']) : null,
      personasAtrapadas: _parseInt(props['personas_atrapadas']),
      familiasAfectadas: _parseInt(props['familias_afectadas']),
      estimacionDanosVivienda: props['estimacion_danos_vivienda']?.toString(),
      estado: props['estado']?.toString() ?? 'PENDIENTE',
      esSimulacion: props['es_simulacion'] == true,
      sincronizadoOffline: props['sincronizado_offline'] == true,
      fechaIncidente: props['fecha_incidente']?.toString() ??
          props['fecha_recepcion_servidor']?.toString(),
      fotos: fotosList,
      usuarioNombre: props['usuario_nombre']?.toString(),
      personasAfectadasEstimadas: _parseInt(props['personas_afectadas_estimadas']),
      familiasEnPerimetro: _parseInt(props['familias_en_perimetro']),
      ninosEnRiesgo: _parseInt(props['ninos_en_riesgo']),
      adultosMayoresRiesgo: _parseInt(props['adultos_mayores_riesgo']),
      discapacitadosRiesgo: _parseInt(props['discapacitados_riesgo']),
      radioAnalisisMetros: _parseDouble(props['radio_analisis_metros'], 25.0),
    );
  }

  String get tiempoRelativo {
    try {
      final dt = DateTime.parse(fechaIncidente);
      final diff = DateTime.now().difference(dt);
      if (diff.inSeconds < 60) return 'Hace un momento';
      if (diff.inMinutes < 60) return 'Hace ${diff.inMinutes} min';
      if (diff.inHours < 24) return 'Hace ${diff.inHours} h';
      if (diff.inDays < 7) return 'Hace ${diff.inDays} d';
      return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}';
    } catch (_) {
      return 'Reciente';
    }
  }

  Map<String, dynamic> toApiJson() {
    final map = <String, dynamic>{
      'id': id,
      'tipo_evento': tipoEvento,
      'nivel_gravedad': nivelGravedad,
      'descripcion': descripcion,
      'lat': lat,
      'lon': lon,
      'personas_atrapadas': personasAtrapadas,
      'familias_afectadas': familiasAfectadas,
      'es_simulacion': esSimulacion,
      'sincronizado_offline': sincronizadoOffline,
      'fecha_incidente': fechaIncidente,
    };
    if (usuarioNombre != null && usuarioNombre!.trim().isNotEmpty) {
      map['nombre_informante'] = usuarioNombre!.trim();
    }
    if (precisionGpsMetros != null) {
      map['precision_gps_metros'] = precisionGpsMetros;
    }
    if (estimacionDanosVivienda != null && estimacionDanosVivienda!.trim().isNotEmpty) {
      map['estimacion_danos_vivienda'] = estimacionDanosVivienda!.trim();
    }
    return map;
  }

  Map<String, dynamic> toSqliteMap() {
    return {
      'id': id,
      'tipo_evento': tipoEvento,
      'nivel_gravedad': nivelGravedad,
      'descripcion': descripcion,
      'lat': lat,
      'lon': lon,
      'precision_gps_metros': precisionGpsMetros,
      'personas_atrapadas': personasAtrapadas,
      'familias_afectadas': familiasAfectadas,
      'estimacion_danos_vivienda': estimacionDanosVivienda,
      'estado': estado,
      'es_simulacion': esSimulacion ? 1 : 0,
      'sincronizado_offline': sincronizadoOffline ? 1 : 0,
      'fecha_incidente': fechaIncidente,
      'fotos': fotos.join(';'),
    };
  }

  factory IncidenteModel.fromSqliteMap(Map<String, dynamic> map) {
    return IncidenteModel(
      id: map['id']?.toString() ?? '',
      tipoEvento: map['tipo_evento']?.toString() ?? 'EMERGENCIA',
      nivelGravedad: map['nivel_gravedad']?.toString() ?? 'MEDIO',
      descripcion: map['descripcion']?.toString() ?? '',
      lat: (map['lat'] as num?)?.toDouble() ?? 0.9681,
      lon: (map['lon'] as num?)?.toDouble() ?? -79.6582,
      precisionGpsMetros: (map['precision_gps_metros'] as num?)?.toDouble(),
      personasAtrapadas: (map['personas_atrapadas'] as num?)?.toInt() ?? 0,
      familiasAfectadas: (map['familias_afectadas'] as num?)?.toInt() ?? 0,
      estimacionDanosVivienda: map['estimacion_danos_vivienda']?.toString(),
      estado: map['estado']?.toString() ?? 'PENDIENTE',
      esSimulacion: map['es_simulacion'] == 1,
      sincronizadoOffline: map['sincronizado_offline'] == 1,
      fechaIncidente: map['fecha_incidente']?.toString(),
      fotos: (map['fotos'] as String?)?.split(';').where((s) => s.isNotEmpty).toList() ?? [],
    );
  }
}
