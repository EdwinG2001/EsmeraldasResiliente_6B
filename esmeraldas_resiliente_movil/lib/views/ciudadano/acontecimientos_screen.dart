import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../core/constants/api_constants.dart';
import '../../core/constants/app_colors.dart';
import '../../models/incidente_model.dart';
import '../../providers/incidentes_provider.dart';
import '../../widgets/incidente_card.dart';

class AcontecimientosScreen extends StatefulWidget {
  const AcontecimientosScreen({Key? key}) : super(key: key);

  @override
  State<AcontecimientosScreen> createState() => _AcontecimientosScreenState();
}

class _AcontecimientosScreenState extends State<AcontecimientosScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final MapController _mapController = MapController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _showIncidenteDetails(IncidenteModel inc) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  inc.tipoEvento.replaceAll('_', ' '),
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: inc.nivelGravedad == 'CRITICO'
                        ? AppColors.emergencyRed
                        : AppColors.warningOrange,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    inc.nivelGravedad,
                    style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              inc.descripcion,
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.4),
            ),
            const SizedBox(height: 14),

            // Cruce Geoespacial PostGIS (Familias Censadas a 25m)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.surfaceElevated,
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
                        'Motor Espacial PostGIS (25m Perímetro)',
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
                      _metricDetail('Afectadas', '${inc.personasAfectadasEstimadas}', AppColors.emergencyRed),
                      _metricDetail('Familias', '${inc.familiasEnPerimetro}', AppColors.textPrimary),
                      _metricDetail('Niños <5', '${inc.ninosEnRiesgo}', AppColors.warningOrange),
                      _metricDetail('Adultos M.', '${inc.adultosMayoresRiesgo}', AppColors.textSecondary),
                      _metricDetail('Discapacidad', '${inc.discapacitadosRiesgo}', AppColors.primaryLight),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                const Icon(Icons.pin_drop, size: 16, color: AppColors.primary),
                const SizedBox(width: 6),
                Text(
                  'Coordenadas: ${inc.lat.toStringAsFixed(4)}, ${inc.lon.toStringAsFixed(4)}',
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.access_time, size: 16, color: AppColors.textMuted),
                const SizedBox(width: 6),
                Text(
                  'Fecha: ${inc.fechaIncidente.substring(0, 10)}',
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                ),
              ],
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Cerrar'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  static Widget _metricDetail(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: color),
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
    final incidentes = incidentesProvider.incidentes;
    final isCerca = incidentesProvider.sortOrder == DistanceSortOrder.cerca;

    final citizenPos = incidentesProvider.citizenPosition;
    final centerLatLng = LatLng(
      citizenPos?.latitude ?? ApiConstants.esmeraldasLat,
      citizenPos?.longitude ?? ApiConstants.esmeraldasLon,
    );

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Acontecimientos y Riesgos'),
        actions: [
          IconButton(
            icon: const Icon(Icons.my_location),
            tooltip: 'Actualizar GPS y Distancias',
            onPressed: () async {
              await incidentesProvider.updateCitizenLocation();
              await incidentesProvider.loadIncidentesYZonas();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Ubicación y distancias recalculadas.')),
              );
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textMuted,
          tabs: const [
            Tab(icon: Icon(Icons.list_alt), text: 'Listado por Proximidad'),
            Tab(icon: Icon(Icons.map_outlined), text: 'Mapa Interactivo GIS'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // PESTAÑA 1: LISTADO ORDENADO POR PROXIMIDAD GPS
          RefreshIndicator(
            onRefresh: () async {
              await incidentesProvider.updateCitizenLocation();
              await incidentesProvider.loadIncidentesYZonas();
            },
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              children: [
                // CONMUTADOR DE ORDENAMIENTO: "Cerca de Ti" vs "Más Lejos de Ti"
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceCard,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: InkWell(
                          borderRadius: BorderRadius.circular(10),
                          onTap: () => incidentesProvider.toggleSortOrder(DistanceSortOrder.cerca),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: isCerca ? AppColors.primary : Colors.transparent,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.near_me,
                                  size: 16,
                                  color: isCerca ? Colors.white : AppColors.textMuted,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  'Más Cerca de Ti',
                                  style: TextStyle(
                                    color: isCerca ? Colors.white : AppColors.textMuted,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: InkWell(
                          borderRadius: BorderRadius.circular(10),
                          onTap: () => incidentesProvider.toggleSortOrder(DistanceSortOrder.lejos),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: !isCerca ? AppColors.primary : Colors.transparent,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.travel_explore,
                                  size: 16,
                                  color: !isCerca ? Colors.white : AppColors.textMuted,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  'Más Lejos de Ti',
                                  style: TextStyle(
                                    color: !isCerca ? Colors.white : AppColors.textMuted,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                // Filtros de Gravedad
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: ['TODOS', 'CRITICO', 'ALTO', 'MEDIO', 'BAJO'].map((g) {
                      final isSelected = incidentesProvider.filtroGravedad == g;
                      return Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: FilterChip(
                          label: Text(g, style: const TextStyle(fontSize: 11)),
                          selected: isSelected,
                          selectedColor: AppColors.primary.withOpacity(0.3),
                          checkmarkColor: AppColors.primary,
                          backgroundColor: AppColors.surfaceElevated,
                          onSelected: (_) => incidentesProvider.setFiltroGravedad(g),
                        ),
                      );
                    }).toList(),
                  ),
                ),
                const SizedBox(height: 14),

                if (incidentesProvider.isLoading) ...[
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(40),
                      child: CircularProgressIndicator(color: AppColors.primary),
                    ),
                  )
                ] else if (incidentes.isEmpty) ...[
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.all(40),
                      child: Column(
                        children: const [
                          Icon(Icons.check_circle_outline, size: 48, color: AppColors.successGreen),
                          SizedBox(height: 12),
                          Text(
                            'No hay incidentes reportados en este filtro',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'La zona se encuentra estable.',
                            style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  )
                ] else ...[
                  ...incidentes.map(
                    (inc) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: IncidenteCard(
                        incidente: inc,
                        onTap: () => _showIncidenteDetails(inc),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),

          // PESTAÑA 2: MAPA INTERACTIVO GIS
          Stack(
            children: [
              FlutterMap(
                mapController: _mapController,
                options: MapOptions(
                  initialCenter: centerLatLng,
                  initialZoom: 13.5,
                  minZoom: 10,
                  maxZoom: 18,
                ),
                children: [
                  // Capa Oficial OpenStreetMap Estándar
                  TileLayer(
                    urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'ec.gob.esmeraldas.resiliente',
                    maxZoom: 19,
                  ),
                  // Marcador de Ubicación del Ciudadano
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: centerLatLng,
                        width: 50,
                        height: 50,
                        child: Column(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: const BoxDecoration(
                                color: AppColors.primary,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(color: AppColors.primaryGlow, blurRadius: 10)
                                ],
                              ),
                              child: const Icon(Icons.person_pin_circle, color: Colors.white, size: 22),
                            ),
                          ],
                        ),
                      ),
                      // Marcadores de Incidentes
                      ...incidentes.map(
                        (inc) => Marker(
                          point: LatLng(inc.lat, inc.lon),
                          width: 44,
                          height: 44,
                          child: GestureDetector(
                            onTap: () => _showIncidenteDetails(inc),
                            child: Container(
                              decoration: BoxDecoration(
                                color: inc.nivelGravedad == 'CRITICO'
                                    ? AppColors.emergencyRed
                                    : AppColors.warningOrange,
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white, width: 2),
                                boxShadow: const [
                                  BoxShadow(color: Colors.black45, blurRadius: 6)
                                ],
                              ),
                              child: const Icon(Icons.warning, color: Colors.white, size: 18),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              // Leyenda Flotante en el Mapa
              Positioned(
                top: 14,
                left: 14,
                right: 14,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: AppColors.surface.withOpacity(0.9),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: const [
                          Icon(Icons.person_pin_circle, color: AppColors.primary, size: 16),
                          SizedBox(width: 4),
                          Text('Tu Ubicación', style: TextStyle(fontSize: 11, color: AppColors.textPrimary)),
                        ],
                      ),
                      Row(
                        children: const [
                          Icon(Icons.warning, color: AppColors.emergencyRed, size: 16),
                          SizedBox(width: 4),
                          Text('Crítico', style: TextStyle(fontSize: 11, color: AppColors.emergencyRed, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      Row(
                        children: const [
                          Icon(Icons.warning, color: AppColors.warningOrange, size: 16),
                          SizedBox(width: 4),
                          Text('Alto / Medio', style: TextStyle(fontSize: 11, color: AppColors.warningOrange)),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
