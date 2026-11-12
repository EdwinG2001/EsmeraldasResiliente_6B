class UserModel {
  final String id;
  final String? username;
  final String? firstName;
  final String? lastName;
  final String nombreCompleto;
  final String telefono;
  final String? telefonoEmergencia;
  final String? email;
  final String? cedula;
  final String rol;
  final bool estaVerificado;
  final String? canton;
  final String? parroquia;
  final String? barrioSector;

  UserModel({
    required this.id,
    this.username,
    this.firstName,
    this.lastName,
    required this.nombreCompleto,
    required this.telefono,
    this.telefonoEmergencia,
    this.email,
    this.cedula,
    required this.rol,
    this.estaVerificado = false,
    this.canton,
    this.parroquia,
    this.barrioSector,
  });

  bool get isCensador {
    final r = rol.toUpperCase();
    return r == 'DIGITALIZADOR' ||
        r == 'ANALISTA' ||
        r == 'ASISTENCIA' ||
        r == 'OPERADOR_COE' ||
        r == 'OPERADOR' ||
        r == 'GESTOR' ||
        r == 'ADMINISTRADOR' ||
        r == 'CENSADOR' ||
        r == 'TRABAJADOR' ||
        r.contains('CENSO') ||
        r.contains('DIGITAL') ||
        r.contains('TRABAJ');
  }

  bool get isCiudadano => !isCensador;

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      username: json['username']?.toString(),
      firstName: json['first_name']?.toString(),
      lastName: json['last_name']?.toString(),
      nombreCompleto: json['nombre_completo']?.toString() ??
          '${json['first_name'] ?? ''} ${json['last_name'] ?? ''}'.trim(),
      telefono: json['telefono']?.toString() ?? '',
      telefonoEmergencia: json['telefono_emergencia']?.toString(),
      email: json['email']?.toString(),
      cedula: json['cedula']?.toString(),
      rol: (json['rol']?.toString() ?? 'CIUDADANO').toUpperCase(),
      estaVerificado: json['esta_verificado'] == true,
      canton: json['canton']?.toString(),
      parroquia: json['parroquia']?.toString(),
      barrioSector: json['barrio_sector']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'first_name': firstName,
      'last_name': lastName,
      'nombre_completo': nombreCompleto,
      'telefono': telefono,
      'telefono_emergencia': telefonoEmergencia,
      'email': email,
      'cedula': cedula,
      'rol': rol,
      'esta_verificado': estaVerificado,
      'canton': canton,
      'parroquia': parroquia,
      'barrio_sector': barrioSector,
    };
  }
}
