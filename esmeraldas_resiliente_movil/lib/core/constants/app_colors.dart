import 'package:flutter/material.dart';

class AppColors {
  // Fondos Tácticos Dark Mode (Inspirados en la Sala de Crisis COE Esmeraldas)
  static const Color background = Color(0xFF090D16);
  static const Color surface = Color(0xFF0F1523);
  static const Color surfaceCard = Color(0xFF141C2E);
  static const Color surfaceElevated = Color(0xFF1A243B);
  static const Color border = Color(0xFF223048);
  static const Color borderLight = Color(0xFF2E4060);

  // Logo Institucional "A" / COE Command
  static const Color coeBlue = Color(0xFF1D4ED8);
  static const Color coeBlueLight = Color(0xFF3B82F6);

  // Acentos de Crisis & Identidad
  static const Color primary = Color(0xFF00B4D8);
  static const Color primaryLight = Color(0xFF48CAE4);
  static const Color primaryDark = Color(0xFF0077B6);
  static const Color primaryGlow = Color(0x3300B4D8);

  // Semaforización Oficial del Render COE
  // 1. Polígonos Rojos de Alto Riesgo de Inundación (High-Risk Flood)
  static const Color floodRed = Color(0xFFE63946);
  static const Color floodRedDark = Color(0xFF8B1E28);
  static const Color floodRedAlpha = Color(0x55E63946);
  static const Color emergencyRed = Color(0xFFE63946);
  static const Color emergencyRedGlow = Color(0x40E63946);

  // 2. Polígonos Amarillos de Riesgo Medio (Medium Risk)
  static const Color riskYellow = Color(0xFFFBBF24);
  static const Color riskYellowDark = Color(0xFF854D0E);
  static const Color riskYellowAlpha = Color(0x55FBBF24);

  // 3. Indicadores de Severidad
  static const Color criticalRed = Color(0xFFEF4444);
  static const Color mediumYellow = Color(0xFFF59E0B);
  static const Color warningOrange = Color(0xFFF97316);
  static const Color warningAmber = Color(0xFFF59E0B);
  static const Color attendedGreen = Color(0xFF10B981);
  static const Color successGreen = Color(0xFF10B981);
  static const Color pointBlue = Color(0xFF38BDF8);
  static const Color infoBlue = Color(0xFF38BDF8);

  // Textos y Contraste
  static const Color textPrimary = Color(0xFFF8FAFC);
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color textMuted = Color(0xFF64748B);
  static const Color textDisabled = Color(0xFF475569);

  // Gradientes
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF00B4D8), Color(0xFF0077B6)],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static const LinearGradient emergencyGradient = LinearGradient(
    colors: [Color(0xFFE63946), Color(0xFFD62828)],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static const LinearGradient emergencyButtonGradient = LinearGradient(
    colors: [Color(0xFFE63946), Color(0xFFD62828)],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static const LinearGradient blueButtonGradient = LinearGradient(
    colors: [Color(0xFF0284C7), Color(0xFF0369A1)],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static const LinearGradient cardGradient = LinearGradient(
    colors: [Color(0xFF162136), Color(0xFF101726)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
}
