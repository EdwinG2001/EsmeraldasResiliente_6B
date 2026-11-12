import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/api_constants.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/evacuation_provider.dart';
import '../../providers/incidentes_provider.dart';
import '../auth/login_screen.dart';
import '../censador/censo_form_screen.dart';
import 'perfil_ajustes_screen.dart';
import 'tabs/citizen_alert_tab.dart';
import 'tabs/gis_risk_map_tab.dart';
import 'tabs/incident_tracking_tab.dart';
import 'tabs/evacuation_help_tab.dart';

class CiudadanoDashboardScreen extends StatefulWidget {
  const CiudadanoDashboardScreen({Key? key}) : super(key: key);

  @override
  State<CiudadanoDashboardScreen> createState() => _CiudadanoDashboardScreenState();
}

class _CiudadanoDashboardScreenState extends State<CiudadanoDashboardScreen> {
  int _currentTabIndex = 0;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  void _openDrawer() {
    _scaffoldKey.currentState?.openDrawer();
  }

  void _handleTabChange(int index) {
    setState(() => _currentTabIndex = index);
    if (index == 3) {
      // Pestaña Evacuación: Actualizar albergues en vivo ordenados de más cercano a más lejano
      final pos = Provider.of<IncidentesProvider>(context, listen: false).citizenPosition;
      final lat = pos?.latitude ?? ApiConstants.esmeraldasLat;
      final lon = pos?.longitude ?? ApiConstants.esmeraldasLon;
      Provider.of<EvacuationProvider>(context, listen: false).loadShelters(lat, lon);
    } else if (index == 2 || index == 1) {
      // Pestaña Seguimiento o Mapa: Actualizar incidentes reales y zonas
      Provider.of<IncidentesProvider>(context, listen: false).loadIncidentesYZonas();
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;
    final familia = authProvider.familiaCensada;

    // Las 4 pantallas exactas del render + Perfil
    final List<Widget> tabs = [
      CitizenAlertTab(onOpenDrawer: _openDrawer),    // Phone 1: Citizen Alert App
      GisRiskMapTab(onOpenDrawer: _openDrawer),      // Phone 2: GIS Risk Map
      IncidentTrackingTab(onOpenDrawer: _openDrawer),// Phone 3: COE Incident Tracking
      EvacuationHelpTab(onOpenDrawer: _openDrawer),  // Phone 4: Evacuation & Help
      const PerfilAjustesScreen(),                  // Phone 5: Settings / Profile
    ];

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: AppColors.background,
      drawer: Drawer(
        backgroundColor: AppColors.surface,
        child: Column(
          children: [
            // Header del Drawer con el logo "A" de COE Command Dashboard (visto en el render)
            Container(
              padding: const EdgeInsets.only(top: 50, bottom: 20, left: 20, right: 20),
              decoration: const BoxDecoration(
                color: Color(0xFF0F172A),
                border: Border(bottom: BorderSide(color: AppColors.border)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppColors.coeBlue,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: const [
                        BoxShadow(color: Color(0x661D4ED8), blurRadius: 10),
                      ],
                    ),
                    child: const Center(
                      child: Text(
                        'A',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'COE Command',
                          style: TextStyle(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                        Text(
                          'Esmeraldas (Live)',
                          style: TextStyle(
                            color: AppColors.primaryLight,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Perfil del Usuario Censado
            Container(
              margin: const EdgeInsets.all(14),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.surfaceCard,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.verified, color: AppColors.attendedGreen, size: 16),
                      const SizedBox(width: 6),
                      const Text(
                        'Padrón Censal Activo',
                        style: TextStyle(
                          color: AppColors.attendedGreen,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    user?.nombreCompleto ?? 'Ciudadano',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  if (familia != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      'Código: ${familia.codigoCenso} • ${familia.barrioSector}',
                      style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                    ),
                  ],
                ],
              ),
            ),

            // Opciones de Navegación del Drawer
            ListTile(
              leading: const Icon(Icons.warning_amber_rounded, color: AppColors.floodRed),
              title: const Text('Sistema de Alertas'),
              selected: _currentTabIndex == 0,
              onTap: () {
                Navigator.pop(context);
                _handleTabChange(0);
              },
            ),
            ListTile(
              leading: const Icon(Icons.map_outlined, color: AppColors.riskYellow),
              title: const Text('Mapa de Riesgos GIS'),
              selected: _currentTabIndex == 1,
              onTap: () {
                Navigator.pop(context);
                _handleTabChange(1);
              },
            ),
            ListTile(
              leading: const Icon(Icons.radar_outlined, color: AppColors.attendedGreen),
              title: const Text('Seguimiento de Incidentes COE'),
              selected: _currentTabIndex == 2,
              onTap: () {
                Navigator.pop(context);
                _handleTabChange(2);
              },
            ),
            ListTile(
              leading: const Icon(Icons.night_shelter_outlined, color: Color(0xFF38BDF8)),
              title: const Text('Albergues y Evacuación'),
              selected: _currentTabIndex == 3,
              onTap: () {
                Navigator.pop(context);
                _handleTabChange(3);
              },
            ),
            ListTile(
              leading: const Icon(Icons.manage_accounts_outlined, color: AppColors.textSecondary),
              title: const Text('Mi Perfil y Ajustes'),
              selected: _currentTabIndex == 4,
              onTap: () {
                Navigator.pop(context);
                _handleTabChange(4);
              },
            ),

            const Spacer(),
            const Divider(),

            // Acceso rápido si el usuario es además brigadista
            if (user?.isCensador == true)
              ListTile(
                leading: const Icon(Icons.assignment, color: AppColors.primary),
                title: const Text('Modo Ficha Censal'),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const CensoFormScreen()),
                  );
                },
              ),

            ListTile(
              leading: const Icon(Icons.logout, color: AppColors.criticalRed),
              title: const Text('Cerrar Sesión'),
              onTap: () async {
                await authProvider.logout();
                if (context.mounted) {
                  Navigator.of(context).pushReplacement(
                    MaterialPageRoute(builder: (_) => const LoginScreen()),
                  );
                }
              },
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),

      // CONTENIDO SEGÚN LA PESTAÑA ACTIVA
      body: IndexedStack(
        index: _currentTabIndex,
        children: tabs,
      ),

      // BARRA DE NAVEGACIÓN INFERIOR (TÁCTICA OSCURA IDÉNTICA A LOS 4 TELÉFONOS DEL RENDER)
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Color(0xFF0C101A),
          border: Border(top: BorderSide(color: AppColors.border, width: 0.8)),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentTabIndex,
          onTap: _handleTabChange,
          backgroundColor: Colors.transparent,
          elevation: 0,
          type: BottomNavigationBarType.fixed,
          selectedItemColor: AppColors.primaryLight,
          unselectedItemColor: AppColors.textMuted,
          selectedFontSize: 10,
          unselectedFontSize: 10,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.warning_amber_rounded, size: 22),
              activeIcon: Icon(Icons.warning_rounded, color: AppColors.floodRed, size: 24),
              label: 'Alertas',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.map_outlined, size: 22),
              activeIcon: Icon(Icons.map, color: AppColors.riskYellow, size: 24),
              label: 'Mapa Riesgo',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.radar_outlined, size: 22),
              activeIcon: Icon(Icons.radar, color: AppColors.attendedGreen, size: 24),
              label: 'Seguimiento',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.night_shelter_outlined, size: 22),
              activeIcon: Icon(Icons.night_shelter, color: Color(0xFF38BDF8), size: 24),
              label: 'Evacuación',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline, size: 22),
              activeIcon: Icon(Icons.person, color: AppColors.primary, size: 24),
              label: 'Mi Perfil',
            ),
          ],
        ),
      ),
    );
  }
}
