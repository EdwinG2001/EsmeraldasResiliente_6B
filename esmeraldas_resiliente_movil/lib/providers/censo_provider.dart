import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import '../core/constants/api_constants.dart';
import '../../models/censo_familia_model.dart';
import '../../models/solicitud_censo_model.dart';
import '../../services/api/censo_service.dart';
import '../../services/database/local_db_service.dart';
import '../../services/location/location_service.dart';

class CensoProvider extends ChangeNotifier {
  final CensoService _censoService = CensoService();
  final LocalDatabaseService _dbService = LocalDatabaseService();

  // Estado del GPS
  Position? _currentGpsPosition;
  bool _isCapturingGps = false;
  String? _gpsStatusMessage;

  // Estado del Formulario
  int _numeroIntegrantes = 4;
  int _ninosMenores5 = 1;
  int _adultosMayores = 0;
  int _personasDiscapacidad = 0;
  String _danosVivienda = 'PARCIAL';
  bool _requiereEvacuacion = false;

  // Estado de Envío y Offline Sync
  bool _isSubmitting = false;
  bool _isSyncing = false;
  int _pendingOfflineCount = 0;
  List<CensoFamiliaModel> _offlineQueue = [];
  String? _lastSubmissionMessage;

  // Solicitudes de Censo (48h) para Digitalizador
  List<SolicitudCensoModel> _solicitudes = [];
  bool _isLoadingSolicitudes = false;
  String? _solicitudesError;

  // Getters
  Position? get currentGpsPosition => _currentGpsPosition;
  bool get isCapturingGps => _isCapturingGps;
  String? get gpsStatusMessage => _gpsStatusMessage;

  int get numeroIntegrantes => _numeroIntegrantes;
  int get ninosMenores5 => _ninosMenores5;
  int get adultosMayores => _adultosMayores;
  int get personasDiscapacidad => _personasDiscapacidad;
  String get danosVivienda => _danosVivienda;
  bool get requiereEvacuacion => _requiereEvacuacion;

  bool get isSubmitting => _isSubmitting;
  bool get isSyncing => _isSyncing;
  int get pendingOfflineCount => _pendingOfflineCount;
  List<CensoFamiliaModel> get offlineQueue => _offlineQueue;
  String? get lastSubmissionMessage => _lastSubmissionMessage;

  List<SolicitudCensoModel> get solicitudes => _solicitudes;
  bool get isLoadingSolicitudes => _isLoadingSolicitudes;
  String? get solicitudesError => _solicitudesError;

  CensoProvider() {
    refreshOfflineQueue();
  }

  /// Captura las coordenadas GPS actuales del dispositivo utilizando geolocator
  Future<bool> capturarGps() async {
    _isCapturingGps = true;
    _gpsStatusMessage = 'Adquiriendo satélites GPS en Esmeraldas...';
    notifyListeners();

    try {
      final pos = await LocationService.getCurrentPosition();
      if (pos != null) {
        _currentGpsPosition = pos;
        _gpsStatusMessage =
            'Ubicación fijada: Lat ${pos.latitude.toStringAsFixed(5)}, Lon ${pos.longitude.toStringAsFixed(5)} (±${pos.accuracy.toStringAsFixed(1)}m)';
        _isCapturingGps = false;
        notifyListeners();
        return true;
      } else {
        _gpsStatusMessage = 'No se pudo obtener señal GPS. Verifique los permisos.';
        _isCapturingGps = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _gpsStatusMessage = 'Error GPS: $e';
      _isCapturingGps = false;
      notifyListeners();
      return false;
    }
  }

  // Modificadores de Vulnerabilidad en el Hogar
  void setIntegrantes(int val) {
    if (val >= 1) {
      _numeroIntegrantes = val;
      notifyListeners();
    }
  }

  void setNinos(int val) {
    if (val >= 0 && val <= _numeroIntegrantes) {
      _ninosMenores5 = val;
      notifyListeners();
    }
  }

  void setAdultosMayores(int val) {
    if (val >= 0 && val <= _numeroIntegrantes) {
      _adultosMayores = val;
      notifyListeners();
    }
  }

  void setDiscapacidad(int val) {
    if (val >= 0 && val <= _numeroIntegrantes) {
      _personasDiscapacidad = val;
      notifyListeners();
    }
  }

  void setDanosVivienda(String val) {
    _danosVivienda = val;
    notifyListeners();
  }

  void setRequiereEvacuacion(bool val) {
    _requiereEvacuacion = val;
    notifyListeners();
  }

  /// Envío con confirmación de éxito y sincronización offline en SQLite si no hay internet
  Future<Map<String, dynamic>> submitCenso({
    required String nombreJefe,
    required String cedulaJefe,
    required String celular,
    required String barrioSector,
    String? direccionReferencia,
    String parroquia = 'Esmeraldas',
  }) async {
    _isSubmitting = true;
    _lastSubmissionMessage = null;
    notifyListeners();

    final censo = CensoFamiliaModel(
      jefeFamiliaNombre: nombreJefe.trim(),
      jefeFamiliaCedula: cedulaJefe.trim(),
      telefonoContacto: celular.trim(),
      barrioSector: barrioSector.trim(),
      direccionReferencia: direccionReferencia?.trim(),
      parroquia: parroquia.trim(),
      lat: _currentGpsPosition?.latitude ?? ApiConstants.esmeraldasLat,
      lon: _currentGpsPosition?.longitude ?? ApiConstants.esmeraldasLon,
      numeroIntegrantes: _numeroIntegrantes,
      ninosMenores5: _ninosMenores5,
      adultosMayores: _adultosMayores,
      personasDiscapacidad: _personasDiscapacidad,
      danosVivienda: _danosVivienda,
      requiereEvacuacionInmediata: _requiereEvacuacion,
      isSynced: false,
    );

    try {
      // 1. Intento de Envío Online a Django / PostGIS
      final resultadoOnline = await _censoService.enviarCenso(censo);
      _isSubmitting = false;
      _lastSubmissionMessage =
          'Ficha censal #${resultadoOnline.codigoCenso} registrada exitosamente en PostGIS.';
      resetForm();
      notifyListeners();
      return {
        'success': true,
        'online': true,
        'mensaje': _lastSubmissionMessage,
        'codigo': resultadoOnline.codigoCenso,
      };
    } catch (_) {
      // 2. Fallo de Conexión: Almacenar en SQLite Local (Offline-First)
      await _dbService.insertCenso(censo);
      await refreshOfflineQueue();

      _isSubmitting = false;
      _lastSubmissionMessage =
          'Sin conexión a internet. Ficha censal #${censo.codigoCenso} guardada de forma segura en SQLite local para sincronización posterior.';
      resetForm();
      notifyListeners();
      return {
        'success': true,
        'online': false,
        'mensaje': _lastSubmissionMessage,
        'codigo': censo.codigoCenso,
      };
    }
  }

  /// Actualiza la lista y contador de censos pendientes en SQLite
  Future<void> refreshOfflineQueue() async {
    try {
      _offlineQueue = await _dbService.getUnsyncedCensos();
      _pendingOfflineCount = _offlineQueue.length;
      notifyListeners();
    } catch (_) {}
  }

  /// Sincroniza en lote todos los censos guardados offline cuando se recupera internet
  Future<int> sincronizarPendientesOffline() async {
    if (_offlineQueue.isEmpty) return 0;

    _isSyncing = true;
    notifyListeners();

    int sincronizados = 0;
    final pendientes = List<CensoFamiliaModel>.from(_offlineQueue);

    for (final item in pendientes) {
      try {
        await _censoService.enviarCenso(item);
        await _dbService.markCensoSynced(item.id);
        sincronizados++;
      } catch (_) {
        // Continuar con los demás si uno falla
      }
    }

    await refreshOfflineQueue();
    _isSyncing = false;
    notifyListeners();
    return sincronizados;
  }

  /// Carga solicitudes de censo pendientes para el censador/digitalizador
  Future<void> loadSolicitudes({String? estado}) async {
    _isLoadingSolicitudes = true;
    _solicitudesError = null;
    notifyListeners();

    try {
      _solicitudes = await _censoService.getSolicitudesCenso(estado: estado);
      _isLoadingSolicitudes = false;
      notifyListeners();
    } catch (e) {
      _solicitudesError = e.toString();
      _isLoadingSolicitudes = false;
      notifyListeners();
    }
  }

  /// Envía la solicitud de visita de un censador (ciudadano no censado)
  Future<bool> solicitarVisitaCenso({
    required String nombre,
    required String cedula,
    String? telefono,
    required String sector,
    String? referencia,
    double? lat,
    double? lon,
  }) async {
    try {
      final req = SolicitudCensoModel(
        jefeFamiliaNombre: nombre,
        jefeFamiliaCedula: cedula,
        telefonoContacto: telefono,
        barrioSector: sector,
        direccionReferencia: referencia,
        latitud: lat,
        longitud: lon,
      );
      await _censoService.crearSolicitudCenso(req);
      return true;
    } catch (e) {
      debugPrint('Error enviando solicitud censo: $e');
      return false;
    }
  }

  Future<void> marcarSolicitudAtendida(String id) async {
    try {
      await _censoService.actualizarEstadoSolicitud(id, 'ATENDIDO');
      await loadSolicitudes();
    } catch (_) {}
  }

  void resetForm() {
    _numeroIntegrantes = 4;
    _ninosMenores5 = 1;
    _adultosMayores = 0;
    _personasDiscapacidad = 0;
    _danosVivienda = 'PARCIAL';
    _requiereEvacuacion = false;
    _currentGpsPosition = null;
    _gpsStatusMessage = null;
    notifyListeners();
  }
}
