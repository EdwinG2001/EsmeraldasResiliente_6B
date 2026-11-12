class SolicitudCensoModel {
  final String? id;
  final String jefeFamiliaNombre;
  final String jefeFamiliaCedula;
  final String? telefonoContacto;
  final String barrioSector;
  final String? direccionReferencia;
  final double? latitud;
  final double? longitud;
  final String estado; // 'PENDIENTE', 'EN_CAMINO', 'ATENDIDO', 'DESCARTADO'
  final String? fechaSolicitud;
  double? distanciaMetros;

  SolicitudCensoModel({
    this.id,
    required this.jefeFamiliaNombre,
    required this.jefeFamiliaCedula,
    this.telefonoContacto,
    required this.barrioSector,
    this.direccionReferencia,
    this.latitud,
    this.longitud,
    this.estado = 'PENDIENTE',
    this.fechaSolicitud,
    this.distanciaMetros,
  });

  factory SolicitudCensoModel.fromJson(Map<String, dynamic> json) {
    double? parseDouble(dynamic v) {
      if (v == null) return null;
      if (v is num) return v.toDouble();
      return double.tryParse(v.toString());
    }

    return SolicitudCensoModel(
      id: json['id']?.toString(),
      jefeFamiliaNombre: json['jefe_familia_nombre'] ?? '',
      jefeFamiliaCedula: json['jefe_familia_cedula'] ?? '',
      telefonoContacto: json['telefono_contacto']?.toString(),
      barrioSector: json['barrio_sector'] ?? '',
      direccionReferencia: json['direccion_referencia']?.toString(),
      latitud: parseDouble(json['latitud'] ?? json['lat']),
      longitud: parseDouble(json['longitud'] ?? json['lon']),
      estado: json['estado'] ?? 'PENDIENTE',
      fechaSolicitud: json['fecha_solicitud']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'jefe_familia_nombre': jefeFamiliaNombre,
      'jefe_familia_cedula': jefeFamiliaCedula,
      if (telefonoContacto != null) 'telefono_contacto': telefonoContacto,
      'barrio_sector': barrioSector,
      if (direccionReferencia != null) 'direccion_referencia': direccionReferencia,
      if (latitud != null) 'lat': latitud,
      if (longitud != null) 'lon': longitud,
      'estado': estado,
    };
  }
}

