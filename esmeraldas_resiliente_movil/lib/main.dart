import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'providers/auth_provider.dart';
import 'providers/censo_provider.dart';
import 'providers/evacuation_provider.dart';
import 'providers/incidentes_provider.dart';
import 'providers/profile_provider.dart';
import 'views/auth/login_screen.dart';
import 'views/censador/censo_form_screen.dart';
import 'views/ciudadano/ciudadano_dashboard_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Bloquear orientación en vertical para trabajo de campo
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Estilo de barra de estado translúcida / oscura
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Color(0xFF090D16),
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );

  runApp(const EsmeraldasResilienteApp());
}

class EsmeraldasResilienteApp extends StatelessWidget {
  const EsmeraldasResilienteApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()..checkSession()),
        ChangeNotifierProvider(create: (_) => CensoProvider()),
        ChangeNotifierProvider(create: (_) => IncidentesProvider()..loadIncidentesYZonas()),
        ChangeNotifierProvider(create: (_) => EvacuationProvider()..fetchShelters()),
        ChangeNotifierProvider(create: (_) => ProfileProvider()),
      ],
      child: MaterialApp(
        title: 'Esmeraldas Resiliente Móvil',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.darkTheme,
        home: const AuthGate(),
      ),
    );
  }
}

/// Compuerta de Autenticación y Flujo Condicional de Roles
/// - Trabajador de Censos (Censador/Brigadista/Operador COE): Formulario de levantamiento censal en campo
/// - Ciudadano: Pantallas completas del Mockup (Alertas, Mapa GIS de Inundación, Incidentes, Albergues y Evacuación, Perfil)
class AuthGate extends StatelessWidget {
  const AuthGate({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);

    if (authProvider.isLoading && authProvider.status == AuthStatus.initial) {
      return const Scaffold(
        backgroundColor: Color(0xFF090D16),
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFF00B4D8)),
        ),
      );
    }

    // Usuario no autenticado -> Pantalla de Login con selección de Roles
    if (authProvider.status == AuthStatus.unauthenticated || authProvider.user == null) {
      return const LoginScreen();
    }

    final user = authProvider.user!;

    // ROL 1: TRABAJADOR QUE SE ENCARGA DE CENSOS (Censador / Brigadista) -> Formulario de censo
    if (user.isCensador) {
      return const CensoFormScreen();
    }

    // ROL 2: CIUDADANO -> Pantallas del Mockup (Dashboard de 5 pestañas)
    return const CiudadanoDashboardScreen();
  }
}
