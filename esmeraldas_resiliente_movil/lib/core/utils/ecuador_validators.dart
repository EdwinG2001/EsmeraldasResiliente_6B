class EcuadorValidators {
  /// Valida rigurosamente la cédula de identidad ecuatoriana mediante el algoritmo de Módulo 10.
  static String? validarCedula(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'La cédula de identidad es obligatoria.';
    }

    final cedula = value.trim();

    // Debe tener exactamente 10 dígitos numéricos
    if (!RegExp(r'^[0-9]{10}$').hasMatch(cedula)) {
      return 'La cédula debe contener exactamente 10 dígitos numéricos.';
    }

    // Los dos primeros dígitos corresponden al código de provincia (01 a 24 o 30)
    final provincia = int.parse(cedula.substring(0, 2));
    if ((provincia < 1 || provincia > 24) && provincia != 30) {
      return 'Código provincial no válido (primeros 2 dígitos).';
    }

    // El tercer dígito para personas naturales debe ser menor a 6
    final tercerDigito = int.parse(cedula.substring(2, 3));
    if (tercerDigito >= 6) {
      return 'Tercer dígito no corresponde a persona natural ecuatoriana.';
    }

    // Algoritmo de Módulo 10
    final coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    int suma = 0;

    for (int i = 0; i < 9; i++) {
      int valor = int.parse(cedula[i]) * coeficientes[i];
      if (valor >= 10) {
        valor -= 9;
      }
      suma += valor;
    }

    final digitoVerificadorCalculado = (10 - (suma % 10)) % 10;
    final digitoVerificadorReal = int.parse(cedula[9]);

    if (digitoVerificadorCalculado != digitoVerificadorReal) {
      return 'Cédula no válida (dígito verificador incorrecto).';
    }

    return null; // Cédula válida
  }

  /// Valida número celular ecuatoriano (ej. 0991234567 o +593991234567)
  static String? validarTelefonoCelular(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'El teléfono de contacto es obligatorio.';
    }

    final tel = value.trim();
    final regex = RegExp(r'^(\+593|0)9[0-9]{8}$');

    if (!regex.hasMatch(tel)) {
      return 'Ingrese un celular válido (ej. 0991234567 o +593991234567).';
    }

    return null;
  }

  /// Validador de correo electrónico
  static String? validarEmail(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'El correo electrónico es obligatorio.';
    }

    final email = value.trim();
    final regex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');

    if (!regex.hasMatch(email)) {
      return 'Ingrese un formato de correo electrónico válido.';
    }

    return null;
  }

  /// Validador genérico de campo requerido
  static String? validarRequerido(String? value, String nombreCampo) {
    if (value == null || value.trim().isEmpty) {
      return '$nombreCampo es obligatorio.';
    }
    return null;
  }
}
