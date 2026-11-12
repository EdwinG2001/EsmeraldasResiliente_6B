import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/ecuador_validators.dart';
import '../../providers/auth_provider.dart';
import '../../providers/profile_provider.dart';
import '../../widgets/crisis_button.dart';
import '../../widgets/custom_text_field.dart';

class PerfilAjustesScreen extends StatefulWidget {
  const PerfilAjustesScreen({Key? key}) : super(key: key);

  @override
  State<PerfilAjustesScreen> createState() => _PerfilAjustesScreenState();
}

class _PerfilAjustesScreenState extends State<PerfilAjustesScreen> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _emailController;
  late TextEditingController _usernameController;
  late TextEditingController _telefonoController;
  late TextEditingController _telefonoEmergenciaController;
  final TextEditingController _passwordController = TextEditingController();

  @override
  void initState() {
    super.initState();
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    _emailController = TextEditingController(text: user?.email ?? '');
    _usernameController = TextEditingController(text: user?.username ?? '');
    _telefonoController = TextEditingController(text: user?.telefono ?? '');
    _telefonoEmergenciaController = TextEditingController(text: user?.telefonoEmergencia ?? '');
  }

  @override
  void dispose() {
    _emailController.dispose();
    _usernameController.dispose();
    _telefonoController.dispose();
    _telefonoEmergenciaController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final profileProvider = Provider.of<ProfileProvider>(context, listen: false);

    final success = await profileProvider.actualizarDatosPersonales(
      authProvider: authProvider,
      email: _emailController.text,
      username: _usernameController.text,
      password: _passwordController.text.isNotEmpty ? _passwordController.text : null,
      telefono: _telefonoController.text,
      telefonoEmergencia: _telefonoEmergenciaController.text,
    );

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Datos personales actualizados correctamente.'),
          backgroundColor: AppColors.successGreen,
        ),
      );
      _passwordController.clear();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(profileProvider.statusMessage ?? 'Error al actualizar el perfil.'),
          backgroundColor: AppColors.emergencyRed,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final profileProvider = Provider.of<ProfileProvider>(context);
    final user = authProvider.user;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Mi Perfil y Ajustes'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Cabecera con Avatar
                Center(
                  child: Stack(
                    children: [
                      Container(
                        width: 86,
                        height: 86,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.surfaceCard,
                          border: Border.all(color: AppColors.primary, width: 2),
                        ),
                        child: const Icon(Icons.person, size: 50, color: AppColors.primary),
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.verified, size: 16, color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Center(
                  child: Text(
                    user?.nombreCompleto ?? 'Ciudadano de Esmeraldas',
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Center(
                  child: Text(
                    'Cédula: ${user?.cedula ?? 'No registrada'} • Rol: ${user?.rol ?? 'CIUDADANO'}',
                    style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                  ),
                ),
                const SizedBox(height: 24),

                const Text(
                  'Modificar Información Personal',
                  style: TextStyle(
                    color: AppColors.primaryLight,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 14),

                // 1. Correo Electrónico
                CustomTextField(
                  controller: _emailController,
                  label: 'Correo Electrónico',
                  hint: 'ejemplo@esmeraldas.gob.ec',
                  keyboardType: TextInputType.emailAddress,
                  prefixIcon: Icons.email_outlined,
                  validator: EcuadorValidators.validarEmail,
                ),
                const SizedBox(height: 16),

                // 2. Nombre de Usuario
                CustomTextField(
                  controller: _usernameController,
                  label: 'Nombre de Usuario',
                  hint: 'juan.perez',
                  prefixIcon: Icons.alternate_email,
                  validator: (v) => EcuadorValidators.validarRequerido(v, 'Usuario'),
                ),
                const SizedBox(height: 16),

                // 3. Teléfono Celular
                CustomTextField(
                  controller: _telefonoController,
                  label: 'Número de Teléfono Celular',
                  hint: '0991234567',
                  keyboardType: TextInputType.phone,
                  prefixIcon: Icons.phone_android_outlined,
                  validator: EcuadorValidators.validarTelefonoCelular,
                ),
                const SizedBox(height: 16),

                // 4. Contacto de Emergencia
                CustomTextField(
                  controller: _telefonoEmergenciaController,
                  label: 'Teléfono de Contacto de Emergencia (Familiar)',
                  hint: '0987654321',
                  keyboardType: TextInputType.phone,
                  prefixIcon: Icons.contact_phone_outlined,
                ),
                const SizedBox(height: 16),

                // 5. Contraseña (Opcional si desea cambiarla)
                CustomTextField(
                  controller: _passwordController,
                  label: 'Nueva Contraseña (Dejar en blanco para no cambiar)',
                  hint: 'Mínimo 6 caracteres',
                  isPassword: true,
                  prefixIcon: Icons.lock_reset_outlined,
                ),
                const SizedBox(height: 28),

                // Botón Guardar Cambios
                CrisisButton(
                  text: 'Guardar Ajustes',
                  icon: Icons.save_outlined,
                  isLoading: profileProvider.isUpdating,
                  onPressed: _handleSave,
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
