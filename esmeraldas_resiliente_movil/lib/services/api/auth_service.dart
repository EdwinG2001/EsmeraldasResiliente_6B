import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants/api_constants.dart';
import '../../models/user_model.dart';
import 'api_client.dart';

class AuthService {
  final ApiClient _client = ApiClient();

  /// Inicia sesión con cédula, correo o celular y contraseña.
  Future<UserModel> login({
    required String identifier,
    required String password,
  }) async {
    try {
      final response = await _client.dio.post(
        ApiConstants.login,
        data: {
          'username': identifier.trim(),
          'password': password,
        },
      );

      final data = response.data;
      final prefs = await SharedPreferences.getInstance();

      // Guardar tokens JWT en persistencia local
      if (data['access'] != null) {
        await prefs.setString('access_token', data['access'].toString());
      }
      if (data['refresh'] != null) {
        await prefs.setString('refresh_token', data['refresh'].toString());
      }

      final userData = data['usuario'] ?? {};
      await prefs.setString('user_data', jsonEncode(userData));

      return UserModel.fromJson(userData);
    } on DioException catch (e) {
      final errorMsg = e.response?.data?['detail'] ??
          e.response?.data?['error'] ??
          'Error al conectar con el servidor de autenticación.';
      throw Exception(errorMsg);
    }
  }

  /// Autenticación institucional con Keycloak IAM (Single Sign-On para Censadores / Digitalizadores)
  Future<UserModel> loginKeycloak({
    required String username,
    required String password,
  }) async {
    final dio = Dio(BaseOptions(
      connectTimeout: const Duration(seconds: 8),
      receiveTimeout: const Duration(seconds: 8),
    ));

    try {
      // 1. Intentar autenticación directa vía OpenID Connect (OIDC) en Keycloak
      final response = await dio.post(
        ApiConstants.keycloakTokenUrl,
        data: {
          'client_id': ApiConstants.keycloakClientId,
          'grant_type': 'password',
          'username': username.trim(),
          'password': password,
          'scope': 'openid profile email',
        },
        options: Options(
          contentType: Headers.formUrlEncodedContentType,
        ),
      );

      final data = response.data;
      final accessToken = data['access_token']?.toString() ?? '';

      if (accessToken.isEmpty) {
        throw Exception('Respuesta inválida de Keycloak IAM (sin token).');
      }

      // Decodificar claims y roles del JWT RS256 de Keycloak
      final payload = _decodeJwtPayload(accessToken);
      final roles = _extractKeycloakRoles(payload);

      final isAuthorized = roles.any((r) =>
          r == 'DIGITALIZADOR' ||
          r == 'CENSADOR' ||
          r == 'CENSO' ||
          r.contains('DIGITALIZADOR') ||
          r.contains('CENSADOR') ||
          r == 'ADMIN' ||
          r == 'ADMINISTRADOR');

      if (!isAuthorized) {
        throw Exception(
          'Acceso Restringido: El usuario autenticado en Keycloak no tiene asignado el rol oficial DIGITALIZADOR.',
        );
      }

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('access_token', accessToken);
      if (data['refresh_token'] != null) {
        await prefs.setString('refresh_token', data['refresh_token'].toString());
      }

      final preferredUsername = payload['preferred_username']?.toString() ?? username.trim();
      final givenName = payload['given_name']?.toString() ?? '';
      final familyName = payload['family_name']?.toString() ?? '';
      final fullName = (givenName.isNotEmpty || familyName.isNotEmpty)
          ? '$givenName $familyName'.trim()
          : (payload['name']?.toString() ?? preferredUsername);

      final user = UserModel(
        id: payload['sub']?.toString() ?? 'kc-$preferredUsername',
        username: preferredUsername,
        firstName: givenName.isNotEmpty ? givenName : preferredUsername,
        lastName: familyName,
        nombreCompleto: fullName,
        email: payload['email']?.toString(),
        telefono: '0979876541',
        cedula: payload['cedula']?.toString() ?? '0850234190',
        rol: 'DIGITALIZADOR',
        estaVerificado: true,
        canton: 'Esmeraldas',
        parroquia: 'Luis Tello',
        barrioSector: 'Isla Piedad',
      );

      await prefs.setString('user_data', jsonEncode(user.toJson()));
      return user;
    } on DioException catch (dioErr) {
      // 2. Si el túnel de Keycloak está inalcanzable, validar contra la Base de Datos oficial en Render
      try {
        final dbUser = await login(identifier: username, password: password);
        if (dbUser.rol.toUpperCase() != 'DIGITALIZADOR' &&
            dbUser.rol.toUpperCase() != 'CENSADOR' &&
            !dbUser.isCensador) {
          await logout();
          throw Exception(
            'Acceso Restringido: Este formulario solo está disponible para usuarios con rol DIGITALIZADOR.',
          );
        }
        return dbUser;
      } on Exception catch (e) {
        if (e.toString().contains('Acceso Restringido')) rethrow;
        final detail = dioErr.response?.data?['error_description'] ??
            dioErr.response?.data?['error'] ??
            'Credenciales de Keycloak incorrectas o usuario no registrado en el sistema.';
        throw Exception(detail);
      }
    }
  }

  /// Decodifica el payload de un JWT sin requerir librerías externas
  Map<String, dynamic> _decodeJwtPayload(String token) {
    try {
      final parts = token.split('.');
      if (parts.length < 2) return {};
      final normalized = base64Url.normalize(parts[1]);
      final payloadString = utf8.decode(base64Url.decode(normalized));
      return jsonDecode(payloadString) as Map<String, dynamic>;
    } catch (_) {
      return {};
    }
  }

  /// Extrae la lista de roles del Realm y de los Clientes en el token de Keycloak
  List<String> _extractKeycloakRoles(Map<String, dynamic> payload) {
    final List<String> roles = [];

    // Roles del Realm
    final realmAccess = payload['realm_access'];
    if (realmAccess is Map && realmAccess['roles'] is List) {
      for (final r in realmAccess['roles']) {
        roles.add(r.toString().toUpperCase());
      }
    }

    // Roles de Resource Access
    final resourceAccess = payload['resource_access'];
    if (resourceAccess is Map) {
      for (final clientData in resourceAccess.values) {
        if (clientData is Map && clientData['roles'] is List) {
          for (final r in clientData['roles']) {
            roles.add(r.toString().toUpperCase());
          }
        }
      }
    }

    if (payload['roles'] is List) {
      for (final r in payload['roles']) {
        roles.add(r.toString().toUpperCase());
      }
    }

    return roles;
  }

  /// Registro rápido de ciudadano
  Future<UserModel> registro({
    required String telefono,
    required String password,
    String? firstName,
    String? lastName,
    String? email,
  }) async {
    try {
      final response = await _client.dio.post(
        ApiConstants.registro,
        data: {
          'telefono': telefono.trim(),
          'password': password,
          'first_name': firstName?.trim() ?? '',
          'last_name': lastName?.trim() ?? '',
          'email': email?.trim(),
          'acepta_terminos_privacidad': true,
        },
      );

      final data = response.data;
      final prefs = await SharedPreferences.getInstance();

      if (data['tokens']?['access'] != null) {
        await prefs.setString('access_token', data['tokens']['access'].toString());
      }
      if (data['tokens']?['refresh'] != null) {
        await prefs.setString('refresh_token', data['tokens']['refresh'].toString());
      }

      final userData = data['usuario'] ?? {};
      await prefs.setString('user_data', jsonEncode(userData));

      return UserModel.fromJson(userData);
    } on DioException catch (e) {
      final errorMsg = e.response?.data?['detail'] ??
          e.response?.data?['telefono']?[0] ??
          'Error en el registro del ciudadano.';
      throw Exception(errorMsg);
    }
  }

  /// Consulta el perfil del usuario autenticado
  Future<UserModel> getPerfil() async {
    try {
      final response = await _client.dio.get(ApiConstants.perfil);
      final props = response.data['properties'] ?? response.data;
      return UserModel.fromJson(props);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['detail'] ?? 'No se pudo cargar el perfil.');
    }
  }

  /// Obtiene el usuario guardado localmente en sesión
  Future<UserModel?> getUsuarioActual() async {
    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString('user_data');
    if (userJson != null) {
      try {
        final decoded = jsonDecode(userJson);
        return UserModel.fromJson(decoded);
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  /// Cierra la sesión y destruye credenciales
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    await prefs.remove('refresh_token');
    await prefs.remove('user_data');
  }
}
