import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants/api_constants.dart';
import '../../models/user_model.dart';
import 'api_client.dart';

class PerfilService {
  final ApiClient _client = ApiClient();

  /// Actualiza los datos personales del ciudadano en la base de datos de Django
  Future<UserModel> actualizarPerfil({
    String? email,
    String? username,
    String? password,
    String? telefono,
    String? telefonoEmergencia,
    String? firstName,
    String? lastName,
  }) async {
    try {
      final data = <String, dynamic>{};

      if (email != null && email.trim().isNotEmpty) data['email'] = email.trim();
      if (username != null && username.trim().isNotEmpty) data['username'] = username.trim();
      if (password != null && password.trim().isNotEmpty) data['password'] = password.trim();
      if (telefono != null && telefono.trim().isNotEmpty) data['telefono'] = telefono.trim();
      if (telefonoEmergencia != null && telefonoEmergencia.trim().isNotEmpty) {
        data['telefono_emergencia'] = telefonoEmergencia.trim();
      }
      if (firstName != null) data['first_name'] = firstName.trim();
      if (lastName != null) data['last_name'] = lastName.trim();

      final response = await _client.dio.patch(
        ApiConstants.perfil,
        data: data,
      );

      final props = response.data['properties'] ?? response.data;
      final updatedUser = UserModel.fromJson(props);

      // Actualizar caché local
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user_data', jsonEncode(updatedUser.toJson()));

      return updatedUser;
    } on DioException catch (e) {
      final msg = e.response?.data?['detail'] ??
          e.response?.data?.toString() ??
          'Error al actualizar los datos personales.';
      throw Exception(msg);
    }
  }
}
