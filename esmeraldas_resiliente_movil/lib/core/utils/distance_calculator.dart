import 'dart:math';

class DistanceCalculator {
  /// Calcula la distancia Haversine en metros entre dos coordenadas geográficas.
  static double calcularDistanciaMetros({
    required double lat1,
    required double lon1,
    required double lat2,
    required double lon2,
  }) {
    const double radioTierraMetros = 6371000; // Radio de la Tierra en metros

    final double dLat = _gradosARadianes(lat2 - lat1);
    final double dLon = _gradosARadianes(lon2 - lon1);

    final double a = sin(dLat / 2) * sin(dLat / 2) +
        cos(_gradosARadianes(lat1)) *
            cos(_gradosARadianes(lat2)) *
            sin(dLon / 2) *
            sin(dLon / 2);

    final double c = 2 * atan2(sqrt(a), sqrt(1 - a));

    return radioTierraMetros * c;
  }

  static double _gradosARadianes(double grados) {
    return grados * (pi / 180.0);
  }

  /// Retorna un texto amigable de la distancia: "120 m" o "2.4 km".
  static String formatearDistancia(double metros) {
    if (metros < 1000) {
      return '${metros.round()} m';
    } else {
      final km = metros / 1000;
      return '${km.toStringAsFixed(1)} km';
    }
  }
}
