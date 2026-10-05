import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class FuelGoColors {
  static const primary = Color(0xFF166534);
  static const primaryHover = Color(0xFF15803D);
  static const accent = Color(0xFF22C55E);
  static const ink = Color(0xFF111827);
  static const muted = Color(0xFF6B7280);
  static const surface = Color(0xFFF8FAF8);
  static const warning = Color(0xFFF59E0B);
  static const danger = Color(0xFFDC2626);
}

ThemeData buildFuelGoTheme() {
  final base = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(seedColor: FuelGoColors.primary, surface: FuelGoColors.surface),
    scaffoldBackgroundColor: FuelGoColors.surface,
  );

  return base.copyWith(
    textTheme: GoogleFonts.interTextTheme(base.textTheme).apply(
      bodyColor: FuelGoColors.ink,
      displayColor: FuelGoColors.ink,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: FuelGoColors.surface,
      foregroundColor: FuelGoColors.ink,
      elevation: 0,
      centerTitle: false,
    ),
    cardTheme: CardThemeData(
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: FuelGoColors.primary,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
      ),
    ),
  );
}
