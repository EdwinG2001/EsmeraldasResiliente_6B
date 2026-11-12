import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../core/constants/app_colors.dart';

class GpsBadge extends StatelessWidget {
  final Position? position;
  final bool isCapturing;
  final VoidCallback onCapturePressed;

  const GpsBadge({
    Key? key,
    required this.position,
    required this.isCapturing,
    required this.onCapturePressed,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final bool hasFix = position != null;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: hasFix ? AppColors.primary : AppColors.border,
          width: hasFix ? 1.5 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: hasFix ? AppColors.primaryGlow : AppColors.surfaceElevated,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  hasFix ? Icons.gps_fixed : Icons.gps_not_fixed,
                  color: hasFix ? AppColors.primary : AppColors.textMuted,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      hasFix ? 'Geolocalización Fijada (PostGIS SRID 4326)' : 'Coordenadas GPS no capturadas',
                      style: TextStyle(
                        color: hasFix ? AppColors.textPrimary : AppColors.textSecondary,
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      hasFix
                          ? 'Precisión satelital: ±${position!.accuracy.toStringAsFixed(1)} metros'
                          : 'Pulse el botón para fijar el predio con el GPS del dispositivo.',
                      style: const TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (hasFix) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.surfaceElevated,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Text('LAT: ', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.bold)),
                      Text(position!.latitude.toStringAsFixed(6), style: const TextStyle(color: AppColors.primaryLight, fontSize: 13, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  Row(
                    children: [
                      const Text('LON: ', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.bold)),
                      Text(position!.longitude.toStringAsFixed(6), style: const TextStyle(color: AppColors.primaryLight, fontSize: 13, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: isCapturing ? null : onCapturePressed,
              icon: isCapturing
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                    )
                  : Icon(hasFix ? Icons.refresh : Icons.my_location, size: 18),
              label: Text(
                isCapturing
                    ? 'Adquiriendo señal GPS...'
                    : (hasFix ? 'Actualizar Coordenadas GPS' : 'Capturar Ubicación GPS del Predio'),
              ),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primary,
                side: const BorderSide(color: AppColors.primary),
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
