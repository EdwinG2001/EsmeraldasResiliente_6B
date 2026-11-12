import 'package:flutter/foundation.dart';
import '../../models/user_model.dart';
import '../../models/censo_familia_model.dart';
import '../../services/api/auth_service.dart';
import '../../services/api/censo_service.dart';

enum AuthStatus {
  initial,
  authenticated,
  unauthenticated,
  censadoVerified,
  notCensado,
}

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  final CensoService _censoService = CensoService();

  UserModel? _user;
  bool _isLoading = false;
  String? _errorMessage;
  AuthStatus _status = AuthStatus.initial;

  // Estado del flujo condicional del ciudadano
  bool _esCensado = false;
  CensoFamiliaModel? _familiaCensada;
  String _mensajeCenso = '';

  // Getters
  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  AuthStatus get status => _status;
  bool get esCensado => _esCensado;
  CensoFamiliaModel? get familiaCensada => _familiaCensada;
  String get mensajeCenso => _mensajeCenso;

  /// Verifica si hay una sesión guardada previamente al abrir la app
  Future<void> checkSession() async {
    _isLoading = true;
    notifyListeners();

    try {
      _user = await _authService.getUsuarioActual();
      if (_user != null) {
        _status = AuthStatus.authenticated;
        if (_user!.isCiudadano) {
          final cedulaAConsultar = _user!.cedula ?? _user!.telefono;
          await verificarEstadoCenso(cedulaAConsultar);
        }
      } else {
        _status = AuthStatus.unauthenticated;
      }
    } catch (_) {
      _status = AuthStatus.unauthenticated;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Inicia sesión validando credenciales y rol correspondiente
  Future<bool> login({
    required String identifier,
    required String password,
    required String targetRole, // 'CIUDADANO' o 'ANALISTA/CENSADOR'
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final user = await _authService.login(
        identifier: identifier,
        password: password,
      );

      // Asignación de rol según el flujo seleccionado en la app
      if (targetRole == 'ANALISTA/CENSADOR') {
        _user = UserModel(
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          nombreCompleto: user.nombreCompleto,
          telefono: user.telefono,
          telefonoEmergencia: user.telefonoEmergencia,
          email: user.email,
          cedula: user.cedula,
          rol: user.isCensador ? user.rol : 'CENSADOR',
          estaVerificado: true,
          canton: user.canton,
          parroquia: user.parroquia,
          barrioSector: user.barrioSector,
        );
      } else {
        _user = user;
      }

      _status = AuthStatus.authenticated;

      // Si es ciudadano, verificar inmediatamente si ya consta en 'familias_censo'
      if (_user!.isCiudadano) {
        final cedulaParaVerificar = _user!.cedula ?? identifier;
        await verificarEstadoCenso(cedulaParaVerificar);
      }

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Inicia sesión exclusivamente con Keycloak IAM para Trabajadores de Censo (Digitalizador)
  Future<bool> loginKeycloak({
    required String username,
    required String password,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final user = await _authService.loginKeycloak(
        username: username,
        password: password,
      );

      _user = user;
      _status = AuthStatus.authenticated;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Registro de nuevo ciudadano y verificación automática
  Future<bool> register({
    required String telefono,
    required String password,
    String? firstName,
    String? lastName,
    String? email,
    String? cedula,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final user = await _authService.registro(
        telefono: telefono,
        password: password,
        firstName: firstName,
        lastName: lastName,
        email: email,
      );

      _user = user;
      _status = AuthStatus.authenticated;

      // Verificar en base de datos si su cédula ya forma parte del censo
      if (cedula != null && cedula.isNotEmpty) {
        await verificarEstadoCenso(cedula);
      } else {
        _esCensado = false;
        _mensajeCenso =
            'Aún usted no ha sido censado en el sistema de gestión de riesgos';
        _status = AuthStatus.notCensado;
      }

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Verifica si la cédula está en 'familias_censo' (Caso A: No censado / Caso B: Sí censado)
  Future<void> verificarEstadoCenso(String cedula) async {
    try {
      final result = await _censoService.verificarCensoCiudadano(cedula);
      _esCensado = result.censado;
      _mensajeCenso = result.mensaje;
      _familiaCensada = result.familia;

      if (_esCensado) {
        _status = AuthStatus.censadoVerified;
      } else {
        _status = AuthStatus.notCensado;
      }
    } catch (_) {
      _esCensado = false;
      _mensajeCenso =
          'Aún usted no ha sido censado en el sistema de gestión de riesgos';
      _status = AuthStatus.notCensado;
    }
    notifyListeners();
  }

  /// Actualiza la información del usuario en memoria
  void updateCurrentUser(UserModel updated) {
    _user = updated;
    notifyListeners();
  }

  /// Cerrar Sesión
  Future<void> logout() async {
    await _authService.logout();
    _user = null;
    _esCensado = false;
    _familiaCensada = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }
}
