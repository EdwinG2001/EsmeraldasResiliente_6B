import 'package:uuid/uuid.dart';

class CensoFamiliaModel {
  final String id;
  final String codigoCenso;
  final String jefeFamiliaNombre;
  final String jefeFamiliaCedula;
  final String? telefonoContacto;
  final String canton;
  final String parroquia;
  final String barrioSector;
  final String? direccionReferencia;
  final double? lat;
  final double? lon;
  final int numeroIntegrantes;
  final int ninosMenores5;
  final int adultosMayores;
  final int personasDiscapacidad;
  final String danosVivienda;
  final bool requiereEvacuacionInmediata;
  final String? fechaCenso;
  final bool isSynced;

  CensoFamiliaModel({
    String? id,
    String? codigoCenso,
    required this.jefeFamiliaNombre,
    required this.jefeFamiliaCedula,
    this.telefonoContacto,
    this.canton = 'Esmeraldas',
    this.parroquia = 'Esmeraldas',
    required this.barrioSector,
    this.direccionReferencia,
    this.lat,
    this.lon,
    this.numeroIntegrantes = 1,
    this.ninosMenores5 = 0,
    this.adultosMayores = 0,
    this.personasDiscapacidad = 0,
    this.danosVivienda = 'PARCIAL',
    this.requiereEvacuacionInmediata = false,
    this.fechaCenso,
    this.isSynced = true,
  })  : id = id ?? const Uuid().v4(),
        codigoCenso = codigoCenso ??
            'CENSO-ESM-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';

  factory CensoFamiliaModel.fromJson(Map<String, dynamic> json) {
    // Manejo flexible de formato GeoJSON o JSON plano
    double? parsedLat;
    double? parsedLon;

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

    return CensoFamiliaModel(
      id: props['id']?.toString() ?? '',
      codigoCenso: props['codigo_censo']?.toString() ?? '',
      jefeFamiliaNombre: props['jefe_familia_nombre']?.toString() ?? '',
      jefeFamiliaCedula: props['jefe_familia_cedula']?.toString() ?? '',
      telefonoContacto: props['telefono_contacto']?.toString(),
      canton: props['canton']?.toString() ?? 'Esmeraldas',
      parroquia: props['parroquia']?.toString() ?? 'Esmeraldas',
      barrioSector: props['barrio_sector']?.toString() ?? '',
      direccionReferencia: props['direccion_referencia']?.toString(),
      lat: parsedLat,
      lon: parsedLon,
      numeroIntegrantes: (props['numero_integrantes'] as num?)?.toInt() ?? 1,
      ninosMenores5: (props['ninos_menores_5'] as num?)?.toInt() ?? 0,
      adultosMayores: (props['adultos_mayores'] as num?)?.toInt() ?? 0,
      personasDiscapacidad: (props['personas_discapacidad'] as num?)?.toInt() ?? 0,
      danosVivienda: props['danos_vivienda']?.toString() ?? 'PARCIAL',
      requiereEvacuacionInmediata: props['requiere_evacuacion_inmediata'] == true,
      fechaCenso: props['fecha_censo']?.toString(),
      isSynced: true,
    );
  }

  /// Para envío a la API REST de Django
  Map<String, dynamic> toApiJson() {
    return {
      'id': id,
      'codigo_censo': codigoCenso,
      'jefe_familia_nombre': jefeFamiliaNombre,
      'jefe_familia_cedula': jefeFamiliaCedula,
      'telefono_contacto': telefonoContacto,
      'canton': canton,
      'parroquia': parroquia,
      'barrio_sector': barrioSector,
      'direccion_referencia': direccionReferencia,
      'lat': lat,
      'lon': lon,
      'numero_integrantes': numeroIntegrantes,
      'ninos_menores_5': ninosMenores5,
      'adultos_mayores': adultosMayores,
      'personas_discapacidad': personasDiscapacidad,
      'danos_vivienda': danosVivienda,
      'requiere_evacuacion_inmediata': requiereEvacuacionInmediata,
    };
  }

  /// Para almacenamiento offline local en SQLite (sqflite)
  Map<String, dynamic> toSqliteMap() {
    return {
      'id': id,
      'codigo_censo': codigoCenso,
      'jefe_familia_nombre': jefeFamiliaNombre,
      'jefe_familia_cedula': jefeFamiliaCedula,
      'telefono_contacto': telefonoContacto,
      'canton': canton,
      'parroquia': parroquia,
      'barrio_sector': barrioSector,
      'direccion_referencia': direccionReferencia,
      'lat': lat,
      'lon': lon,
      'numero_integrantes': numeroIntegrantes,
      'ninos_menores_5': ninosMenores5,
      'adultos_mayores': adultosMayores,
      'personas_discapacidad': personasDiscapacidad,
      'danos_vivienda': danosVivienda,
      'requiere_evacuacion_inmediata': requiereEvacuacionInmediata ? 1 : 0,
      'fecha_censo': fechaCenso ?? DateTime.now().toIso8601String(),
      'is_synced': isSynced ? 1 : 0,
    };
  }

  factory CensoFamiliaModel.fromSqliteMap(Map<String, dynamic> map) {
    return CensoFamiliaModel(
      id: map['id']?.toString() ?? '',
      codigoCenso: map['codigo_censo']?.toString() ?? '',
      jefeFamiliaNombre: map['jefe_familia_nombre']?.toString() ?? '',
      jefeFamiliaCedula: map['jefe_familia_cedula']?.toString() ?? '',
      telefonoContacto: map['telefono_contacto']?.toString(),
      canton: map['canton']?.toString() ?? 'Esmeraldas',
      parroquia: map['parroquia']?.toString() ?? 'Esmeraldas',
      barrioSector: map['barrio_sector']?.toString() ?? '',
      direccionReferencia: map['direccion_referencia']?.toString(),
      lat: (map['lat'] as num?)?.toDouble(),
      lon: (map['lon'] as num?)?.toDouble(),
      numeroIntegrantes: (map['numero_integrantes'] as num?)?.toInt() ?? 1,
      ninosMenores5: (map['ninos_menores_5'] as num?)?.toInt() ?? 0,
      adultosMayores: (map['adultos_mayores'] as num?)?.toInt() ?? 0,
      personasDiscapacidad: (map['personas_discapacidad'] as num?)?.toInt() ?? 0,
      danosVivienda: map['danos_vivienda']?.toString() ?? 'PARCIAL',
      requiereEvacuacionInmediata: map['requiere_evacuacion_inmediata'] == 1,
      fechaCenso: map['fecha_censo']?.toString(),
      isSynced: map['is_synced'] == 1,
    );
  }
}
