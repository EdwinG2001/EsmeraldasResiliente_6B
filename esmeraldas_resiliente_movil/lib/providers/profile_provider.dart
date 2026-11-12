import 'package:flutter/foundation.dart';
import '../../services/api/perfil_service.dart';
import 'auth_provider.dart';

class ProfileProvider extends ChangeNotifier {
  final PerfilService _perfilService = PerfilService();

  bool _isUpdating = false;
  String? _statusMessage;
  bool _isSuccess = false;

  bool get isUpdating => _isUpdating;
  String? get statusMessage => _statusMessage;
  bool get isSuccess => _isSuccess;

  /// Actualiza datos personales del ciudadano
  Future<bool> actualizarDatosPersonales({
    required AuthProvider authProvider,
    String? email,
    String? username,
    String? password,
    String? telefono,
    String? telefonoEmergencia,
    String? firstName,
    String? lastName,
  }) async {
    _isUpdating = true;
    _statusMessage = null;
    _isSuccess = false;
    notifyListeners();

    try {
      final updatedUser = await _perfilService.actualizarPerfil(
        email: email,
        username: username,
        password: password,
        telefono: telefono,
        telefonoEmergencia: telefonoEmergencia,
        firstName: firstName,
        lastName: lastName,
      );

      authProvider.updateCurrentUser(updatedUser);
      _statusMessage = 'Datos personales actualizados exitosamente en el sistema.';
      _isSuccess = true;
      _isUpdating = false;
      notifyListeners();
      return true;
    } catch (e) {
      _statusMessage = e.toString().replaceFirst('Exception: ', '');
      _isSuccess = false;
      _isUpdating = false;
      notifyListeners();
      return false;
    }
  }

  void clearMessage() {
    _statusMessage = null;
    _isSuccess = false;
    notifyListeners();
  }
}
