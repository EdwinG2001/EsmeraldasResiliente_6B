import 'package:dio/dio.dart';
import '../../core/constants/api_constants.dart';
import '../../models/albergue_model.dart';
import 'api_client.dart';

class EvacuationService {
  final ApiClient _client = ApiClient();

  /// Obtiene todos los albergues temporales activos
  Future<List<AlbergueModel>> getAlbergues() async {
    try {
      final response = await _client.dio.get(ApiConstants.albergues);
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
        return raw.map((json) => AlbergueModel.fromJson(json)).toList();
      }
      return _getDefaultAlbergues();
    } on DioException catch (_) {
      return _getDefaultAlbergues();
    }
  }

  List<AlbergueModel> _getDefaultAlbergues() {
    return [
      AlbergueModel(
        id: 1,
        nombre: 'Albergue Seguro 1',
        direccion: 'Unidad Educativa Luis Vargas Torres, Esmeraldas',
        capacidadMaxima: 300,
        ocupacionActual: 65,
        lat: 0.9720,
        lon: -79.6540,
      ),
      AlbergueModel(
        id: 2,
        nombre: 'Coliseo Nubia Villacís',
        direccion: 'Av. Jaime Roldós y Olmedo, Esmeraldas',
        capacidadMaxima: 450,
        ocupacionActual: 120,
        lat: 0.9650,
        lon: -79.6590,
      ),
    ];
  }

  /// Calcula el albergue con cupo libre más cercano utilizando PostGIS ST_Distance
  Future<AlbergueModel> getAlbergueCercano({
    required double lat,
    required double lon,
  }) async {
    try {
      final response = await _client.dio.get(
        ApiConstants.albergueCercano,
        queryParameters: {'lat': lat, 'lon': lon},
      );
      final data = response.data['albergue_mas_cercano'] ?? response.data;
      return AlbergueModel.fromJson(data);
    } on DioException catch (_) {
      // Fallback predeterminado para el render (Albergue Seguro 1)
      return AlbergueModel(
        id: 1,
        nombre: 'Albergue Seguro 1',
        direccion: 'Refugio Seguro Oficial • Cantón Esmeraldas',
        capacidadMaxima: 350,
        ocupacionActual: 80,
        lat: 0.9735,
        lon: -79.6520,
      );
    }
  }
}
