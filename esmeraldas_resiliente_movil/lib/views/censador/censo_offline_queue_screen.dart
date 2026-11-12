import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/censo_provider.dart';
import '../../widgets/crisis_button.dart';

class CensoOfflineQueueScreen extends StatelessWidget {
  const CensoOfflineQueueScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final censoProvider = Provider.of<CensoProvider>(context);
    final offlineItems = censoProvider.offlineQueue;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Bandeja de Censos Offline'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.surfaceCard,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.warningOrange.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.storage_outlined, color: AppColors.warningOrange, size: 24),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${offlineItems.length} Fichas Censales Pendientes',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'Almacenadas en SQLite local debido a cortes de cobertura en campo.',
                            style: TextStyle(fontSize: 11, color: AppColors.textMuted),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              Expanded(
                child: offlineItems.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
                            Icon(Icons.cloud_done_outlined, size: 54, color: AppColors.successGreen),
                            SizedBox(height: 12),
                            Text(
                              'Todos los censos están sincronizados',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'No hay fichas pendientes en SQLite local.',
                              style: TextStyle(color: AppColors.textMuted, fontSize: 13),
                            ),
                          ],
                        ),
                      )
                    : ListView.separated(
                        itemCount: offlineItems.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (ctx, index) {
                          final item = offlineItems[index];
                          return Card(
                            color: AppColors.surfaceCard,
                            child: Padding(
                              padding: const EdgeInsets.all(14),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        item.jefeFamiliaNombre,
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: AppColors.surfaceElevated,
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          item.codigoCenso,
                                          style: const TextStyle(fontSize: 10, color: AppColors.primaryLight, fontWeight: FontWeight.bold),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Row(
                                    children: [
                                      const Icon(Icons.badge_outlined, size: 13, color: AppColors.textMuted),
                                      const SizedBox(width: 4),
                                      Text('Cédula: ${item.jefeFamiliaCedula}', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                      const SizedBox(width: 14),
                                      const Icon(Icons.location_on_outlined, size: 13, color: AppColors.textMuted),
                                      const SizedBox(width: 4),
                                      Text(item.barrioSector, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      Text(
                                        'Integrantes: ${item.numeroIntegrantes} (Niños: ${item.ninosMenores5}, Ancianos: ${item.adultosMayores})',
                                        style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
              ),

              if (offlineItems.isNotEmpty) ...[
                const SizedBox(height: 16),
                CrisisButton(
                  text: 'Sincronizar Todas las Fichas Ahora',
                  icon: Icons.sync,
                  isLoading: censoProvider.isSyncing,
                  onPressed: () async {
                    final synced = await censoProvider.sincronizarPendientesOffline();
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('$synced fichas sincronizadas exitosamente con PostGIS.'),
                          backgroundColor: AppColors.successGreen,
                        ),
                      );
                    }
                  },
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
