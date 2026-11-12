import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import '../../core/constants/api_constants.dart';
import '../../core/utils/distance_calculator.dart';
import '../../models/incidente_model.dart';
import '../../models/zona_riesgo_model.dart';
import '../../services/api/incidente_service.dart';
import '../../services/database/local_db_service.dart';
import '../../services/location/location_service.dart';

enum DistanceSortOrder {
  cerca, // Más cercano primero (Ascendente)
  lejos, // Más lejano primero (Descendente)
}

class IncidentesProvider extends ChangeNotifier {
  final IncidenteService _incidenteService = IncidenteService();
  final LocalDatabaseService _dbService = LocalDatabaseService();

  List<IncidenteModel> _incidentes = [];
  List<ZonaRiesgoModel> _zonasRiesgo = [];
  bool _isLoading = false;
  String? _errorMessage;

  // Estado del GPS del Ciudadano
  Position? _citizenPosition;
  DistanceSortOrder _sortOrder = DistanceSortOrder.cerca;
  String _filtroGravedad = 'TODOS';

  // Estado de Emisión de Emergencia
  bool _isReporting = false;

  // Getters
  List<IncidenteModel> get incidentes => _getFilteredAndSortedIncidentes();
  List<ZonaRiesgoModel> get zonasRiesgo => _zonasRiesgo;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  Position? get citizenPosition => _citizenPosition;
  DistanceSortOrder get sortOrder => _sortOrder;
  String get filtroGravedad => _filtroGravedad;
  bool get isReporting => _isReporting;

  IncidentesProvider() {
    initData();
  }

  Future<void> initData() async {
    await updateCitizenLocation();
    await loadIncidentesYZonas();
  }

  /// Obtiene la ubicación GPS del ciudadano para calcular proximidad
  Future<void> updateCitizenLocation() async {
    try {
      final pos = await LocationService.getCurrentPosition();
      _citizenPosition = pos ?? LocationService.defaultEsmeraldasPosition;
    } catch (_) {
      _citizenPosition = LocationService.defaultEsmeraldasPosition;
    }
    _recalcularDistancias();
    notifyListeners();
  }

  /// Carga incidentes y zonas de riesgo desde las APIs de Django PostGIS
  Future<void> loadIncidentesYZonas() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _incidenteService.getIncidentes(),
        _incidenteService.getZonasRiesgo(soloAlertadas: false),
      ]);

      _incidentes = results[0] as List<IncidenteModel>;
      _zonasRiesgo = results[1] as List<ZonaRiesgoModel>;

      _recalcularDistancias();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = 'No se pudieron sincronizar los incidentes: $e';
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Recalcula la distancia Haversine de cada incidente y zona de riesgo respecto al GPS actual
  void _recalcularDistancias() {
    final lat = _citizenPosition?.latitude ?? ApiConstants.esmeraldasLat;
    final lon = _citizenPosition?.longitude ?? ApiConstants.esmeraldasLon;

    for (final inc in _incidentes) {
      inc.distanciaMetros = DistanceCalculator.calcularDistanciaMetros(
        lat1: lat,
        lon1: lon,
        lat2: inc.lat,
        lon2: inc.lon,
      );
    }

    for (final zona in _zonasRiesgo) {
      zona.distanciaMetros = DistanceCalculator.calcularDistanciaMetros(
        lat1: lat,
        lon1: lon,
        lat2: zona.lat,
        lon2: zona.lon,
      );
    }
  }

  /// Conmutador de Orden: "Acontecimientos Cerca de Ti" / "Más Lejos de Ti"
  void toggleSortOrder(DistanceSortOrder order) {
    _sortOrder = order;
    notifyListeners();
  }

  void setFiltroGravedad(String gravedad) {
    _filtroGravedad = gravedad;
    notifyListeners();
  }

  List<IncidenteModel> _getFilteredAndSortedIncidentes() {
    var list = List<IncidenteModel>.from(_incidentes);

    // Filtro por gravedad
    if (_filtroGravedad != 'TODOS') {
      list = list.where((i) => i.nivelGravedad.toUpperCase() == _filtroGravedad).toList();
    }

    // Ordenamiento por proximidad GPS
    list.sort((a, b) {
      final distA = a.distanciaMetros ?? 0.0;
      final distB = b.distanciaMetros ?? 0.0;
      if (_sortOrder == DistanceSortOrder.cerca) {
        return distA.compareTo(distB);
      } else {
        return distB.compareTo(distA);
      }
    });

    return list;
  }

  /// Emite una emergencia rápida (Opción B del ciudadano)
  Future<Map<String, dynamic>> emitirEmergencia({
    required String tipoEvento, // 'FENOMENO_NINO', 'INUNDACION', 'DESLIZAMIENTO', etc.
    required String nivelGravedad, // 'CRITICO', 'ALTO', 'MEDIO'
    required String descripcion,
    String? photoPath,
    int personasAtrapadas = 0,
    int familiasAfectadas = 0,
    String? usuarioNombre,
  }) async {
    _isReporting = true;
    notifyListeners();

    // Captura en tiempo real del GPS en el instante exacto de emitir la emergencia
    try {
      final freshPos = await LocationService.getCurrentPosition();
      if (freshPos != null) {
        _citizenPosition = freshPos;
      }
    } catch (_) {}

    final lat = _citizenPosition?.latitude ?? ApiConstants.esmeraldasLat;
    final lon = _citizenPosition?.longitude ?? ApiConstants.esmeraldasLon;

    final reporte = IncidenteModel(
      tipoEvento: tipoEvento,
      nivelGravedad: nivelGravedad,
      descripcion: descripcion,
      lat: lat,
      lon: lon,
      personasAtrapadas: personasAtrapadas,
      familiasAfectadas: familiasAfectadas,
      fotos: photoPath != null ? [photoPath] : [],
      usuarioNombre: usuarioNombre,
      fechaIncidente: DateTime.now().toIso8601String(),
    );

    try {
      final res = await _incidenteService.crearIncidente(
        reporte,
        imagePath: photoPath,
      );
      _incidentes.insert(0, res);
      _recalcularDistancias();
      _isReporting = false;
      notifyListeners();
      return {
        'success': true,
        'online': true,
        'mensaje': 'Emergencia emitida y notificada al Centro de Operaciones de Emergencia (COE).',
      };
    } catch (e) {
      debugPrint('Error emitiendo emergencia online hacia Render: $e');
      // Si no hay red, guardar offline en SQLite
      await _dbService.insertIncidente(reporte);
      _incidentes.insert(0, reporte);
      _recalcularDistancias();
      _isReporting = false;
      notifyListeners();
      return {
        'success': true,
        'online': false,
        'mensaje': 'Sin conexión con el servidor. Emergencia guardada localmente en el móvil para sincronizarse al detectar señal.',
      };
    }
  }
}
