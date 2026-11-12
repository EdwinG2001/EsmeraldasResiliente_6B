import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/api_constants.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../services/api/api_client.dart';
import '../../widgets/crisis_button.dart';
import '../../widgets/custom_text_field.dart';
import '../censador/censo_form_screen.dart';
import '../ciudadano/ciudadano_dashboard_screen.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _identifierController = TextEditingController(text: '0991234567');
  final _passwordController = TextEditingController(text: 'password123');

  // Selector de Rol: 'CIUDADANO' o 'ANALISTA/CENSADOR'
  String _selectedRole = 'CIUDADANO';

  // Diagnóstico de Conexión en Vivo
  bool _isCheckingBackend = false;
  bool _isBackendOnline = false;
  String _backendStatusText = 'Verificando enlace Render PostGIS...';

  @override
  void initState() {
    super.initState();
    _checkBackendConnection();
  }

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _checkBackendConnection() async {
    setState(() {
      _isCheckingBackend = true;
      _backendStatusText = 'Probando enlace Render Cloud...';
    });

    final res = await ApiClient().testConnection();
    if (!mounted) return;

    setState(() {
      _isCheckingBackend = false;
      _isBackendOnline = res['success'] == true;
      _backendStatusText = res['message'] ?? (_isBackendOnline ? 'En línea' : 'Sin conexión');
    });
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    if (_selectedRole == 'ANALISTA/CENSADOR') {
      // Flujo institucional exclusivo por Keycloak IAM para DIGITALIZADOR
      final success = await authProvider.loginKeycloak(
        username: _identifierController.text.trim(),
        password: _passwordController.text,
      );

      if (!mounted) return;

      if (success) {
        final rol = authProvider.user?.rol.toUpperCase() ?? '';
        final isDigitalizador = rol == 'DIGITALIZADOR' || rol == 'CENSADOR' || authProvider.user?.isCensador == true;

        if (isDigitalizador) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => const CensoFormScreen()),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Acceso Denegado: Su usuario no posee el rol oficial DIGITALIZADOR para acceder a las fichas censales.',
              ),
              backgroundColor: AppColors.floodRed,
            ),
          );
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(authProvider.errorMessage ?? 'Error en la autenticación de Keycloak IAM.'),
            backgroundColor: AppColors.floodRed,
          ),
        );
      }
    } else {
      // Flujo de Ciudadano: Validación obligatoria contra la Base de Datos (Render PostgreSQL)
      final success = await authProvider.login(
        identifier: _identifierController.text.trim(),
        password: _passwordController.text,
        targetRole: 'CIUDADANO',
      );

      if (!mounted) return;

      if (success) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const CiudadanoDashboardScreen()),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              authProvider.errorMessage ?? 'Credenciales inválidas o usuario no registrado en la base de datos.',
            ),
            backgroundColor: AppColors.floodRed,
          ),
        );
      }
    }
  }

  void _showServerSettingsDialog() {
    final controller = TextEditingController(text: ApiConstants.activeBaseUrl);
    String testStatus = '';
    bool testing = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: AppColors.surface,
          title: const Text('Conexión con Backend Render / WiFi',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'El backend oficial está desplegado en Render Cloud con base de datos PostgreSQL + PostGIS:',
                  style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: controller,
                  style: const TextStyle(fontSize: 12, color: AppColors.textPrimary),
                  decoration: const InputDecoration(
                    labelText: 'URL Base de la API REST',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ActionChip(
                      avatar: const Icon(Icons.cloud_done, size: 14, color: AppColors.primaryLight),
                      label: const Text('Render Cloud (Oficial)', style: TextStyle(fontSize: 11)),
                      onPressed: () => setDialogState(() => controller.text = ApiConstants.prodBaseUrl),
                    ),
                    ActionChip(
                      avatar: const Icon(Icons.wifi, size: 14, color: AppColors.attendedGreen),
                      label: const Text('WiFi PC (192.168.1.4)', style: TextStyle(fontSize: 11)),
                      onPressed: () => setDialogState(() => controller.text = ApiConstants.devLocalUrl),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                // Botón de prueba de ping en vivo
                OutlinedButton.icon(
                  onPressed: testing
                      ? null
                      : () async {
                          setDialogState(() {
                            testing = true;
                            testStatus = 'Probando conexión...';
                          });
                          final res = await ApiClient().testConnection(controller.text.trim());
                          setDialogState(() {
                            testing = false;
                            testStatus = res['message'];
                          });
                        },
                  icon: testing
                      ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.network_check, size: 16),
                  label: Text(testing ? 'Verificando...' : 'Probar Conexión (Ping)', style: const TextStyle(fontSize: 12)),
                ),
                if (testStatus.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    testStatus,
                    style: TextStyle(
                      fontSize: 11,
                      color: testStatus.contains('exitosa') ? AppColors.successGreen : AppColors.floodRed,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancelar', style: TextStyle(color: AppColors.textMuted)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
              onPressed: () {
                final newUrl = controller.text.trim();
                ApiClient().updateBaseUrl(newUrl);
                Navigator.pop(ctx);
                _checkBackendConnection();
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Servidor activo actualizado: $newUrl'),
                    backgroundColor: AppColors.primary,
                  ),
                );
              },
              child: const Text('Guardar y Usar'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_ethernet, color: AppColors.primaryLight, size: 22),
            tooltip: 'Configurar Servidor / Render',
            onPressed: _showServerSettingsDialog,
          ),
        ],
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // LOGO INSTITUCIONAL "A" DEL COE COMMAND DASHBOARD
                  Center(
                    child: Container(
                      width: 68,
                      height: 68,
                      decoration: BoxDecoration(
                        color: AppColors.coeBlue,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0x771D4ED8),
                            blurRadius: 24,
                            spreadRadius: 2,
                            offset: Offset(0, 6),
                          )
                        ],
                      ),
                      child: const Center(
                        child: Text(
                          'A',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 36,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -1,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // TÍTULOS OFICIALES DEL COE DASHBOARD
                  const Text(
                    'COE Command Dashboard',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 21,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 7,
                        height: 7,
                        decoration: const BoxDecoration(
                          color: AppColors.criticalRed,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      const Text(
                        'Esmeraldas (Live PostGIS)',
                        style: TextStyle(
                          color: AppColors.primaryLight,
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // CHIP INTERACTIVO INDICADOR DE CONEXIÓN A RENDER
                  Center(
                    child: InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: _checkBackendConnection,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceElevated,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: _isBackendOnline ? AppColors.attendedGreen : AppColors.border,
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (_isCheckingBackend)
                              const SizedBox(
                                width: 10,
                                height: 10,
                                child: CircularProgressIndicator(strokeWidth: 1.5, color: AppColors.primaryLight),
                              )
                            else
                              Icon(
                                _isBackendOnline ? Icons.cloud_done : Icons.cloud_queue,
                                color: _isBackendOnline ? AppColors.attendedGreen : AppColors.riskYellow,
                                size: 14,
                              ),
                            const SizedBox(width: 6),
                            Text(
                              _backendStatusText,
                              style: TextStyle(
                                fontSize: 10,
                                color: _isBackendOnline ? AppColors.textPrimary : AppColors.textSecondary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(width: 4),
                            const Icon(Icons.refresh, size: 12, color: AppColors.textMuted),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // SELECTOR DE ACCESO / ROL
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceCard,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: InkWell(
                            borderRadius: BorderRadius.circular(11),
                            onTap: () {
                              setState(() {
                                _selectedRole = 'CIUDADANO';
                                _identifierController.clear();
                                _passwordController.clear();
                              });
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              decoration: BoxDecoration(
                                color: _selectedRole == 'CIUDADANO'
                                    ? AppColors.primary
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(11),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.person_outline,
                                    size: 18,
                                    color: _selectedRole == 'CIUDADANO'
                                        ? Colors.white
                                        : AppColors.textMuted,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    'CIUDADANO',
                                    style: TextStyle(
                                      color: _selectedRole == 'CIUDADANO'
                                          ? Colors.white
                                          : AppColors.textMuted,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        Expanded(
                          child: InkWell(
                            borderRadius: BorderRadius.circular(11),
                            onTap: () {
                              setState(() {
                                _selectedRole = 'ANALISTA/CENSADOR';
                                _identifierController.text = 'jomira';
                                _passwordController.text = 'Jomira123';
                              });
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              decoration: BoxDecoration(
                                color: _selectedRole == 'ANALISTA/CENSADOR'
                                    ? AppColors.primary
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(11),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.security,
                                    size: 18,
                                    color: _selectedRole == 'ANALISTA/CENSADOR'
                                        ? Colors.white
                                        : AppColors.textMuted,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    'TRABAJADOR CENSO',
                                    style: TextStyle(
                                      color: _selectedRole == 'ANALISTA/CENSADOR'
                                          ? Colors.white
                                          : AppColors.textMuted,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: 0.3,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Campo Identificador
                  CustomTextField(
                    controller: _identifierController,
                    label: _selectedRole == 'CIUDADANO'
                        ? 'Cédula de Identidad o Celular Registrado'
                        : 'Usuario Keycloak IAM (Digitalizador)',
                    hint: _selectedRole == 'CIUDADANO'
                        ? 'Ej. 0984561234 o 0804123891'
                        : 'jomira',
                    prefixIcon: _selectedRole == 'CIUDADANO' ? Icons.badge_outlined : Icons.vpn_key_outlined,
                    validator: (val) {
                      if (val == null || val.trim().isEmpty) {
                        return 'Ingrese su identificación de acceso.';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 14),

                  // Campo Contraseña
                  CustomTextField(
                    controller: _passwordController,
                    label: _selectedRole == 'CIUDADANO'
                        ? 'Contraseña de Seguridad'
                        : 'Contraseña Keycloak IAM',
                    hint: '••••••••',
                    isPassword: true,
                    prefixIcon: Icons.lock_outline,
                    validator: (val) {
                      if (val == null || val.length < 4) {
                        return 'La contraseña debe tener al menos 4 caracteres.';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),

                  // Botón Iniciar Sesión con Render / Keycloak
                  CrisisButton(
                    text: _selectedRole == 'CIUDADANO'
                        ? 'Ingresar como Ciudadano (Base de Datos)'
                        : 'Ingresar con Keycloak IAM (Digitalizador)',
                    icon: _selectedRole == 'CIUDADANO' ? Icons.login : Icons.security,
                    isLoading: authProvider.isLoading,
                    onPressed: _handleLogin,
                  ),
                  const SizedBox(height: 18),

                  // Indicador institucional según rol seleccionado
                  if (_selectedRole == 'ANALISTA/CENSADOR') ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceElevated,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                      ),
                      child: Row(
                        children: const [
                          Icon(Icons.verified_user, color: AppColors.attendedGreen, size: 20),
                          SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Acceso exclusivo para personal censador y digitalizadores autorizados en Keycloak IAM SSO.',
                              style: TextStyle(
                                fontSize: 11,
                                color: AppColors.textSecondary,
                                height: 1.3,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ] else ...[
                    // Opción de Registro Ciudadano en Base de Datos
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          '¿No tienes cuenta ciudadana? ',
                          style: TextStyle(color: AppColors.textMuted, fontSize: 13),
                        ),
                        GestureDetector(
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => const RegisterScreen()),
                            );
                          },
                          child: const Text(
                            'Regístrate aquí',
                            style: TextStyle(
                              color: AppColors.primaryLight,
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              decoration: TextDecoration.underline,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
