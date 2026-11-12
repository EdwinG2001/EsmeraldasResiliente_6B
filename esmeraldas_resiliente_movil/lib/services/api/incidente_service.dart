import 'dart:io';
import 'package:dio/dio.dart';
import '../../core/constants/api_constants.dart';
import '../../models/incidente_model.dart';
import '../../models/zona_riesgo_model.dart';
import 'api_client.dart';

class IncidenteService {
  final ApiClient _client = ApiClient();

  /// Obtiene los incidentes activos desde la API GeoJSON de Django
  Future<List<IncidenteModel>> getIncidentes({
    String? gravedad,
    String? estado,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (gravedad != null && gravedad.isNotEmpty) queryParams['gravedad'] = gravedad;
      if (estado != null && estado.isNotEmpty) queryParams['estado'] = estado;

      final response = await _client.dio.get(
        ApiConstants.reportesList,
        queryParameters: queryParams,
      );

      final data = response.data;
      List? raw;
      if (data is Map) {
        if (data['results'] is Map && data['results']['features'] is List) {
          raw = data['results']['features'];
        } else if (data['features'] is List) {
          raw = data['features'];
        } else if (data['results'] is List) {
          raw = data['results'];
        }
      } else if (data is List) {
        raw = data;
      }

      if (raw != null) {
        return raw.map((json) => IncidenteModel.fromJson(json)).toList();
      }
      return [];
    } on DioException catch (_) {
      // En caso de error de red o timeout, retornar lista vacía sin inventar datos quemados
      return [];
    }
  }

  /// Registra una emergencia o evento crítico reportado por el ciudadano
  Future<IncidenteModel> crearIncidente(
    IncidenteModel incidente, {
    String? imagePath,
  }) async {
    try {
      final Map<String, dynamic> data = incidente.toApiJson();

      // Si el usuario adjuntó una fotografía
      if (imagePath != null && imagePath.isNotEmpty) {
        final file = File(imagePath);
        if (await file.exists()) {
          // Enviar como FormData para soportar imagen binaria
          final formData = FormData.fromMap({
            ...data,
            'foto': await MultipartFile.fromFile(
              imagePath,
              filename: 'reporte_${DateTime.now().millisecondsSinceEpoch}.jpg',
            ),
          });
          final response = await _client.dio.post(
            ApiConstants.crearReporte,
            data: formData,
          );
          final resJson = Map<String, dynamic>.from(response.data);
          if (resJson['lat'] == null) resJson['lat'] = incidente.lat;
          if (resJson['lon'] == null) resJson['lon'] = incidente.lon;
          return IncidenteModel.fromJson(resJson);
        }
      }

      final response = await _client.dio.post(
        ApiConstants.crearReporte,
        data: data,
      );
      final resJson = Map<String, dynamic>.from(response.data);
      if (resJson['lat'] == null) resJson['lat'] = incidente.lat;
      if (resJson['lon'] == null) resJson['lon'] = incidente.lon;
      return IncidenteModel.fromJson(resJson);
    } on DioException catch (e) {
      final detail = e.response?.data?['detail'] ??
          e.response?.data?.toString() ??
          'Error al emitir el reporte de emergencia.';
      throw Exception(detail);
    }
  }

  /// Sincronización offline en lote para incidentes acumulados sin conexión
  Future<Map<String, dynamic>> sincronizarOffline(List<IncidenteModel> incidentes) async {
    if (incidentes.isEmpty) return {'creados': 0};

    try {
      final payload = {
        'reportes': incidentes.map((e) => e.toApiJson()).toList(),
      };

      final response = await _client.dio.post(
        ApiConstants.sincronizarOffline,
        data: payload,
      );

      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw Exception('Error sincronizando reportes offline: ${e.message}');
    }
  }

  /// Obtiene las zonas de riesgo (polígonos GeoJSON de inundaciones y deslaves)
  Future<List<ZonaRiesgoModel>> getZonasRiesgo({bool soloAlertadas = false}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (soloAlertadas) queryParams['solo_alertadas'] = 'true';

      final response = await _client.dio.get(
        ApiConstants.zonasRiesgo,
        queryParameters: queryParams,
      );
      final data = response.data;
      List? raw;
      if (data is Map) {
        if (data['results'] is Map && data['results']['features'] is List) {
          raw = data['results']['features'];
        } else if (data['features'] is List) {
          raw = data['features'];
        } else if (data['results'] is List) {
          raw = data['results'];
        }
      } else if (data is List) {
        raw = data;
      }

      if (raw != null && raw.isNotEmpty) {
        return raw.map((json) => ZonaRiesgoModel.fromJson(json)).toList();
      }
      return [];
    } on DioException catch (_) {
      return [];
    }
  }
}
