import 'package:flutter/foundation.dart';
import '../../core/constants/api_constants.dart';
import '../../core/utils/distance_calculator.dart';
import '../../models/albergue_model.dart';
import '../../services/api/evacuation_service.dart';

class EvacuationProvider extends ChangeNotifier {
  final EvacuationService _service = EvacuationService();

  AlbergueModel? _nearestShelter;
  List<AlbergueModel> _allShelters = [];
  bool _isLoading = false;
  bool _familyHelpStatus = true; // Toggle verde de Phone 4
  bool _isCalculatingHelp = false;
  String? _helpMessage;
  double _lastUserLat = ApiConstants.esmeraldasLat;
  double _lastUserLon = ApiConstants.esmeraldasLon;

  AlbergueModel? get nearestShelter => _nearestShelter;
  List<AlbergueModel> get allShelters => _allShelters;
  bool get isLoading => _isLoading;
  bool get familyHelpStatus => _familyHelpStatus;
  bool get isCalculatingHelp => _isCalculatingHelp;
  String? get helpMessage => _helpMessage;
  double get lastUserLat => _lastUserLat;
  double get lastUserLon => _lastUserLon;

  EvacuationProvider() {
    loadShelters();
  }

  Future<void> fetchShelters([double? lat, double? lon]) => loadShelters(lat, lon);

  void selectShelter(AlbergueModel shelter) {
    _nearestShelter = shelter;
    notifyListeners();
  }

  Future<void> loadShelters([double? lat, double? lon]) async {
    _isLoading = true;
    notifyListeners();

    try {
      final targetLat = lat ?? _lastUserLat;
      final targetLon = lon ?? _lastUserLon;
      _lastUserLat = targetLat;
      _lastUserLon = targetLon;

      final list = await _service.getAlbergues();
      for (final s in list) {
        s.distanciaMetros = DistanceCalculator.calcularDistanciaMetros(
          lat1: targetLat,
          lon1: targetLon,
          lat2: s.lat,
          lon2: s.lon,
        );
      }
      // Ordenar de más cercano a más lejano (Ascendente)
      list.sort((a, b) => (a.distanciaMetros ?? 0.0).compareTo(b.distanciaMetros ?? 0.0));
      _allShelters = list;

      if (_allShelters.isNotEmpty) {
        if (_nearestShelter != null) {
          final found = _allShelters.firstWhere(
            (s) => s.id == _nearestShelter!.id,
            orElse: () => _allShelters.first,
          );
          _nearestShelter = found;
        } else {
          _nearestShelter = _allShelters.first;
        }
      }
    } catch (_) {
      if (_allShelters.isEmpty) {
        _nearestShelter = AlbergueModel(
          id: 1,
          nombre: 'Albergue Seguro 1',
          direccion: 'Refugio Seguro Oficial • Cantón Esmeraldas',
          capacidadMaxima: 350,
          ocupacionActual: 80,
          lat: 0.9735,
          lon: -79.6520,
        );
        _allShelters = [_nearestShelter!];
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void toggleFamilyHelpStatus(bool value) {
    _familyHelpStatus = value;
    notifyListeners();
  }

  Future<void> calculateHelp({
    int numeroIntegrantes = 4,
    int ninos = 1,
    int adultosMayores = 0,
  }) async {
    _isCalculatingHelp = true;
    _helpMessage = null;
    notifyListeners();

    await Future.delayed(const Duration(milliseconds: 700));

    // Lógica de cálculo humanitario basada en el censo
    final int kitsAlimentos = (numeroIntegrantes / 4).ceil();
    final int frazadas = numeroIntegrantes;
    final int kitsSalud = (ninos > 0 || adultosMayores > 0) ? 2 : 1;

    _helpMessage =
        'Asignación calculada para su núcleo familiar ($numeroIntegrantes miembros):\n'
        '• $kitsAlimentos Kit(s) de Alimentos y Agua Potable (72h)\n'
        '• $frazadas Frazadas y colchonetas\n'
        '• $kitsSalud Kit(s) de Primeros Auxilios e Higiene';

    _isCalculatingHelp = false;
    notifyListeners();
  }
}
