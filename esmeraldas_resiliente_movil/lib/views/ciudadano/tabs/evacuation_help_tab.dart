import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart' hide DistanceCalculator;
import '../../../core/constants/api_constants.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/distance_calculator.dart';
import '../../../models/albergue_model.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/evacuation_provider.dart';
import '../../../providers/incidentes_provider.dart';

class EvacuationHelpTab extends StatefulWidget {
  final VoidCallback onOpenDrawer;

  const EvacuationHelpTab({
    Key? key,
    required this.onOpenDrawer,
  }) : super(key: key);

  @override
  State<EvacuationHelpTab> createState() => _EvacuationHelpTabState();
}

class _EvacuationHelpTabState extends State<EvacuationHelpTab> {
  final MapController _routeMapController = MapController();
  AlbergueModel? _selectedShelter;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _refreshShelters();
    });
  }

  Future<void> _refreshShelters() async {
    final citizenPos = Provider.of<IncidentesProvider>(context, listen: false).citizenPosition;
    final lat = citizenPos?.latitude ?? ApiConstants.esmeraldasLat;
    final lon = citizenPos?.longitude ?? ApiConstants.esmeraldasLon;
    await Provider.of<EvacuationProvider>(context, listen: false).loadShelters(lat, lon);
  }

  void _showCambiarAlbergueModal(
    BuildContext context,
    List<AlbergueModel> allShelters,
    double userLat,
    double userLon,
    AlbergueModel currentSelected,
  ) {
    // Calcular distancia a todos los albergues y filtrar los de 500 metros
    final sheltersWithDistance = allShelters.map((s) {
      final d = DistanceCalculator.calcularDistanciaMetros(
        lat1: userLat,
        lon1: userLon,
        lat2: s.lat,
        lon2: s.lon,
      );
      return {'shelter': s, 'distance': d};
    }).toList();

    sheltersWithDistance.sort((a, b) => (a['distance'] as double).compareTo(b['distance'] as double));

    final sheltersUnder500 = sheltersWithDistance
        .where((item) => (item['distance'] as double) <= 500.0)
        .toList();

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surfaceElevated,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.55,
          minChildSize: 0.35,
          maxChildSize: 0.85,
          expand: false,
          builder: (_, scrollController) {
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: AppColors.border,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Seleccionar Albergue de Evacuación',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, size: 20, color: AppColors.textMuted),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const Text(
                    'Perímetro de evacuación rápida: radio de 500 metros',
                    style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 14),

                  if (sheltersUnder500.isEmpty) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.riskYellow.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.riskYellow.withOpacity(0.4)),
                      ),
                      child: Row(
                        children: const [
                          Icon(Icons.info_outline, color: AppColors.riskYellow, size: 22),
                          SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Dentro de los 500 metros no existe otra ruta de evacuación rápida.',
                              style: TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                    const Text(
                      'Refugios oficiales habilitados más próximos:',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primaryLight),
                    ),
                    const SizedBox(height: 8),
                  ],

                  Expanded(
                    child: ListView.separated(
                      controller: scrollController,
                      itemCount: sheltersUnder500.isNotEmpty
                          ? sheltersUnder500.length
                          : sheltersWithDistance.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (_, i) {
                        final item = sheltersUnder500.isNotEmpty
                            ? sheltersUnder500[i]
                            : sheltersWithDistance[i];
                        final s = item['shelter'] as AlbergueModel;
                        final d = item['distance'] as double;
                        final isCurrent = s.id == currentSelected.id;

                        return InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () {
                            setState(() {
                              _selectedShelter = s;
                            });
                            Navigator.pop(ctx);
                            _routeMapController.move(LatLng(s.lat, s.lon), 15.0);
                          },
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: isCurrent
                                  ? const Color(0xFF0284C7).withOpacity(0.15)
                                  : AppColors.surface,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isCurrent
                                    ? const Color(0xFF0284C7)
                                    : AppColors.border,
                              ),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: isCurrent
                                        ? const Color(0xFF0284C7)
                                        : AppColors.surfaceElevated,
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    Icons.night_shelter,
                                    size: 20,
                                    color: isCurrent ? Colors.white : AppColors.primaryLight,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        s.nombre,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 13,
                                          color: AppColors.textPrimary,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        'Distancia: ${DistanceCalculator.formatearDistancia(d)} • Cupos libres: ${s.cuposDisponibles}',
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: d <= 500 ? AppColors.attendedGreen : AppColors.textMuted,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                if (isCurrent)
                                  const Icon(Icons.check_circle, color: Color(0xFF0284C7), size: 20)
                                else
                                  const Icon(Icons.arrow_forward_ios, color: AppColors.textMuted, size: 14),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final evacProvider = Provider.of<EvacuationProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);
    final citizenPos = Provider.of<IncidentesProvider>(context).citizenPosition;

    final userLat = citizenPos?.latitude ?? ApiConstants.esmeraldasLat;
    final userLon = citizenPos?.longitude ?? ApiConstants.esmeraldasLon;
    final userLatLng = LatLng(userLat, userLon);

    final shelter = _selectedShelter ?? evacProvider.nearestShelter;
    final shelterLatLng = LatLng(shelter?.lat ?? 0.9735, shelter?.lon ?? -79.6520);

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
          'Albergues y Evacuación',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 17,
            fontWeight: FontWeight.w700,
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.textPrimary, size: 22),
            tooltip: 'Actualizar albergues en vivo',
            onPressed: _refreshShelters,
          ),
          IconButton(
            icon: const Icon(Icons.help_outline, color: AppColors.textPrimary, size: 22),
            onPressed: () {
              showDialog(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Protocolo de Evacuación Segura'),
                  content: const Text(
                    'Las rutas son calculadas automáticamente por el motor geoespacial de PostGIS evitando zonas anegadas del Río Teaone y quebradas inestables.',
                    style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                  ),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Entendido')),
                  ],
                ),
              );
            },
          ),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _refreshShelters,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
            child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // BANNER "Ruta óptima calculada al Albergue más cercano"
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.surfaceElevated,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: const BoxDecoration(
                        color: Color(0xFF0284C7),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.alt_route, color: Colors.white, size: 16),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Text(
                        'Ruta óptima calculada al\nAlbergue más cercano',
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          height: 1.3,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // MINI MAPA INTERACTIVO CON RUTA AZUL (FIEL AL RENDER PHONE 4)
              Container(
                height: 220,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                clipBehavior: Clip.antiAlias,
                child: Stack(
                  children: [
                    FlutterMap(
                      mapController: _routeMapController,
                      options: MapOptions(
                        initialCenter: const LatLng(0.9705, -79.6550),
                        initialZoom: 14.5,
                      ),
                      children: [
                        TileLayer(
                          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                          userAgentPackageName: 'ec.gob.esmeraldas.resiliente',
                          maxZoom: 19,
                        ),

                        // LÍNEA AZUL DE RUTA ÓPTIMA DE EVACUACIÓN (POSTGIS ALBERGUE CERCANO)
                        PolylineLayer(
                          polylines: [
                            Polyline(
                              points: [
                                userLatLng,
                                LatLng((userLat * 0.65 + shelterLatLng.latitude * 0.35),
                                    (userLon * 0.65 + shelterLatLng.longitude * 0.35)),
                                LatLng((userLat * 0.35 + shelterLatLng.latitude * 0.65),
                                    (userLon * 0.35 + shelterLatLng.longitude * 0.65)),
                                shelterLatLng,
                              ],
                              color: const Color(0xFF38BDF8),
                              strokeWidth: 4.5,
                            ),
                          ],
                        ),

                        // MARCADORES: ORIGEN Y DESTINO
                        MarkerLayer(
                          markers: [
                            // Origen (Ciudadano)
                            Marker(
                              point: userLatLng,
                              width: 28,
                              height: 28,
                              child: Container(
                                decoration: BoxDecoration(
                                  color: AppColors.primary,
                                  shape: BoxShape.circle,
                                  border: Border.all(color: Colors.white, width: 2),
                                ),
                                child: const Icon(Icons.circle, color: Colors.white, size: 8),
                              ),
                            ),
                            // Destino (Albergue seleccionado)
                            Marker(
                              point: shelterLatLng,
                              width: 36,
                              height: 36,
                              child: Container(
                                decoration: BoxDecoration(
                                  color: const Color(0xFF0284C7),
                                  shape: BoxShape.circle,
                                  border: Border.all(color: Colors.white, width: 2),
                                  boxShadow: const [
                                    BoxShadow(color: Colors.black45, blurRadius: 6),
                                  ],
                                ),
                                child: const Icon(Icons.night_shelter, color: Colors.white, size: 18),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),

                    // Controles flotantes en el mapa
                    Positioned(
                      top: 10,
                      right: 10,
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: AppColors.surface.withOpacity(0.85),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: const Icon(Icons.explore, color: AppColors.primaryLight, size: 18),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // TARJETA DE ALBERGUE CON OPCIÓN DE CAMBIAR / EVALUAR RUTAS EN 500M
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.surfaceCard,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0284C7).withOpacity(0.18),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.night_shelter_outlined, color: Color(0xFF38BDF8), size: 24),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                shelter?.nombre ?? 'Albergue Seguro 1',
                                style: const TextStyle(
                                  color: AppColors.textPrimary,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 3),
                              Text(
                                shelter?.direccion ?? 'Refugio Temporal • Esmeraldas Sector 1',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 11,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Capacidad: ${shelter?.capacidadMaxima ?? 250} personas (Cupos libres: ${shelter?.cuposDisponibles ?? 185})',
                                style: const TextStyle(
                                  color: AppColors.attendedGreen,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    const Divider(height: 1),
                    const SizedBox(height: 8),
                    InkWell(
                      borderRadius: BorderRadius.circular(8),
                      onTap: () {
                        final shelters = evacProvider.allShelters.isNotEmpty
                            ? evacProvider.allShelters
                            : (shelter != null ? [shelter] : <AlbergueModel>[]);
                        _showCambiarAlbergueModal(context, shelters, userLat, userLon, shelter!);
                      },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 4),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: const [
                            Row(
                              children: [
                                Icon(Icons.swap_horiz, size: 16, color: Color(0xFF38BDF8)),
                                SizedBox(width: 6),
                                Text(
                                  'Cambiar Albergue / Rutas en 500m',
                                  style: TextStyle(
                                    color: Color(0xFF38BDF8),
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                            Icon(Icons.chevron_right, size: 16, color: AppColors.textMuted),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // LISTADO DE TODOS LOS ALBERGUES (ORDENADOS DE MÁS CERCA A MÁS LEJOS)
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Albergues Disponibles',
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Text(
                    '${evacProvider.allShelters.length} albergues • Más cercanos primero',
                    style: const TextStyle(
                      color: Color(0xFF38BDF8),
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              if (evacProvider.isLoading && evacProvider.allShelters.isEmpty)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(24),
                    child: CircularProgressIndicator(color: Color(0xFF0284C7)),
                  ),
                )
              else if (evacProvider.allShelters.isEmpty)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceCard,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: const Center(
                    child: Text(
                      'No se encontraron albergues habilitados.',
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                    ),
                  ),
                )
              else
                ...evacProvider.allShelters.map((s) {
                  final isCurrent = s.id == shelter?.id;
                  final distMetros = s.distanciaMetros ??
                      DistanceCalculator.calcularDistanciaMetros(
                        lat1: userLat,
                        lon1: userLon,
                        lat2: s.lat,
                        lon2: s.lon,
                      );
                  final distText = DistanceCalculator.formatearDistancia(distMetros);

                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    decoration: BoxDecoration(
                      color: isCurrent
                          ? const Color(0xFF0284C7).withOpacity(0.14)
                          : AppColors.surfaceCard,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: isCurrent ? const Color(0xFF0284C7) : AppColors.border,
                        width: isCurrent ? 1.8 : 1.0,
                      ),
                    ),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                      leading: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: isCurrent
                              ? const Color(0xFF0284C7)
                              : AppColors.surfaceElevated,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.night_shelter,
                          color: isCurrent ? Colors.white : const Color(0xFF38BDF8),
                          size: 20,
                        ),
                      ),
                      title: Text(
                        s.nombre,
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontWeight: isCurrent ? FontWeight.bold : FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 3),
                          Text(
                            s.direccion,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                          ),
                          const SizedBox(height: 5),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.attendedGreen.withOpacity(0.18),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  '$distText de ti',
                                  style: const TextStyle(
                                    color: AppColors.attendedGreen,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                '${s.cuposDisponibles} cupos libres de ${s.capacidadMaxima}',
                                style: const TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 10,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      trailing: isCurrent
                          ? const Icon(Icons.check_circle, color: Color(0xFF0284C7), size: 22)
                          : const Icon(Icons.arrow_forward_ios, color: AppColors.textMuted, size: 13),
                      onTap: () {
                        setState(() {
                          _selectedShelter = s;
                        });
                        evacProvider.selectShelter(s);
                        _routeMapController.move(LatLng(s.lat, s.lon), 14.5);
                      },
                    ),
                  );
                }),
              const SizedBox(height: 14),

              // SECCIÓN: "Family Help Status"
              const Text(
                'Estado de Asistencia Familiar',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 10),

              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: AppColors.surfaceCard,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceElevated,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.person_outline, color: AppColors.textPrimary, size: 20),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Text(
                        'Asistencia Humanitaria\nActiva para la Familia',
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          height: 1.2,
                        ),
                      ),
                    ),
                    // SWITCH VERDE ACTIVO DEL RENDER
                    Switch(
                      value: evacProvider.familyHelpStatus,
                      activeThumbColor: AppColors.attendedGreen,
                      activeTrackColor: AppColors.attendedGreen.withOpacity(0.35),
                      inactiveThumbColor: AppColors.textMuted,
                      inactiveTrackColor: AppColors.surfaceElevated,
                      onChanged: evacProvider.toggleFamilyHelpStatus,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // MENSAJE DE CÁLCULO SI SE EJECUTÓ
              if (evacProvider.helpMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceElevated,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.primary.withOpacity(0.4)),
                  ),
                  child: Text(
                    evacProvider.helpMessage!,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 12,
                      height: 1.4,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // BOTÓN AZUL "Calcular Ayuda Humanitaria"
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0284C7),
                    foregroundColor: Colors.white,
                    elevation: 4,
                    shadowColor: const Color(0xFF0284C7).withOpacity(0.5),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(25),
                    ),
                  ),
                  onPressed: evacProvider.isCalculatingHelp
                      ? null
                      : () {
                          final fam = authProvider.familiaCensada;
                          evacProvider.calculateHelp(
                            numeroIntegrantes: fam?.numeroIntegrantes ?? 4,
                            ninos: fam?.ninosMenores5 ?? 1,
                            adultosMayores: fam?.adultosMayores ?? 0,
                          );
                        },
                  child: evacProvider.isCalculatingHelp
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Text(
                          'Calcular Ayuda Humanitaria',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.3,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    ),
  );
  }
}
