import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/incidentes_provider.dart';
import '../../widgets/crisis_button.dart';
import '../../widgets/custom_text_field.dart';

class EmitirEmergenciaScreen extends StatefulWidget {
  const EmitirEmergenciaScreen({Key? key}) : super(key: key);

  @override
  State<EmitirEmergenciaScreen> createState() => _EmitirEmergenciaScreenState();
}

class _EmitirEmergenciaScreenState extends State<EmitirEmergenciaScreen> {
  final _formKey = GlobalKey<FormState>();
  final _descripcionController = TextEditingController();
  final _personasAtrapadasController = TextEditingController();
  final _familiasAfectadasController = TextEditingController();

  String _tipoEvento = 'INUNDACION';
  String _nivelGravedad = 'CRITICO';
  String? _selectedPhotoPath;

  final ImagePicker _picker = ImagePicker();

  final List<Map<String, dynamic>> _tiposEventos = [
    {'id': 'INUNDACION', 'label': 'Inundación / Crecida de Río', 'icon': Icons.flood_outlined},
    {'id': 'FENOMENO_NINO', 'label': 'Fenómeno de El Niño', 'icon': Icons.water_drop_outlined},
    {'id': 'DESLIZAMIENTO', 'label': 'Deslizamiento / Deslave de Tierra', 'icon': Icons.landslide_outlined},
    {'id': 'COLAPSO_ESTRUCTURAL', 'label': 'Colapso Estructural / Vivienda', 'icon': Icons.home_work_outlined},
    {'id': 'OTRO', 'label': 'Otro Evento Peligroso', 'icon': Icons.warning_amber_rounded},
  ];

  @override
  void dispose() {
    _descripcionController.dispose();
    _personasAtrapadasController.dispose();
    _familiasAfectadasController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? file = await _picker.pickImage(
        source: source,
        maxWidth: 1200,
        maxHeight: 1200,
        imageQuality: 80,
      );
      if (file != null) {
        setState(() {
          _selectedPhotoPath = file.path;
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('No se pudo acceder a la imagen: $e')),
      );
    }
  }

  Future<void> _handleEmitirEmergencia() async {
    if (!_formKey.currentState!.validate()) return;

    final provider = Provider.of<IncidentesProvider>(context, listen: false);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.user;
    final nombreInformante = (user?.nombreCompleto != null && user!.nombreCompleto.isNotEmpty)
        ? user.nombreCompleto
        : (user?.username ?? 'Ciudadano Móvil');

    final res = await provider.emitirEmergencia(
      tipoEvento: _tipoEvento,
      nivelGravedad: _nivelGravedad,
      descripcion: _descripcionController.text.trim(),
      photoPath: _selectedPhotoPath,
      personasAtrapadas: int.tryParse(_personasAtrapadasController.text) ?? 0,
      familiasAfectadas: int.tryParse(_familiasAfectadasController.text) ?? 1,
      usuarioNombre: nombreInformante,
    );

    if (!mounted) return;

    final isOnline = res['online'] == true;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        icon: Icon(
          isOnline ? Icons.emergency : Icons.cloud_off,
          color: AppColors.emergencyRed,
          size: 48,
        ),
        title: Text(
          isOnline ? '¡Alerta de Emergencia Emitida!' : '¡Emergencia Guardada Offline!',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        content: Text(
          res['mensaje'],
          style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.emergencyRed),
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.pop(context);
            },
            child: const Text('Entendido'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final incidentesProvider = Provider.of<IncidentesProvider>(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Emitir Emergencia Inmediata'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Cabecera de Alerta Roja
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.emergencyRed.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.emergencyRed.withOpacity(0.4)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: const BoxDecoration(
                          color: AppColors.emergencyRed,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.warning, color: Colors.white, size: 22),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Canal Directo de Despacho COE',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'La alerta se geolocaliza automáticamente en las coordenadas de su celular.',
                              style: TextStyle(color: AppColors.textSecondary, fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // 1. Selector de Tipo de Evento
                const Text(
                  '1. Tipo de Acontecimiento o Desastre',
                  style: TextStyle(
                    color: AppColors.primaryLight,
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 10),

                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceCard,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _tipoEvento,
                      dropdownColor: AppColors.surface,
                      isExpanded: true,
                      items: _tiposEventos.map((ev) {
                        return DropdownMenuItem<String>(
                          value: ev['id'],
                          child: Row(
                            children: [
                              Icon(ev['icon'], size: 18, color: AppColors.primary),
                              const SizedBox(width: 10),
                              Text(ev['label'], style: const TextStyle(fontSize: 13)),
                            ],
                          ),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _tipoEvento = val);
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // 2. Nivel de Gravedad
                const Text(
                  '2. Nivel de Gravedad de la Situación',
                  style: TextStyle(
                    color: AppColors.primaryLight,
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 10),

                Row(
                  children: [
                    _buildGravedadButton('CRITICO', 'Crítico', AppColors.emergencyRed),
                    const SizedBox(width: 8),
                    _buildGravedadButton('ALTO', 'Alto', AppColors.warningOrange),
                    const SizedBox(width: 8),
                    _buildGravedadButton('MEDIO', 'Medio', AppColors.warningAmber),
                  ],
                ),
                const SizedBox(height: 20),

                // 3. Descripción
                CustomTextField(
                  controller: _descripcionController,
                  label: '3. Descripción del Hecho en Territorio',
                  hint: 'Describa el nivel del agua, calles anegadas, personas en riesgo...',
                  maxLines: 3,
                  validator: (v) {
                    if (v == null || v.trim().length < 6) {
                      return 'Por favor describa brevemente la situación de emergencia.';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 18),

                // 4. Personas Atrapadas y Familias Afectadas
                Row(
                  children: [
                    Expanded(
                      child: CustomTextField(
                        controller: _personasAtrapadasController,
                        label: 'Personas Atrapadas',
                        hint: '0',
                        keyboardType: TextInputType.number,
                        prefixIcon: Icons.person_off_outlined,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: CustomTextField(
                        controller: _familiasAfectadasController,
                        label: 'Familias Afectadas',
                        hint: '0',
                        keyboardType: TextInputType.number,
                        prefixIcon: Icons.groups_outlined,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // 5. Fotografía de Evidencia
                const Text(
                  '5. Evidencia Fotográfica (Opcional)',
                  style: TextStyle(
                    color: AppColors.primaryLight,
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 10),

                if (_selectedPhotoPath != null) ...[
                  ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: Stack(
                      children: [
                        Image.file(
                          File(_selectedPhotoPath!),
                          height: 180,
                          width: double.infinity,
                          fit: BoxFit.cover,
                        ),
                        Positioned(
                          right: 8,
                          top: 8,
                          child: CircleAvatar(
                            backgroundColor: Colors.black54,
                            child: IconButton(
                              icon: const Icon(Icons.close, color: Colors.white, size: 18),
                              onPressed: () => setState(() => _selectedPhotoPath = null),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                ],

                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _pickImage(ImageSource.camera),
                        icon: const Icon(Icons.camera_alt_outlined, size: 18),
                        label: const Text('Tomar Foto'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _pickImage(ImageSource.gallery),
                        icon: const Icon(Icons.photo_library_outlined, size: 18),
                        label: const Text('Galería'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 28),

                // Botón Emitir Emergencia
                CrisisButton(
                  text: 'EMITIR ALERTA AL COE AHORA',
                  icon: Icons.send_rounded,
                  variant: CrisisButtonVariant.emergency,
                  isLoading: incidentesProvider.isReporting,
                  onPressed: _handleEmitirEmergencia,
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildGravedadButton(String id, String label, Color color) {
    final isSelected = _nivelGravedad == id;
    return Expanded(
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: () => setState(() => _nivelGravedad = id),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? color : AppColors.surfaceCard,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isSelected ? color : AppColors.border,
              width: isSelected ? 1.5 : 1,
            ),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: isSelected ? Colors.white : AppColors.textSecondary,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ),
      ),
    );
  }
}
