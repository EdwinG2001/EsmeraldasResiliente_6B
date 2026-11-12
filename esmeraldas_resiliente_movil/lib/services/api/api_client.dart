import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants/api_constants.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late Dio dio;

  ApiClient._internal() {
    dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.activeBaseUrl,
        connectTimeout: const Duration(seconds: 45),
        receiveTimeout: const Duration(seconds: 45),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _setupInterceptors();
    loadSavedBaseUrl();
  }

  /// Carga la URL base guardada previamente en SharedPreferences
  Future<void> loadSavedBaseUrl() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedUrl = prefs.getString('custom_base_url');
      if (savedUrl != null && savedUrl.isNotEmpty) {
        if (savedUrl.contains('192.168.') || savedUrl.contains('localhost') || savedUrl.contains('10.0.2.2')) {
          final ping = await testConnection(savedUrl);
          if (ping['success'] != true) {
            updateBaseUrl(ApiConstants.prodBaseUrl);
            return;
          }
        }
        updateBaseUrl(savedUrl);
      } else {
        updateBaseUrl(ApiConstants.prodBaseUrl);
      }
    } catch (_) {
      updateBaseUrl(ApiConstants.prodBaseUrl);
    }
  }

  void updateBaseUrl(String newUrl) {
    var cleaned = newUrl.trim();
    if (cleaned.endsWith('/')) {
      cleaned = cleaned.substring(0, cleaned.length - 1);
    }
    dio.options.baseUrl = cleaned;
    ApiConstants.activeBaseUrl = cleaned;
    SharedPreferences.getInstance().then((prefs) {
      prefs.setString('custom_base_url', cleaned);
    });
  }

  /// Prueba la conectividad con el backend y mide la latencia en milisegundos
  Future<Map<String, dynamic>> testConnection([String? targetUrl]) async {
    final urlToTest = (targetUrl != null && targetUrl.isNotEmpty)
        ? (targetUrl.endsWith('/') ? targetUrl.substring(0, targetUrl.length - 1) : targetUrl)
        : dio.options.baseUrl;

    final stopwatch = Stopwatch()..start();
    try {
      final testDio = Dio(
        BaseOptions(
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 15),
          headers: {'Accept': 'application/json'},
        ),
      );

      final response = await testDio.get('$urlToTest/gis/zonas-riesgo/');
      stopwatch.stop();

      if (response.statusCode == 200) {
        return {
          'success': true,
          'latencyMs': stopwatch.elapsedMilliseconds,
          'message': 'Conexión exitosa (${stopwatch.elapsedMilliseconds}ms) • PostGIS en línea',
        };
      } else {
        return {
          'success': false,
          'latencyMs': stopwatch.elapsedMilliseconds,
          'message': 'Respuesta HTTP ${response.statusCode}',
        };
      }
    } catch (e) {
      stopwatch.stop();
      return {
        'success': false,
        'latencyMs': stopwatch.elapsedMilliseconds,
        'message': 'No se pudo conectar: ${e.toString().split('\n').first}',
      };
    }
  }

  void _setupInterceptors() {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString('access_token');
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          // Si expira o es inválido el token JWT (HTTP 401 o 403 con error de token)
          final isAuthError = error.response?.statusCode == 401 ||
              (error.response?.statusCode == 403 &&
                  error.response?.data?.toString().contains('token') == true);

          if (isAuthError &&
              !error.requestOptions.path.contains(ApiConstants.login) &&
              !error.requestOptions.path.contains(ApiConstants.tokenRefresh)) {
            final refreshed = await _refreshToken();
            if (refreshed) {
              final prefs = await SharedPreferences.getInstance();
              final newToken = prefs.getString('access_token');
              final options = error.requestOptions;
              options.headers['Authorization'] = 'Bearer $newToken';
              try {
                final response = await dio.fetch(options);
                return handler.resolve(response);
              } catch (e) {
                return handler.next(error);
              }
            } else {
              // Si no se pudo refrescar el token y la ruta es de reporte de emergencia, reintentar sin token
              if (error.requestOptions.path.contains(ApiConstants.crearReporte)) {
                final options = error.requestOptions;
                options.headers.remove('Authorization');
                try {
                  final response = await dio.fetch(options);
                  return handler.resolve(response);
                } catch (_) {}
              }
            }
          }
          return handler.next(error);
        },
      ),
    );
  }

  Future<bool> _refreshToken() async {
    final prefs = await SharedPreferences.getInstance();
    final refreshToken = prefs.getString('refresh_token');
    if (refreshToken == null) return false;

    try {
      final response = await Dio().post(
        '${dio.options.baseUrl}${ApiConstants.tokenRefresh}',
        data: {'refresh': refreshToken},
      );
      if (response.statusCode == 200) {
        final newAccess = response.data['access'];
        await prefs.setString('access_token', newAccess);
        return true;
      }
    } catch (_) {
      // Si falla la renovación, limpiar tokens
      await prefs.remove('access_token');
      await prefs.remove('refresh_token');
      await prefs.remove('user_data');
    }
    return false;
  }
}
