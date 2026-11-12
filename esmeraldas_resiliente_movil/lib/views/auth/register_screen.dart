import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/ecuador_validators.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/crisis_button.dart';
import '../../widgets/custom_text_field.dart';
import '../ciudadano/ciudadano_dashboard_screen.dart';
import '../ciudadano/no_censado_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({Key? key}) : super(key: key);

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nombresController = TextEditingController();
  final _apellidosController = TextEditingController();
  final _cedulaController = TextEditingController();
  final _telefonoController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _nombresController.dispose();
    _apellidosController.dispose();
    _cedulaController.dispose();
    _telefonoController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    final success = await authProvider.register(
      telefono: _telefonoController.text.trim(),
      password: _passwordController.text,
      firstName: _nombresController.text.trim(),
      lastName: _apellidosController.text.trim(),
      email: _emailController.text.trim(),
      cedula: _cedulaController.text.trim(),
    );

    if (!mounted) return;

    if (success) {
      if (authProvider.esCensado) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const CiudadanoDashboardScreen()),
          (route) => false,
        );
      } else {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(
            builder: (_) => NoCensadoScreen(
              cedulaConsultada: _cedulaController.text.trim(),
            ),
          ),
          (route) => false,
        );
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(authProvider.errorMessage ?? 'Error al registrar ciudadano.'),
          backgroundColor: AppColors.emergencyRed,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Registro de Ciudadano'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Crea tu Perfil Comunitario',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'El registro te permitirá emitir alertas de emergencia y acceder al sistema del COE de Esmeraldas.',
                  style: TextStyle(color: AppColors.textMuted, fontSize: 13),
                ),
                const SizedBox(height: 24),

                Row(
                  children: [
                    Expanded(
                      child: CustomTextField(
                        controller: _nombresController,
                        label: 'Nombres',
                        hint: 'Ej. Juan Carlos',
                        validator: (v) => EcuadorValidators.validarRequerido(v, 'Nombres'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: CustomTextField(
                        controller: _apellidosController,
                        label: 'Apellidos',
                        hint: 'Ej. Quiñónez',
                        validator: (v) => EcuadorValidators.validarRequerido(v, 'Apellidos'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                CustomTextField(
                  controller: _cedulaController,
                  label: 'Cédula de Identidad (10 dígitos)',
                  hint: 'Ej. 0801234567',
                  keyboardType: TextInputType.number,
                  prefixIcon: Icons.badge_outlined,
                  validator: EcuadorValidators.validarCedula,
                ),
                const SizedBox(height: 16),

                CustomTextField(
                  controller: _telefonoController,
                  label: 'Teléfono Celular',
                  hint: 'Ej. 0991234567',
                  keyboardType: TextInputType.phone,
                  prefixIcon: Icons.phone_android_outlined,
                  validator: EcuadorValidators.validarTelefonoCelular,
                ),
                const SizedBox(height: 16),

                CustomTextField(
                  controller: _emailController,
                  label: 'Correo Electrónico',
                  hint: 'ciudadano@esmeraldas.gob.ec',
                  keyboardType: TextInputType.emailAddress,
                  prefixIcon: Icons.email_outlined,
                  validator: EcuadorValidators.validarEmail,
                ),
                const SizedBox(height: 16),

                CustomTextField(
                  controller: _passwordController,
                  label: 'Contraseña',
                  hint: 'Mínimo 6 caracteres',
                  isPassword: true,
                  prefixIcon: Icons.lock_outline,
                  validator: (v) {
                    if (v == null || v.length < 6) {
                      return 'La contraseña debe tener mínimo 6 caracteres.';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 28),

                CrisisButton(
                  text: 'Completar Registro',
                  icon: Icons.check_circle_outline,
                  isLoading: authProvider.isLoading,
                  onPressed: _handleRegister,
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
