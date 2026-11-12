import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../emitir_emergencia_screen.dart';

class CitizenAlertTab extends StatefulWidget {
  final VoidCallback onOpenDrawer;

  const CitizenAlertTab({
    Key? key,
    required this.onOpenDrawer,
  }) : super(key: key);

  @override
  State<CitizenAlertTab> createState() => _CitizenAlertTabState();
}

class _CitizenAlertTabState extends State<CitizenAlertTab>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 0.95, end: 1.05).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.menu, color: AppColors.textPrimary, size: 24),
          onPressed: widget.onOpenDrawer,
        ),
        title: const Text(
          'Sistema de Alertas Ciudadanas',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 17,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.3,
          ),
        ),
        centerTitle: true,
        actions: [
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_none_outlined, color: AppColors.textPrimary, size: 22),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Alerta Temprana COE: Nivel del Río Teaone en cota de prevención.'),
                      backgroundColor: AppColors.surfaceElevated,
                    ),
                  );
                },
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
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 8),

              // ENCABEZADO DE ALERTA DE EMERGENCIA
              Column(
                children: const [
                  Text(
                    'REPORTE CIUDADANO EN VIVO:',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: AppColors.floodRed,
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.2,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    '¿Tienes una emergencia?\nEnseguida házmelo saber',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      height: 1.25,
                      letterSpacing: 0.3,
                    ),
                  ),
                  SizedBox(height: 10),
                  Text(
                    'Inundaciones, deslaves, colapsos estructurales o rescate: dale en "Emitir Reporte de Emergencia".',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 12,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ],
              ),

              // ÍCONO GIGANTE DE ALERTA TRIÁNGULO CON PULSO (FIEL AL RENDER)
              ScaleTransition(
                scale: _pulseAnimation,
                child: Container(
                  width: 210,
                  height: 210,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.floodRed.withOpacity(0.25),
                        blurRadius: 40,
                        spreadRadius: 8,
                      ),
                    ],
                  ),
                  child: Center(
                    child: CustomPaint(
                      size: const Size(160, 140),
                      painter: _GlowingTrianglePainter(),
                    ),
                  ),
                ),
              ),

              // TEXTO DESCRIPTIVO
              Column(
                children: [
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      'Reporte incidentes comunitarios para movilizar a Bomberos, Gestión de Riesgos y auxilio humanitario del COE.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                        height: 1.45,
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // BOTÓN ROJO DE EMERGENCIA 'Report Incident' (FIEL AL RENDER PHONE 1)
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.floodRed,
                        foregroundColor: Colors.white,
                        elevation: 6,
                        shadowColor: AppColors.floodRed.withOpacity(0.5),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(26),
                        ),
                      ),
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const EmitirEmergenciaScreen()),
                        );
                      },
                      child: const Text(
                        'Emitir Reporte de Emergencia',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Dibuja el triángulo de emergencia con doble trazo y signo de exclamación brillante
class _GlowingTrianglePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final double w = size.width;
    final double h = size.height;

    final path = Path()
      ..moveTo(w / 2, 4)
      ..lineTo(w - 6, h - 8)
      ..lineTo(6, h - 8)
      ..close();

    // Sombra de brillo
    final glowPaint = Paint()
      ..color = AppColors.floodRed.withOpacity(0.4)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 14
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 10);

    canvas.drawPath(path, glowPaint);

    // Trazo exterior rojo
    final strokePaint = Paint()
      ..color = AppColors.floodRed
      ..style = PaintingStyle.stroke
      ..strokeWidth = 7
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    canvas.drawPath(path, strokePaint);

    // Relleno tenue interno
    final fillPaint = Paint()
      ..color = AppColors.floodRed.withOpacity(0.12)
      ..style = PaintingStyle.fill;

    canvas.drawPath(path, fillPaint);

    // Signo de exclamación central
    final exclamPaint = Paint()
      ..color = AppColors.floodRed
      ..strokeWidth = 6.5
      ..strokeCap = StrokeCap.round;

    // Barra superior
    canvas.drawLine(
      Offset(w / 2, h * 0.38),
      Offset(w / 2, h * 0.68),
      exclamPaint,
    );

    // Punto inferior
    canvas.drawCircle(
      Offset(w / 2, h * 0.82),
      3.5,
      Paint()..color = AppColors.floodRed,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
