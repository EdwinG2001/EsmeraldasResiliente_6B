import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/censo_provider.dart';
import '../../services/location/location_service.dart';
import '../../widgets/crisis_button.dart';
import '../auth/login_screen.dart';
import 'ciudadano_dashboard_screen.dart';
import 'emitir_emergencia_screen.dart';

class NoCensadoScreen extends StatefulWidget {
  final String cedulaConsultada;

  const NoCensadoScreen({
    Key? key,
    required this.cedulaConsultada,
  }) : super(key: key);

  @override
  State<NoCensadoScreen> createState() => _NoCensadoScreenState();
}

class _NoCensadoScreenState extends State<NoCensadoScreen>
    with SingleTickerProviderStateMixin {
  bool _isChecking = false;
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

  Future<void> _recheckStatus() async {
    setState(() => _isChecking = true);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    await authProvider.verificarEstadoCenso(widget.cedulaConsultada);

    setState(() => _isChecking = false);

    if (!mounted) return;

    if (authProvider.esCensado) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const CiudadanoDashboardScreen()),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Aún no figura en el padrón censal de Esmeraldas. Las brigadas continúan en territorio.'),
          backgroundColor: AppColors.riskYellow,
        ),
      );
    }
  }

  Future<void> _solicitarVisitaBrigadista() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final censoProvider = Provider.of<CensoProvider>(context, listen: false);

    final user = authProvider.user;
    final nombre = user?.nombreCompleto ?? 'Ciudadano Solicitante';
    final cedula = widget.cedulaConsultada.isNotEmpty
        ? widget.cedulaConsultada
        : (user?.cedula ?? '0800000000');
    final telefono = user?.telefono ?? '';
    final sector = user?.barrioSector ?? 'Esmeraldas';

    double? lat;
    double? lon;
    try {
      final pos = await LocationService.getCurrentPosition();
      if (pos != null) {
        lat = pos.latitude;
        lon = pos.longitude;
      }
    } catch (_) {}

    final success = await censoProvider.solicitarVisitaCenso(
      nombre: nombre,
      cedula: cedula,
      telefono: telefono,
      sector: sector,
      lat: lat,
      lon: lon,
    );

    if (!mounted) return;

    if (success) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          icon: const Icon(Icons.support_agent, color: AppColors.primary, size: 40),
          title: const Text('Solicitud Enviada al COE'),
          content: const Text(
            'Su sector y cédula han sido agregados a la hoja de ruta de los censadores y brigadistas municipales. Un encuestador visitará su vivienda en las próximas 48 horas.',
            style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
          ),
          actions: [
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Entendido'),
            ),
          ],
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No se pudo sincronizar la solicitud con el servidor COE. Verifique su conexión e intente nuevamente.'),
          backgroundColor: AppColors.emergencyRed,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final nombre = authProvider.user?.nombreCompleto ?? 'Estimado Ciudadano';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Estado en el Padrón Censal'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Cerrar Sesión',
            onPressed: () async {
              await authProvider.logout();
              if (context.mounted) {
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              }
            },
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ENCABEZADO "ALERT" (ESTILO RENDER PHONE 1)
              const Text(
                'ALERT:',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: AppColors.riskYellow,
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Aún usted no ha sido censado\nen el sistema de gestión de riesgos',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  height: 1.3,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Sistema de Gestión de Alertas y Padrón Censal de Esmeraldas.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textMuted, fontSize: 12),
              ),
              const SizedBox(height: 24),

              // ÍCONO DE ALERTA TRIÁNGULO AMARILLO/ÁMBAR CON PULSO
              ScaleTransition(
                scale: _pulseAnimation,
                child: Center(
                  child: Container(
                    width: 130,
                    height: 130,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.riskYellow.withOpacity(0.2),
                          blurRadius: 30,
                          spreadRadius: 6,
                        ),
                      ],
                    ),
                    child: Center(
                      child: Container(
                        padding: const EdgeInsets.all(22),
                        decoration: BoxDecoration(
                          color: AppColors.riskYellow.withOpacity(0.12),
                          shape: BoxShape.circle,
                          border: Border.all(color: AppColors.riskYellow, width: 2.5),
                        ),
                        child: const Icon(
                          Icons.warning_amber_rounded,
                          color: AppColors.riskYellow,
                          size: 54,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Tarjeta informativa con datos del ciudadano
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surfaceCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.person, size: 18, color: AppColors.primary),
                        const SizedBox(width: 8),
                        Text(nombre, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.badge, size: 18, color: AppColors.textMuted),
                        const SizedBox(width: 8),
                        Text(
                          'Cédula consultada: ${widget.cedulaConsultada}',
                          style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                    const Divider(height: 20),
                    const Text(
                      'El padrón censal permite georreferenciar su vivienda, registrar a sus familiares vulnerables (niños, ancianos) y priorizar la entrega de kits de asistencia humanitaria y evacuación.',
                      style: TextStyle(color: AppColors.textMuted, fontSize: 12, height: 1.4),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Botón 1: Re-consultar
              CrisisButton(
                text: 'Volver a Consultar Padrón',
                icon: Icons.refresh,
                isLoading: _isChecking,
                variant: CrisisButtonVariant.primary,
                onPressed: _recheckStatus,
              ),
              const SizedBox(height: 12),

              // Botón 2: Solicitar Brigadista
              CrisisButton(
                text: 'Solicitar Visita de un Censador a mi Barrio',
                icon: Icons.hail_outlined,
                variant: CrisisButtonVariant.outline,
                onPressed: _solicitarVisitaBrigadista,
              ),
              const SizedBox(height: 20),

              // Opción de Emergencia Inmediata
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.floodRed,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                  ),
                  icon: const Icon(Icons.emergency, size: 18),
                  label: const Text(
                    'Emitir Alerta de Emergencia Inmediata',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const EmitirEmergenciaScreen()),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
