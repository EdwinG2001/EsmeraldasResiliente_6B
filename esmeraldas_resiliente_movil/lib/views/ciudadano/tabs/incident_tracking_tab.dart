import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/distance_calculator.dart';
import '../../../models/incidente_model.dart';
import '../../../providers/incidentes_provider.dart';

class IncidentTrackingTab extends StatefulWidget {
  final VoidCallback onOpenDrawer;

  const IncidentTrackingTab({
    Key? key,
    required this.onOpenDrawer,
  }) : super(key: key);

  @override
  State<IncidentTrackingTab> createState() => _IncidentTrackingTabState();
}

class _IncidentTrackingTabState extends State<IncidentTrackingTab> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedSectorFilter = 'Todos';
  String _selectedEstadoFilter = 'Activos (Pendientes / En Proceso)';

  final List<String> _estados = [
    'Activos (Pendientes / En Proceso)',
    'Todos (Incluye Atendidos)',
    'Solo Atendidos',
  ];

  final List<String> _sectores = [
    'Todos',
    'Este',
    'Oeste',
    'Centro',
    'Ribera del Teaone',
    'Las Palmas',
    '50 Casas',
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final incidentesProvider = Provider.of<IncidentesProvider>(context);
    var items = incidentesProvider.incidentes;

    // Filtrado por estado de atención
    if (_selectedEstadoFilter == 'Activos (Pendientes / En Proceso)') {
      items = items.where((i) {
        final st = i.estado.toUpperCase();
        return st != 'ATENDIDO' && st != 'DESCARTADO' && st != 'RESUELTO';
      }).toList();
    } else if (_selectedEstadoFilter == 'Solo Atendidos') {
      items = items.where((i) {
        final st = i.estado.toUpperCase();
        return st == 'ATENDIDO' || st == 'RESUELTO';
      }).toList();
    }

    // Filtrado por texto de búsqueda
    final searchQuery = _searchController.text.trim().toLowerCase();
    if (searchQuery.isNotEmpty) {
      items = items.where((i) {
        return i.descripcion.toLowerCase().contains(searchQuery) ||
            i.tipoEvento.toLowerCase().contains(searchQuery) ||
            (i.usuarioNombre?.toLowerCase().contains(searchQuery) ?? false);
      }).toList();
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
          'Seguimiento de Incidentes COE',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 17,
            fontWeight: FontWeight.w700,
          ),
        ),
        centerTitle: true,
        actions: [
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_none_outlined, color: AppColors.textPrimary, size: 22),
                onPressed: () {},
              ),
              Positioned(
                right: 12,
                top: 14,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: AppColors.criticalRed,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // BARRA DE BÚSQUEDA Y FILTRO "Este ▼" (FIEL AL RENDER PHONE 3)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              color: AppColors.surface,
              child: Row(
                children: [
                  // Campo de Búsqueda
                  Expanded(
                    child: Container(
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.surfaceElevated,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: TextField(
                        controller: _searchController,
                        onChanged: (_) => setState(() {}),
                        style: const TextStyle(color: AppColors.textPrimary, fontSize: 13),
                        decoration: const InputDecoration(
                          hintText: 'Buscar incidentes o sectores...',
                          hintStyle: TextStyle(color: AppColors.textMuted, fontSize: 13),
                          prefixIcon: Icon(Icons.search, size: 18, color: AppColors.textMuted),
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.symmetric(vertical: 10),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),

                  // Menú Filtro Sectorial "Este ▼"
                  Container(
                    height: 40,
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceElevated,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _selectedSectorFilter,
                        dropdownColor: AppColors.surfaceCard,
                        icon: const Icon(Icons.arrow_drop_down, color: AppColors.textMuted, size: 18),
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                        items: _sectores.map((s) {
                          return DropdownMenuItem<String>(
                            value: s,
                            child: Text(s),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedSectorFilter = val);
                        },
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // BARRA DE FILTRO DE ESTADO DE ATENCIÓN
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              color: AppColors.surface,
              child: Row(
                children: [
                  const Icon(Icons.tune, size: 16, color: AppColors.textMuted),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Container(
                      height: 36,
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceElevated,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _selectedEstadoFilter,
                          isExpanded: true,
                          dropdownColor: AppColors.surfaceCard,
                          icon: const Icon(Icons.arrow_drop_down, color: AppColors.textMuted, size: 18),
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                          items: _estados.map((e) {
                            return DropdownMenuItem<String>(
                              value: e,
                              child: Text(e),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) setState(() => _selectedEstadoFilter = val);
                          },
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // LISTADO DE REPORTES GEORREFERENCIADOS (CARDS DEL RENDER PHONE 3)
            Expanded(
              child: RefreshIndicator(
                onRefresh: () async {
                  await incidentesProvider.loadIncidentesYZonas();
                },
                child: items.isEmpty
                    ? Center(
                        child: SingleChildScrollView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.all(28),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                _selectedEstadoFilter == 'Activos (Pendientes / En Proceso)'
                                    ? Icons.verified_user_outlined
                                    : Icons.radar,
                                size: 54,
                                color: _selectedEstadoFilter == 'Activos (Pendientes / En Proceso)'
                                    ? AppColors.attendedGreen
                                    : AppColors.primary,
                              ),
                              const SizedBox(height: 14),
                              Text(
                                _selectedEstadoFilter == 'Activos (Pendientes / En Proceso)'
                                    ? '¡Territorio Seguro y Despejado!'
                                    : 'Sin reportes coincidentes',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                _selectedEstadoFilter == 'Activos (Pendientes / En Proceso)'
                                    ? 'No existen emergencias pendientes ni en proceso.\nTodos los incidentes reportados ya fueron atendidos por el COE.\n\nPuedes seleccionar "Todos (Incluye Atendidos)" arriba para consultar el registro histórico de incidentes.'
                                    : 'No se encontraron reportes con los criterios de búsqueda.',
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 12,
                                  height: 1.45,
                                ),
                              ),
                            ],
                          ),
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        itemCount: items.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (ctx, index) {
                          final inc = items[index];
                          return _buildTrackingCard(inc, index);
                        },
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTrackingCard(IncidenteModel inc, int index) {
    final st = inc.estado.toUpperCase();
    final isAttended = st == 'ATENDIDO' || st == 'RESUELTO';
    final isProcess = st == 'EN_PROCESO' || st == 'EN_ATENCION';
    final isCritical = inc.nivelGravedad.toUpperCase() == 'CRITICO';

    final Color statusColor = isAttended
        ? AppColors.attendedGreen
        : (isProcess
            ? const Color(0xFF38BDF8)
            : (isCritical ? AppColors.floodRed : AppColors.riskYellow));

    final IconData statusIcon = isAttended
        ? Icons.check_circle_outline
        : (isProcess ? Icons.sync : Icons.location_on);

    final distanceStr = inc.distanciaMetros != null
        ? DistanceCalculator.formatearDistancia(inc.distanciaMetros!)
        : 'Esmeraldas';

    final timeStr = inc.tiempoRelativo;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Pin / Status Icon
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(statusIcon, color: statusColor, size: 20),
          ),
          const SizedBox(width: 12),

          // Información Central
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  inc.descripcion.isNotEmpty ? inc.descripcion : 'Reporte Georreferenciado',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  '${inc.tipoEvento.replaceAll('_', ' ')} • ${inc.usuarioNombre != null && inc.usuarioNombre!.isNotEmpty ? "Por: ${inc.usuarioNombre}" : "Ciudadano"}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 11,
                  ),
                ),
                const SizedBox(height: 6),

                // Pills de Estado: Atendido / En Proceso / Crítico
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        isAttended
                            ? 'ATENDIDO'
                            : (isProcess ? 'EN PROCESO' : 'PENDIENTE (${inc.nivelGravedad})'),
                        style: TextStyle(
                          color: statusColor,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '• $distanceStr de ti',
                      style: const TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 10,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Timestamp a la derecha en vivo
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.surfaceElevated,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              timeStr,
              style: const TextStyle(
                color: AppColors.textMuted,
                fontSize: 10,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
