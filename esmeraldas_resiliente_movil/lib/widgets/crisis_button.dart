import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';

enum CrisisButtonVariant {
  primary,
  emergency,
  outline,
  secondary,
}

class CrisisButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final IconData? icon;
  final CrisisButtonVariant variant;
  final double? width;
  final double height;

  const CrisisButton({
    Key? key,
    required this.text,
    required this.onPressed,
    this.isLoading = false,
    this.icon,
    this.variant = CrisisButtonVariant.primary,
    this.width,
    this.height = 54,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    Gradient? gradient;
    Color? solidColor;
    Color textColor = Colors.white;
    Border? border;

    switch (variant) {
      case CrisisButtonVariant.primary:
        gradient = AppColors.primaryGradient;
        break;
      case CrisisButtonVariant.emergency:
        gradient = AppColors.emergencyGradient;
        break;
      case CrisisButtonVariant.outline:
        solidColor = Colors.transparent;
        textColor = AppColors.primary;
        border = Border.all(color: AppColors.primary, width: 1.5);
        break;
      case CrisisButtonVariant.secondary:
        solidColor = AppColors.surfaceElevated;
        textColor = AppColors.textPrimary;
        border = Border.all(color: AppColors.border, width: 1);
        break;
    }

    return Container(
      width: width ?? double.infinity,
      height: height,
      decoration: BoxDecoration(
        gradient: onPressed != null ? gradient : null,
        color: onPressed == null ? AppColors.surfaceElevated : solidColor,
        borderRadius: BorderRadius.circular(14),
        border: border,
        boxShadow: variant == CrisisButtonVariant.emergency && onPressed != null
            ? [
                BoxShadow(
                  color: AppColors.emergencyRedGlow,
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                )
              ]
            : variant == CrisisButtonVariant.primary && onPressed != null
                ? [
                    BoxShadow(
                      color: AppColors.primaryGlow,
                      blurRadius: 14,
                      offset: const Offset(0, 4),
                    )
                  ]
                : null,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: isLoading ? null : onPressed,
          child: Center(
            child: isLoading
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (icon != null) ...[
                        Icon(icon, color: textColor, size: 20),
                        const SizedBox(width: 10),
                      ],
                      Text(
                        text,
                        style: TextStyle(
                          color: textColor,
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}
