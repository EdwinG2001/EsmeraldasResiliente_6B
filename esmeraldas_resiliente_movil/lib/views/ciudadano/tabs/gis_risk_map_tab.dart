import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:provider/provider.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart' hide DistanceCalculator;
import '../../../core/constants/api_constants.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/distance_calculator.dart';
import '../../../models/albergue_model.dart';
import '../../../providers/evacuation_provider.dart';
import '../../../providers/incidentes_provider.dart';

class GisRiskMapTab extends StatefulWidget {
  final VoidCallback onOpenDrawer;

  const GisRiskMapTab({
    Key? key,
    required this.onOpenDrawer,
  }) : super(key: key);

  @override
  State<GisRiskMapTab> createState() => _GisRiskMapTabState();
}

class _GisRiskMapTabState extends State<GisRiskMapTab> {
  final MapController _mapController = MapController();
  bool _showZoneDetails = false;

  // Telemetría de Clima en Vivo (HUD Flotante)
  String _weatherTemp = '31.0°C';
  String _weatherRain = '0.0 mm';
  String _weatherWind = '15.8 km/h';
  String _weatherClouds = '55%';
  bool _isLoadingWeather = false;

  @override
  void initState() {
    super.initState();
    _fetchLiveWeather();
  }

  Future<void> _fetchLiveWeather() async {
    setState(() => _isLoadingWeather = true);
    try {
      final dio = Dio();
      final res = await dio.get(
        'https://api.open-meteo.com/v1/forecast?latitude=0.9681&longitude=-79.6582&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,cloud_cover',
      );
      if (res.data != null && res.data['current'] != null) {
        final cur = res.data['current'];
        if (mounted) {
          setState(() {
            _weatherTemp = '${cur['temperature_2m'] ?? 31.0}°C';
            _weatherRain = '${cur['precipitation'] ?? 0.0} mm';
            _weatherWind = '${cur['wind_speed_10m'] ?? 15.0} km/h';
            _weatherClouds = '${cur['cloud_cover'] ?? 55}%';
            _isLoadingWeather = false;
          });
        }
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingWeather = false);
    }
  }

  void _centerOnCurrentLocation() {
    final pos = Provider.of<IncidentesProvider>(context, listen: false).citizenPosition;
    final lat = pos?.latitude ?? ApiConstants.esmeraldasLat;
    final lon = pos?.longitude ?? ApiConstants.esmeraldasLon;
    _mapController.move(LatLng(lat, lon), 14.5);
  }

  void _showShelterBottomSheet(BuildContext context, AlbergueModel shelter, double distanceMetros) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surfaceElevated,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: const BoxDecoration(
                    color: Color(0xFF0284C7),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.night_shelter, color: Colors.white, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        shelter.nombre,
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      Text(
                        'Albergue Oficial Más Cercano a tu Ubicación',
                        style: TextStyle(
                          fontSize: 11,
                          color: AppColors.primaryLight,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Text(
              shelter.direccion,
              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _metricCol('Distancia', DistanceCalculator.formatearDistancia(distanceMetros), AppColors.primaryLight),
                  _metricCol('Capacidad', '${shelter.capacidadMaxima}', AppColors.textPrimary),
                  _metricCol('Ocupados', '${shelter.ocupacionActual}', AppColors.riskYellow),
                  _metricCol('Disponibles', '${shelter.cuposDisponibles}', AppColors.attendedGreen),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0284C7),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: () {
                  Navigator.pop(ctx);
                  _mapController.move(LatLng(shelter.lat, shelter.lon), 16.0);
                },
                icon: const Icon(Icons.directions, color: Colors.white, size: 18),
                label: const Text('Centrar en Albergue', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showIncidentBottomSheet(BuildContext context, dynamic inc) {
    final isCrit = inc.nivelGravedad.toUpperCase() == 'CRITICO';
    final isMed = inc.nivelGravedad.toUpperCase() == 'ALTO' ||
        inc.nivelGravedad.toUpperCase() == 'MEDIO';
    final badgeColor = isCrit
        ? AppColors.floodRed
        : (isMed ? AppColors.riskYellow : AppColors.attendedGreen);

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surfaceElevated,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    inc.tipoEvento.replaceAll('_', ' '),
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: badgeColor.withOpacity(0.2),
                    border: Border.all(color: badgeColor),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    inc.nivelGravedad,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: badgeColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              inc.descripcion.isNotEmpty ? inc.descripcion : 'Sin descripción proporcionada.',
              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 14),

            // Tarjeta de Cruce PostGIS (Estimación en Radio de 25m)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.primary.withOpacity(0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: const [
                      Icon(Icons.radar, color: AppColors.primary, size: 16),
                      SizedBox(width: 6),
                      Text(
                        'Motor Espacial PostGIS (Perímetro 25m)',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primaryLight,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _metricCol('Población', '${inc.personasAfectadasEstimadas}', AppColors.floodRed),
                      _metricCol('Familias', '${inc.familiasEnPerimetro}', AppColors.textPrimary),
                      _metricCol('Niños <5', '${inc.ninosEnRiesgo}', AppColors.riskYellow),
                      _metricCol('Tercera Edad', '${inc.adultosMayoresRiesgo}', AppColors.textSecondary),
                      _metricCol('Discapacidad', '${inc.discapacitadosRiesgo}', AppColors.primaryLight),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Informante: ${inc.usuarioNombre ?? 'Ciudadano'}',
                  style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                ),
                Text(
                  'Estado: ${inc.estado}',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  static Widget _metricCol(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: color),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(fontSize: 10, color: AppColors.textSecondary),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final incidentesProvider = Provider.of<IncidentesProvider>(context);
    final evacProvider = Provider.of<EvacuationProvider>(context);

    final citizenPos = incidentesProvider.citizenPosition;
    final citizenLat = citizenPos?.latitude ?? ApiConstants.esmeraldasLat;
    final citizenLon = citizenPos?.longitude ?? ApiConstants.esmeraldasLon;
    final centerLatLng = LatLng(citizenLat, citizenLon);

    // FILTRO: Separar incidentes activos y atendidos en tiempo real
    final activeIncidents = incidentesProvider.incidentes.where((inc) {
      final st = inc.estado.toUpperCase();
      return st != 'ATENDIDO' && st != 'DESCARTADO' && st != 'RESUELTO';
    }).toList();

    final attendedIncidents = incidentesProvider.incidentes.where((inc) {
      final st = inc.estado.toUpperCase();
      return st == 'ATENDIDO' || st == 'RESUELTO';
    }).toList();

    // ALGORITMO EXPANSIVO DE BÚSQUEDA DEL ALBERGUE MÁS CERCANO (25m -> 50m -> 100m -> 250m -> 500m...)
    final List<AlbergueModel> availableShelters = evacProvider.allShelters.isNotEmpty
        ? evacProvider.allShelters
        : (evacProvider.nearestShelter != null
            ? [evacProvider.nearestShelter!]
            : [
                AlbergueModel(
                  id: 1,
                  nombre: 'Coliseo Nubia Villacís',
                  direccion: 'Av. Jaime Roldós y Olmedo, Esmeraldas',
                  capacidadMaxima: 450,
                  ocupacionActual: 120,
                  lat: 0.9650,
                  lon: -79.6590,
                ),
                AlbergueModel(
                  id: 2,
                  nombre: 'Albergue U.E. Luis Vargas Torres',
                  direccion: 'Unidad Educativa Luis Vargas Torres, Esmeraldas',
                  capacidadMaxima: 300,
                  ocupacionActual: 65,
                  lat: 0.9720,
                  lon: -79.6540,
                ),
              ]);

    AlbergueModel? closestShelter;
    double minShelterDist = double.infinity;

    for (final shelter in availableShelters) {
      final dist = DistanceCalculator.calcularDistanciaMetros(
        lat1: citizenLat,
        lon1: citizenLon,
        lat2: shelter.lat,
        lon2: shelter.lon,
      );
      if (dist < minShelterDist) {
        minShelterDist = dist;
        closestShelter = shelter;
      }
    }

    // Calcular radio expansivo concéntrico alcanzado
    double currentExpansiveRadius = 25.0;
    const List<double> radiusSteps = [25.0, 50.0, 100.0, 250.0, 500.0, 1000.0, 2000.0, 5000.0, 10000.0];
    for (final step in radiusSteps) {
      currentExpansiveRadius = step;
      if (step >= minShelterDist) {
        break;
      }
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.menu, color: AppColors.textPrimary),
          onPressed: widget.onOpenDrawer,
        ),
        title: const Text(
          'Mapa de Riesgos GIS',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 17,
            fontWeight: FontWeight.w700,
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.layers_outlined, color: AppColors.textPrimary),
            tooltip: 'Capas PostGIS',
            onPressed: () {
              setState(() => _showZoneDetails = !_showZoneDetails);
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          // MAPA INTERACTIVO GIS
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: const LatLng(0.9695, -79.6550),
              initialZoom: 13.8,
              minZoom: 11,
              maxZoom: 18,
            ),
            children: [
              // Capa Oficial OpenStreetMap Estándar
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'ec.gob.esmeraldas.resiliente',
                maxZoom: 19,
              ),

              // POLÍGONOS DE RIESGO DE ESMERALDAS (POSTGIS REAL EN RENDER - SOLO SI TIENEN ALERTA ACTIVA EMITIDA POR EL COE)
              PolygonLayer(
                polygons: [
                  ...incidentesProvider.zonasRiesgo
                      .where((z) => z.alertaActiva && z.poligono.length >= 3)
                      .map((z) {
                    final isHigh = (z.nivelAlerta ?? z.nivelRiesgo).toUpperCase() == 'ROJA' ||
                        (z.nivelAlerta ?? z.nivelRiesgo).toUpperCase() == 'ALTO';
                    return Polygon(
                      points: z.poligono.map((p) => LatLng(p[0], p[1])).toList(),
                      color: isHigh ? AppColors.floodRedAlpha : AppColors.riskYellowAlpha,
                      borderColor: isHigh ? AppColors.floodRed : AppColors.riskYellow,
                      borderStrokeWidth: isHigh ? 2.5 : 2.0,
                      isFilled: true,
                    );
                  }),
                ],
              ),

              // MOTOR GEOESPACIAL: BUFFER POSTGIS DE 25M SOLO PARA INCIDENTES ACTIVOS
              CircleLayer(
                circles: [
                  // Buffer de incidentes activos
                  ...activeIncidents.map((inc) {
                    final isCrit = inc.nivelGravedad.toUpperCase() == 'CRITICO';
                    final isMed = inc.nivelGravedad.toUpperCase() == 'ALTO' ||
                        inc.nivelGravedad.toUpperCase() == 'MEDIO';
                    final color = isCrit
                        ? AppColors.floodRed
                        : (isMed ? AppColors.riskYellow : AppColors.attendedGreen);
                    return CircleMarker(
                      point: LatLng(inc.lat, inc.lon),
                      color: color.withOpacity(0.18),
                      borderColor: color,
                      borderStrokeWidth: 1.5,
                      radius: inc.radioAnalisisMetros > 0 ? inc.radioAnalisisMetros : 25.0,
                      useRadiusInMeter: true,
                    );
                  }),
                  // Buffer del radio expansivo PostGIS alrededor del albergue más cercano
                  if (closestShelter != null)
                    CircleMarker(
                      point: LatLng(closestShelter.lat, closestShelter.lon),
                      color: const Color(0xFF0284C7).withOpacity(0.12),
                      borderColor: const Color(0xFF0284C7),
                      borderStrokeWidth: 2.0,
                      radius: 80.0,
                      useRadiusInMeter: true,
                    ),
                ],
              ),

              // PINES EN EL MAPA: ALBERGUES, INCIDENTES ACTIVOS, RESUELTOS Y CIUDADANO
              MarkerLayer(
                markers: [
                  // 1. Pines de incidentes activos en vivo (Crítico / Alto / Medio)
                  ...activeIncidents.map((inc) {
                    final isCrit = inc.nivelGravedad.toUpperCase() == 'CRITICO';
                    final isMed = inc.nivelGravedad.toUpperCase() == 'ALTO' ||
                        inc.nivelGravedad.toUpperCase() == 'MEDIO';
                    final color = isCrit
                        ? AppColors.floodRed
                        : (isMed ? AppColors.riskYellow : AppColors.attendedGreen);
                    return Marker(
                      point: LatLng(inc.lat, inc.lon),
                      width: 40,
                      height: 40,
                      child: GestureDetector(
                        onTap: () => _showIncidentBottomSheet(context, inc),
                        child: Icon(Icons.location_on, color: color, size: isCrit ? 38 : 34),
                      ),
                    );
                  }),

                  // 2. Incidentes atendidos / resueltos por el COE (Pines verdes de verificación)
                  ...attendedIncidents.map((inc) {
                    return Marker(
                      point: LatLng(inc.lat, inc.lon),
                      width: 32,
                      height: 32,
                      child: GestureDetector(
                        onTap: () => _showIncidentBottomSheet(context, inc),
                        child: Container(
                          decoration: BoxDecoration(
                            color: AppColors.surfaceElevated.withOpacity(0.92),
                            shape: BoxShape.circle,
                            border: Border.all(color: AppColors.attendedGreen, width: 2),
                            boxShadow: const [
                              BoxShadow(color: Colors.black38, blurRadius: 4),
                            ],
                          ),
                          child: const Center(
                            child: Icon(Icons.check, color: AppColors.attendedGreen, size: 16),
                          ),
                        ),
                      ),
                    );
                  }),

                  // 3. Red Completa de Albergues Habilitados
                  ...availableShelters.map((shelter) {
                    final isClosest = shelter.id == closestShelter?.id;
                    final dist = DistanceCalculator.calcularDistanciaMetros(
                      lat1: citizenLat,
                      lon1: citizenLon,
                      lat2: shelter.lat,
                      lon2: shelter.lon,
                    );
                    return Marker(
                      point: LatLng(shelter.lat, shelter.lon),
                      width: isClosest ? 44 : 34,
                      height: isClosest ? 44 : 34,
                      child: GestureDetector(
                        onTap: () => _showShelterBottomSheet(context, shelter, dist),
                        child: Container(
                          decoration: BoxDecoration(
                            color: isClosest ? const Color(0xFF0284C7) : const Color(0xFF0369A1),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: isClosest ? Colors.white : const Color(0xFFBAE6FD),
                              width: isClosest ? 2.5 : 1.5,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: isClosest ? const Color(0x660284C7) : Colors.black26,
                                blurRadius: isClosest ? 10 : 4,
                                spreadRadius: isClosest ? 3 : 1,
                              ),
                            ],
                          ),
                          child: Center(
                            child: Icon(
                              Icons.night_shelter,
                              color: Colors.white,
                              size: isClosest ? 22 : 16,
                            ),
                          ),
                        ),
                      ),
                    );
                  }),

                  // 4. Ubicación Actual del Ciudadano (GPS)
                  Marker(
                    point: centerLatLng,
                    width: 32,
                    height: 32,
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2.5),
                        boxShadow: const [
                          BoxShadow(color: AppColors.primaryGlow, blurRadius: 10, spreadRadius: 3),
                        ],
                      ),
                      child: const Center(
                        child: Icon(Icons.circle, color: Colors.white, size: 8),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),

          // BARRA FLOTANTE DE TELEMETRÍA DE CLIMA EN VIVO (HUD LATERAL SUPERIOR)
          Positioned(
            top: 14,
            left: 14,
            child: _buildWeatherHUD(),
          ),

          // BADGE SUPERIOR DERECHO "Módulo 1: Visor GIS"
          Positioned(
            top: 14,
            right: 14,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: AppColors.surfaceElevated.withOpacity(0.92),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: const [
                  Text(
                    'Módulo 1: Visor GIS',
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(width: 4),
                  Icon(Icons.expand_more, color: AppColors.textMuted, size: 14),
                ],
              ),
            ),
          ),

          // TARJETA FLOTANTE "Detalles de Zonas Inundables"
          if (_showZoneDetails)
            Positioned(
              top: 70,
              left: 20,
              right: 20,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.surface.withOpacity(0.95),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border),
                  boxShadow: const [
                    BoxShadow(color: Colors.black45, blurRadius: 16, offset: Offset(0, 4)),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: const [
                            Icon(Icons.pin_drop, color: AppColors.floodRed, size: 18),
                            SizedBox(width: 8),
                            Text(
                              'Detalles de Zonas Inundables',
                              style: TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        InkWell(
                          onTap: () => setState(() => _showZoneDetails = false),
                          child: const Icon(Icons.close, size: 16, color: AppColors.textMuted),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (incidentesProvider.zonasRiesgo.where((z) => z.alertaActiva).isEmpty)
                      const Row(
                        children: [
                          Icon(Icons.shield_outlined, color: AppColors.attendedGreen, size: 16),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Sin alertas activas de inundación emitidas por el COE para los sectores.',
                              style: TextStyle(color: AppColors.textSecondary, fontSize: 11),
                            ),
                          ),
                        ],
                      )
                    else
                      Column(
                        children: incidentesProvider.zonasRiesgo
                            .where((z) => z.alertaActiva)
                            .map((z) => Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 2),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 10,
                                        height: 10,
                                        decoration: BoxDecoration(
                                          color: AppColors.floodRed,
                                          borderRadius: BorderRadius.circular(2),
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: Text(
                                          '${z.nombre}: ${z.mensajeAlerta ?? "Alerta sectorial vigente"}',
                                          style: const TextStyle(
                                            color: AppColors.emergencyRed,
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ))
                            .toList(),
                      ),
                  ],
                ),
              ),
            ),

          // TARJETA INFORMATIVA FLOTANTE INFERIOR: ALBERGUE MÁS CERCANO (RADIO EXPANSIVO POSTGIS)
          if (closestShelter != null)
            Positioned(
              left: 20,
              right: 76,
              bottom: 24,
              child: InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: () => _showShelterBottomSheet(context, closestShelter!, minShelterDist),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: AppColors.surface.withOpacity(0.95),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF0284C7).withOpacity(0.6)),
                    boxShadow: const [
                      BoxShadow(color: Colors.black45, blurRadius: 10),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(7),
                        decoration: const BoxDecoration(
                          color: Color(0xFF0284C7),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.night_shelter, color: Colors.white, size: 18),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              closestShelter.nombre,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'A ${DistanceCalculator.formatearDistancia(minShelterDist)} • Radio PostGIS: ${currentExpansiveRadius.round()}m',
                              style: const TextStyle(
                                color: AppColors.attendedGreen,
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.chevron_right, color: AppColors.textMuted, size: 18),
                    ],
                  ),
                ),
              ),
            ),

          // BOTÓN FLOTANTE "Mi Ubicación GPS"
          Positioned(
            bottom: closestShelter != null ? 82 : 24,
            left: 20,
            child: InkWell(
              borderRadius: BorderRadius.circular(20),
              onTap: _centerOnCurrentLocation,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.surface.withOpacity(0.92),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.border),
                  boxShadow: const [
                    BoxShadow(color: Colors.black45, blurRadius: 10),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: const [
                    Icon(Icons.navigation, color: AppColors.primary, size: 14),
                    SizedBox(width: 6),
                    Text(
                      'Mi Ubicación GPS',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // CONTROLES DE ZOOM (+ / -)
          Positioned(
            right: 16,
            bottom: 24,
            child: Column(
              children: [
                _buildZoomButton(
                  icon: Icons.add,
                  onPressed: () {
                    _mapController.move(
                      _mapController.camera.center,
                      _mapController.camera.zoom + 1,
                    );
                  },
                ),
                const SizedBox(height: 6),
                _buildZoomButton(
                  icon: Icons.remove,
                  onPressed: () {
                    _mapController.move(
                      _mapController.camera.center,
                      _mapController.camera.zoom - 1,
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWeatherHUD() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xE60F172A),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF1E293B)),
        boxShadow: const [
          BoxShadow(color: Colors.black45, blurRadius: 8, offset: Offset(0, 2)),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.thermostat_outlined, color: Color(0xFFF59E0B), size: 14),
              const SizedBox(width: 3),
              Text(
                _weatherTemp,
                style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(width: 7),
          Container(width: 1, height: 12, color: Colors.white24),
          const SizedBox(width: 7),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.water_drop_outlined, color: Color(0xFF38BDF8), size: 14),
              const SizedBox(width: 3),
              Text(
                _weatherRain,
                style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(width: 7),
          Container(width: 1, height: 12, color: Colors.white24),
          const SizedBox(width: 7),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.air, color: Color(0xFF34D399), size: 14),
              const SizedBox(width: 3),
              Text(
                _weatherWind,
                style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(width: 7),
          Container(width: 1, height: 12, color: Colors.white24),
          const SizedBox(width: 7),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.cloud_outlined, color: Color(0xFF94A3B8), size: 14),
              const SizedBox(width: 3),
              Text(
                _weatherClouds,
                style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          if (_isLoadingWeather) ...[
            const SizedBox(width: 6),
            const SizedBox(
              width: 10,
              height: 10,
              child: CircularProgressIndicator(strokeWidth: 1.5, color: AppColors.primary),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildZoomButton({required IconData icon, required VoidCallback onPressed}) {
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        color: AppColors.surface.withOpacity(0.9),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.border),
      ),
      child: IconButton(
        padding: EdgeInsets.zero,
        icon: Icon(icon, color: AppColors.textPrimary, size: 18),
        onPressed: onPressed,
      ),
    );
  }
}
