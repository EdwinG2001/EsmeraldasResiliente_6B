import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';
import '../core/utils/distance_calculator.dart';
import '../models/incidente_model.dart';

class IncidenteCard extends StatelessWidget {
  final IncidenteModel incidente;
  final VoidCallback? onTap;

  const IncidenteCard({
    Key? key,
    required this.incidente,
    this.onTap,
  }) : super(key: key);

  Color _getGravedadColor(String gravedad) {
    switch (gravedad.toUpperCase()) {
      case 'CRITICO':
        return AppColors.emergencyRed;
      case 'ALTO':
        return AppColors.warningOrange;
      case 'MEDIO':
        return AppColors.warningAmber;
      case 'BAJO':
      default:
        return AppColors.infoBlue;
    }
  }

  IconData _getEventoIcon(String tipo) {
    final t = tipo.toUpperCase();
    if (t.contains('INUNDA') || t.contains('NINO') || t.contains('AGUA')) {
      return Icons.flood_outlined;
    } else if (t.contains('DESL') || t.contains('TIERRA') || t.contains('LODO')) {
      return Icons.landslide_outlined;
    } else if (t.contains('COLAPSO') || t.contains('ESTRUCT')) {
      return Icons.home_work_outlined;
    }
    return Icons.warning_amber_rounded;
  }

  @override
  Widget build(BuildContext context) {
    final gravedadColor = _getGravedadColor(incidente.nivelGravedad);
    final distanciaStr = incidente.distanciaMetros != null
        ? DistanceCalculator.formatearDistancia(incidente.distanciaMetros!)
        : null;

    return Card(
      color: AppColors.surfaceCard,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: AppColors.border.withOpacity(0.8), width: 1),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Cabecera: Icono de Evento, Tipo y Pill de Distancia
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: gravedadColor.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(_getEventoIcon(incidente.tipoEvento), color: gravedadColor, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          incidente.tipoEvento.replaceAll('_', ' '),
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                              decoration: BoxDecoration(
                                color: gravedadColor.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                incidente.nivelGravedad.toUpperCase(),
                                style: TextStyle(
                                  color: gravedadColor,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              incidente.estado.replaceAll('_', ' '),
                              style: const TextStyle(
                                color: AppColors.textMuted,
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  if (distanciaStr != null) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceElevated,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.near_me, size: 12, color: AppColors.primary),
                          const SizedBox(width: 4),
                          Text(
                            distanciaStr,
                            style: const TextStyle(
                              color: AppColors.primaryLight,
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 12),
              // Descripción
              Text(
                incidente.descripcion,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 13,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 12),
              // Detalles comunitarios y footer
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      if (incidente.familiasAfectadas > 0) ...[
                        const Icon(Icons.people_outline, size: 14, color: AppColors.textMuted),
                        const SizedBox(width: 4),
                        Text(
                          '${incidente.familiasAfectadas} familias',
                          style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                        ),
                        const SizedBox(width: 12),
                      ],
                      if (incidente.personasAtrapadas > 0) ...[
                        const Icon(Icons.warning_amber, size: 14, color: AppColors.emergencyRed),
                        const SizedBox(width: 4),
                        Text(
                          '${incidente.personasAtrapadas} atrapados',
                          style: const TextStyle(color: AppColors.emergencyRed, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ],
                  ),
                  Text(
                    incidente.fechaIncidente.length >= 10
                        ? incidente.fechaIncidente.substring(0, 10)
                        : '',
                    style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
