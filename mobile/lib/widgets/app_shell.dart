import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../theme/fuelgo_theme.dart';

class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.child, required this.location});
  final Widget child;
  final String location;

  int _index(String loc) {
    if (loc.startsWith('/map')) return 1;
    if (loc.startsWith('/stations')) return 2;
    if (loc.startsWith('/history') || loc.startsWith('/statistics')) return 3;
    if (loc.startsWith('/more') || loc.startsWith('/settings')) return 4;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final idx = _index(location);
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: idx,
        backgroundColor: Colors.white,
        indicatorColor: FuelGoColors.primary.withValues(alpha: 0.12),
        onDestinationSelected: (i) {
          switch (i) {
            case 0:
              context.go('/home');
            case 1:
              context.go('/map');
            case 2:
              context.go('/stations');
            case 3:
              context.go('/history');
            case 4:
              context.go('/more');
          }
        },
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.map_outlined), selectedIcon: Icon(Icons.map), label: 'Map'),
          NavigationDestination(icon: Icon(Icons.local_gas_station_outlined), selectedIcon: Icon(Icons.local_gas_station), label: 'Stations'),
          NavigationDestination(icon: Icon(Icons.history_outlined), selectedIcon: Icon(Icons.history), label: 'History'),
          NavigationDestination(icon: Icon(Icons.more_horiz), label: 'More'),
        ],
      ),
    );
  }
}
