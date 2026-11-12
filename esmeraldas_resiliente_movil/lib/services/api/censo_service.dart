import 'package:dio/dio.dart';
import '../../core/constants/api_constants.dart';
import '../../models/censo_familia_model.dart';
import '../../models/solicitud_censo_model.dart';
import 'api_client.dart';

class CensoVerificationResult {
  final bool censado;
  final String mensaje;
  final CensoFamiliaModel? familia;

  CensoVerificationResult({
    required this.censado,
    required this.mensaje,
    this.familia,
  });
}

class CensoService {
  final ApiClient _client = ApiClient();

  /// Verifica si una cédula consta en la tabla 'familias_censo' (Caso A vs Caso B)
  Future<CensoVerificationResult> verificarCensoCiudadano(String cedula) async {
    try {
      final cleanCedula = cedula.trim();
      final response = await _client.dio.get(
        '${ApiConstants.verificarCenso}$cleanCedula/',
      );

      final data = response.data;
      final bool esCensado = data['censado'] == true;
      final String mensaje = data['mensaje']?.toString() ??
          (esCensado
              ? 'Ciudadano censado en el sistema.'
              : 'Aún usted no ha sido censado en el sistema de gestión de riesgos');

      CensoFamiliaModel? fam;
      if (esCensado && data['familia'] != null) {
        fam = CensoFamiliaModel.fromJson(data['familia']);
      }

      return CensoVerificationResult(
        censado: esCensado,
        mensaje: mensaje,
        familia: fam,
      );
    } on DioException catch (_) {
      // Fallback a query param si la ruta directa con path param tuviera alguna variación
      try {
        final fallbackRes = await _client.dio.get(
          ApiConstants.censoFamilias,
          queryParameters: {'cedula': cedula.trim()},
        );
        final results = fallbackRes.data['features'] ?? fallbackRes.data['results'] ?? fallbackRes.data;
        if (results is List && results.isNotEmpty) {
          final first = results[0];
          return CensoVerificationResult(
            censado: true,
            mensaje: 'Ciudadano verificado en el censo.',
            familia: CensoFamiliaModel.fromJson(first),
          );
        }
      } catch (_) {}

      return CensoVerificationResult(
        censado: false,
        mensaje: 'Aún usted no ha sido censado en el sistema de gestión de riesgos',
      );
    }
  }

  /// Envía una nueva ficha censal a la base de datos PostgreSQL/PostGIS
  Future<CensoFamiliaModel> enviarCenso(CensoFamiliaModel familia) async {
    try {
      final payload = familia.toApiJson();
      final response = await _client.dio.post(
        ApiConstants.censoFamilias,
        data: payload,
      );

      return CensoFamiliaModel.fromJson(response.data);
    } on DioException catch (e) {
      final msg = e.response?.data?['detail'] ??
          e.response?.data?.toString() ??
          'Error al registrar la ficha censal.';
      throw Exception(msg);
    }
  }

  /// Lista las familias censadas
  Future<List<CensoFamiliaModel>> getFamiliasCenso() async {
    try {
      final response = await _client.dio.get(ApiConstants.censoFamilias);
      final rawList = response.data['features'] ?? response.data['results'] ?? response.data;

      if (rawList is List) {
        return rawList.map((item) => CensoFamiliaModel.fromJson(item)).toList();
      }
      return [];
    } on DioException catch (e) {
      throw Exception('Error cargando familias censadas: ${e.message}');
    }
  }

  /// Envía una solicitud de visita de censador a la vivienda (Ventana de 48h)
  Future<SolicitudCensoModel> crearSolicitudCenso(SolicitudCensoModel solicitud) async {
    try {
      final response = await _client.dio.post(
        ApiConstants.solicitudesCenso,
        data: solicitud.toJson(),
      );
      final data = response.data is Map<String, dynamic>
          ? response.data as Map<String, dynamic>
          : Map<String, dynamic>.from(response.data);
      return SolicitudCensoModel.fromJson(data);
    } on DioException catch (e) {
      final msg = e.response?.data?['detail'] ??
          e.response?.data?.toString() ??
          'Error al enviar solicitud de censo.';
      throw Exception(msg);
    }
  }

  /// Consulta solicitudes de censo pendientes (para rol Digitalizador / Censador)
  Future<List<SolicitudCensoModel>> getSolicitudesCenso({String? estado}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (estado != null && estado.isNotEmpty) queryParams['estado'] = estado;

      final response = await _client.dio.get(
        ApiConstants.solicitudesCenso,
        queryParameters: queryParams,
      );
      final data = response.data;
      final rawList = data is Map && data['results'] != null
          ? data['results']
          : (data is List ? data : []);

      if (rawList is List) {
        return rawList
            .map((item) => SolicitudCensoModel.fromJson(Map<String, dynamic>.from(item)))
            .toList();
      }
      return [];
    } on DioException catch (e) {
      throw Exception('Error cargando solicitudes de censo: ${e.message}');
    }
  }

  /// Actualiza estado de solicitud (EN_CAMINO, ATENDIDO)
  Future<void> actualizarEstadoSolicitud(String id, String nuevoEstado) async {
    try {
      await _client.dio.patch(
        '${ApiConstants.solicitudesCenso}$id/',
        data: {'estado': nuevoEstado},
      );
    } on DioException catch (e) {
      throw Exception('Error actualizando estado de solicitud: ${e.message}');
    }
  }
}
