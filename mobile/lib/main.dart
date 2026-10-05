import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'router/app_router.dart';
import 'theme/fuelgo_theme.dart';

void main() {
  runApp(const ProviderScope(child: FuelGoApp()));
}

class FuelGoApp extends StatelessWidget {
  const FuelGoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'FUELGO',
      theme: buildFuelGoTheme(),
      routerConfig: appRouter,
      debugShowCheckedModeBanner: false,
    );
  }
}
