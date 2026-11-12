import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/ecuador_validators.dart';
import '../../providers/auth_provider.dart';
import '../../providers/censo_provider.dart';
import '../../widgets/crisis_button.dart';
import '../../widgets/custom_text_field.dart';
import '../../widgets/gps_badge.dart';
import '../../widgets/vulnerability_counter.dart';
import '../auth/login_screen.dart';
import '../ciudadano/ciudadano_dashboard_screen.dart';
import 'censo_offline_queue_screen.dart';

class CensoFormScreen extends StatefulWidget {
  const CensoFormScreen({Key? key}) : super(key: key);

  @override
  State<CensoFormScreen> createState() => _CensoFormScreenState();
}

class _CensoFormScreenState extends State<CensoFormScreen> {
  final _formKey = GlobalKey<FormState>();

  final _nombreJefeController = TextEditingController();
  final _cedulaJefeController = TextEditingController();
  final _celularController = TextEditingController();
  final _barrioSectorController = TextEditingController();
  final _direccionReferenciaController = TextEditingController();

  // Lista de barrios comunes de Esmeraldas para autocompletado rápido
  final List<String> _barriosEsmeraldas = [
    'Ribera del Teaone',
    'Las Palmas',
    '50 Casas',
    'San Rafael',
    'Propicia 1',
    'Propicia 2',
    'Propicia 4',
    'Isla Piedad',
    'Barrio Caliente',
    'Codesa',
    'Vuelta Larga',
    'Tachina',
    'San Mateo',
    'Tolita 1',
    'Tolita 2',
  ];

  @override
  void dispose() {
    _nombreJefeController.dispose();
    _cedulaJefeController.dispose();
    _celularController.dispose();
    _barrioSectorController.dispose();
    _direccionReferenciaController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmitCenso() async {
    if (!_formKey.currentState!.validate()) return;

    final censoProvider = Provider.of<CensoProvider>(context, listen: false);

    // Advertencia si no se ha capturado GPS
    if (censoProvider.currentGpsPosition == null) {
      final bool continuar = await showDialog(
            context: context,
            builder: (ctx) => AlertDialog(
              title: const Text('Coordenadas GPS no fijadas'),
              content: const Text(
                'No ha capturado la geolocalización satelital del predio. ¿Desea registrar con la ubicación por defecto del Cantón Esmeraldas o capturar GPS ahora?',
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx, false),
                  child: const Text('Capturar GPS Ahora'),
                ),
                ElevatedButton(
                  onPressed: () => Navigator.pop(ctx, true),
                  child: const Text('Continuar'),
                ),
              ],
            ),
          ) ??
          false;

      if (!continuar) {
        await censoProvider.capturarGps();
        return;
      }
    }

    final result = await censoProvider.submitCenso(
      nombreJefe: _nombreJefeController.text,
      cedulaJefe: _cedulaJefeController.text,
      celular: _celularController.text,
      barrioSector: _barrioSectorController.text,
      direccionReferencia: _direccionReferenciaController.text,
    );

    if (!mounted) return;

    if (result['success'] == true) {
      _nombreJefeController.clear();
      _cedulaJefeController.clear();
      _celularController.clear();
      _direccionReferenciaController.clear();

      final bool isOnline = result['online'] == true;

      // Diálogo de confirmación de éxito
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          icon: Icon(
            isOnline ? Icons.check_circle : Icons.cloud_off,
            color: isOnline ? AppColors.successGreen : AppColors.warningAmber,
            size: 48,
          ),
          title: Text(
            isOnline ? '¡Ficha Censal Registrada!' : '¡Guardado en SQLite Offline!',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                result['mensaje'],
                style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.surfaceElevated,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Text('Código de Ficha: ', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    Text(result['codigo'] ?? '', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 13)),
                  ],
                ),
              ),
            ],
          ),
          actions: [
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Registrar Siguiente Hogar'),
            ),
          ],
        ),
      );
    }
  }

  void _mostrarModalSolicitudes(BuildContext context) {
    final censoProvider = Provider.of<CensoProvider>(context, listen: false);
    censoProvider.loadSolicitudes(estado: 'PENDIENTE');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.7,
          minChildSize: 0.4,
          maxChildSize: 0.9,
          expand: false,
          builder: (_, scrollController) {
            return Consumer<CensoProvider>(
              builder: (_, provider, __) {
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          margin: const EdgeInsets.only(bottom: 12),
                          decoration: BoxDecoration(
                            color: AppColors.border,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.schedule, color: AppColors.riskYellow, size: 20),
                              SizedBox(width: 8),
                              Text(
                                'Solicitudes de Censo (48h)',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                            ],
                          ),
                          IconButton(
                            icon: const Icon(Icons.refresh, size: 20),
                            onPressed: () => provider.loadSolicitudes(estado: 'PENDIENTE'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Familias que han solicitado la visita de un censador municipal.',
                        style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                      const SizedBox(height: 12),
                      if (provider.isLoadingSolicitudes)
                        const Expanded(
                          child: Center(
                            child: CircularProgressIndicator(color: AppColors.primary),
                          ),
                        )
                      else if (provider.solicitudes.isEmpty)
                        const Expanded(
                          child: Center(
                            child: Text(
                              'No hay solicitudes pendientes en este momento.',
                              style: TextStyle(color: AppColors.textMuted, fontSize: 13),
                            ),
                          ),
                        )
                      else
                        Expanded(
                          child: ListView.separated(
                            controller: scrollController,
                            itemCount: provider.solicitudes.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 10),
                            itemBuilder: (_, index) {
                              final sol = provider.solicitudes[index];
                              return Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: AppColors.surfaceElevated,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: AppColors.border),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Expanded(
                                          child: Text(
                                            sol.jefeFamiliaNombre,
                                            style: const TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 14,
                                              color: AppColors.textPrimary,
                                            ),
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                          decoration: BoxDecoration(
                                            color: AppColors.riskYellow.withOpacity(0.15),
                                            borderRadius: BorderRadius.circular(8),
                                            border: Border.all(color: AppColors.riskYellow.withOpacity(0.4)),
                                          ),
                                          child: const Text(
                                            '48h Pendiente',
                                            style: TextStyle(
                                              color: AppColors.riskYellow,
                                              fontSize: 10,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'CI: ${sol.jefeFamiliaCedula} • Tel: ${sol.telefonoContacto ?? "S/N"}',
                                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                    ),
                                    Text(
                                      'Sector: ${sol.barrioSector}',
                                      style: const TextStyle(fontSize: 12, color: AppColors.primaryLight),
                                    ),
                                    if (sol.direccionReferencia != null && sol.direccionReferencia!.isNotEmpty)
                                      Text(
                                        'Ref: ${sol.direccionReferencia}',
                                        style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                                      ),
                                    const SizedBox(height: 10),
                                    SizedBox(
                                      width: double.infinity,
                                      child: ElevatedButton.icon(
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: AppColors.primary,
                                          foregroundColor: Colors.white,
                                          padding: const EdgeInsets.symmetric(vertical: 8),
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                        ),
                                        icon: const Icon(Icons.edit_note, size: 18),
                                        label: const Text(
                                          'Prellenar y Censar este Hogar',
                                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                                        ),
                                        onPressed: () {
                                          setState(() {
                                            _nombreJefeController.text = sol.jefeFamiliaNombre;
                                            _cedulaJefeController.text = sol.jefeFamiliaCedula;
                                            _celularController.text = sol.telefonoContacto ?? '';
                                            _barrioSectorController.text = sol.barrioSector;
                                            _direccionReferenciaController.text = sol.direccionReferencia ?? '';
                                          });
                                          Navigator.pop(ctx);
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            SnackBar(
                                              content: Text('Datos de ${sol.jefeFamiliaNombre} prellenados.'),
                                              backgroundColor: AppColors.primary,
                                            ),
                                          );
                                        },
                                      ),
                                    ),
                                  ],
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
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final censoProvider = Provider.of<CensoProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Ficha Censal de Hogar'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => const LoginScreen()),
          ),
        ),
        actions: [
          // Botón de Solicitudes de Censo (48h) asignadas a territorio
          IconButton(
            icon: const Icon(Icons.assignment_outlined, color: AppColors.riskYellow),
            tooltip: 'Solicitudes de Censo (48h)',
            onPressed: () => _mostrarModalSolicitudes(context),
          ),
          IconButton(
            icon: const Icon(Icons.phone_android, color: AppColors.primaryLight, size: 20),
            tooltip: 'Ver Mockup Ciudadano',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const CiudadanoDashboardScreen()),
              );
            },
          ),
          // Badge indicador de censos pendientes en SQLite
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.cloud_upload_outlined),
                tooltip: 'Censos pendientes en cola offline',
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const CensoOfflineQueueScreen()),
                  );
                },
              ),
              if (censoProvider.pendingOfflineCount > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: AppColors.emergencyRed,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                    child: Text(
                      '${censoProvider.pendingOfflineCount}',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.logout, size: 20),
            tooltip: 'Cerrar Sesión Brigadista',
            onPressed: () async {
              await authProvider.logout();
              if (mounted) {
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
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Cabecera institucional
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
                          color: AppColors.primaryGlow,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.assignment_outlined, color: AppColors.primary, size: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Padrón de Familias Afectadas',
                              style: TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Digitalizador: ${authProvider.user?.nombreCompleto ?? 'Agente Territorial'} (${authProvider.user?.rol ?? 'DIGITALIZADOR'})',
                              style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // SECCIÓN 1: DATOS DEL JEFE DE HOGAR
                const Text(
                  '1. Identificación del Jefe de Hogar',
                  style: TextStyle(
                    color: AppColors.primaryLight,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 12),

                CustomTextField(
                  controller: _nombreJefeController,
                  label: 'Nombre Completo del Jefe de Hogar',
                  hint: 'Ej. Carlos Alberto Minda Bone',
                  prefixIcon: Icons.person_outline,
                  validator: (v) => EcuadorValidators.validarRequerido(v, 'Nombre del Jefe'),
                ),
                const SizedBox(height: 14),

                CustomTextField(
                  controller: _cedulaJefeController,
                  label: 'Cédula de Identidad (10 dígitos)',
                  hint: 'Ej. 0801234567',
                  keyboardType: TextInputType.number,
                  prefixIcon: Icons.badge_outlined,
                  validator: EcuadorValidators.validarCedula,
                ),
                const SizedBox(height: 14),

                CustomTextField(
                  controller: _celularController,
                  label: 'Teléfono Celular de Contacto',
                  hint: 'Ej. 0991234567',
                  keyboardType: TextInputType.phone,
                  prefixIcon: Icons.phone_android_outlined,
                  validator: EcuadorValidators.validarTelefonoCelular,
                ),
                const SizedBox(height: 22),

                // SECCIÓN 2: UBICACIÓN Y SECTOR
                const Text(
                  '2. Localización y Barrio',
                  style: TextStyle(
                    color: AppColors.primaryLight,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 12),

                CustomTextField(
                  controller: _barrioSectorController,
                  label: 'Barrio o Sector',
                  hint: 'Ej. Ribera del Teaone, Las Palmas, 50 Casas',
                  prefixIcon: Icons.location_city_outlined,
                  validator: (v) => EcuadorValidators.validarRequerido(v, 'Barrio o Sector'),
                ),
                const SizedBox(height: 8),

                // Sugerencias rápidas de barrios
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _barriosEsmeraldas.take(5).map((barrio) {
                      return Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: ActionChip(
                          label: Text(barrio, style: const TextStyle(fontSize: 11)),
                          backgroundColor: AppColors.surfaceElevated,
                          onPressed: () => _barrioSectorController.text = barrio,
                        ),
                      );
                    }).toList(),
                  ),
                ),
                const SizedBox(height: 12),

                CustomTextField(
                  controller: _direccionReferenciaController,
                  label: 'Dirección o Referencia del Inmueble',
                  hint: 'Frente al puente peatonal, casa esquinera color verde',
                  prefixIcon: Icons.home_outlined,
                  maxLines: 2,
                ),
                const SizedBox(height: 22),

                // SECCIÓN 3: GEOLOCALIZACIÓN AUTOMÁTICA
                const Text(
                  '3. Geolocalización Automática (PostGIS)',
                  style: TextStyle(
                    color: AppColors.primaryLight,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 12),

                GpsBadge(
                  position: censoProvider.currentGpsPosition,
                  isCapturing: censoProvider.isCapturingGps,
                  onCapturePressed: () => censoProvider.capturarGps(),
                ),
                const SizedBox(height: 22),

                // SECCIÓN 4: INDICADORES DE VULNERABILIDAD
                const Text(
                  '4. Indicadores de Vulnerabilidad en el Hogar',
                  style: TextStyle(
                    color: AppColors.primaryLight,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 12),

                VulnerabilityCounter(
                  title: 'Total de Integrantes del Hogar',
                  subtitle: 'Cantidad de personas que pernoctan en la vivienda',
                  icon: Icons.groups_outlined,
                  value: censoProvider.numeroIntegrantes,
                  minValue: 1,
                  onChanged: censoProvider.setIntegrantes,
                ),
                const SizedBox(height: 10),

                VulnerabilityCounter(
                  title: 'Niños (<5 años)',
                  subtitle: 'Población infantil de máxima atención',
                  icon: Icons.child_care_outlined,
                  value: censoProvider.ninosMenores5,
                  onChanged: censoProvider.setNinos,
                ),
                const SizedBox(height: 10),

                VulnerabilityCounter(
                  title: 'Adultos Mayores (65+ años)',
                  subtitle: 'Tercera edad y comorbilidades',
                  icon: Icons.elderly_outlined,
                  value: censoProvider.adultosMayores,
                  onChanged: censoProvider.setAdultosMayores,
                ),
                const SizedBox(height: 10),

                VulnerabilityCounter(
                  title: 'Personas con Discapacidad',
                  subtitle: 'Movilidad reducida o discapacidad auditiva/visual',
                  icon: Icons.accessible_outlined,
                  value: censoProvider.personasDiscapacidad,
                  onChanged: censoProvider.setDiscapacidad,
                ),
                const SizedBox(height: 22),

                // SECCIÓN 5: DAÑOS Y EVACUACIÓN
                const Text(
                  '5. Evaluación de Afectación',
                  style: TextStyle(
                    color: AppColors.primaryLight,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 12),

                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceCard,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Nivel de Daño en Vivienda:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      Row(
                        children: ['LEVE', 'PARCIAL', 'TOTAL'].map((danio) {
                          final isSelected = censoProvider.danosVivienda == danio;
                          return Expanded(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 4),
                              child: ChoiceChip(
                                label: Text(danio, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: isSelected ? Colors.white : AppColors.textSecondary)),
                                selected: isSelected,
                                selectedColor: danio == 'TOTAL' ? AppColors.emergencyRed : AppColors.primary,
                                backgroundColor: AppColors.surfaceElevated,
                                onSelected: (sel) {
                                  if (sel) censoProvider.setDanosVivienda(danio);
                                },
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 12),
                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        title: const Text(
                          'Requiere Evacuación Inmediata a Albergue',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.emergencyRed),
                        ),
                        subtitle: const Text(
                          'Active si el predio está anegado o en zona de deslizamiento activo.',
                          style: TextStyle(fontSize: 11, color: AppColors.textMuted),
                        ),
                        value: censoProvider.requiereEvacuacion,
                        activeThumbColor: AppColors.emergencyRed,
                        onChanged: censoProvider.setRequiereEvacuacion,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 28),

                // BOTÓN DE ENVÍO Y SINCRONIZACIÓN OFFLINE
                CrisisButton(
                  text: 'Guardar Ficha Censal (PostGIS)',
                  icon: Icons.save_outlined,
                  isLoading: censoProvider.isSubmitting,
                  onPressed: _handleSubmitCenso,
                ),
                const SizedBox(height: 12),

                // Nota informativa sobre offline
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    Icon(Icons.sync, size: 14, color: AppColors.textMuted),
                    SizedBox(width: 6),
                    Text(
                      'Sincronización híbrida: Online (PostGIS) / Offline (SQLite)',
                      style: TextStyle(color: AppColors.textMuted, fontSize: 11),
                    ),
                  ],
                ),
                const SizedBox(height: 30),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
