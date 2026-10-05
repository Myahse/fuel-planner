import 'package:go_router/go_router.dart';
import '../screens/onboarding_screen.dart';
import '../screens/home_screen.dart';
import '../screens/feature_screens.dart';
import '../widgets/app_shell.dart';

final appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(path: '/', builder: (_, __) => const OnboardingScreen()),
    ShellRoute(
      builder: (context, state, child) => AppShell(location: state.uri.path, child: child),
      routes: [
        GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
        GoRoute(path: '/map', builder: (_, __) => const MapScreen()),
        GoRoute(path: '/stations', builder: (_, __) => const StationsScreen()),
        GoRoute(path: '/history', builder: (_, __) => const HistoryScreen()),
        GoRoute(path: '/more', builder: (_, __) => const MoreScreen()),
      ],
    ),
    GoRoute(path: '/vehicles', builder: (_, __) => const VehiclesScreen()),
    GoRoute(path: '/vehicles/add', builder: (_, __) => const AddVehicleScreen()),
    GoRoute(path: '/fuel/level', builder: (_, __) => const FuelLevelScreen()),
    GoRoute(path: '/fuel/add', builder: (_, __) => const AddFuelScreen()),
    GoRoute(path: '/plan', builder: (_, __) => const PlanTripScreen()),
    GoRoute(path: '/trip-result', builder: (_, __) => const TripResultScreen()),
    GoRoute(path: '/navigation', builder: (_, __) => const NavigationScreen()),
    GoRoute(path: '/trip-summary', builder: (_, __) => const TripSummaryScreen()),
    GoRoute(path: '/statistics', builder: (_, __) => const StatisticsScreen()),
    GoRoute(path: '/settings', builder: (_, __) => const SettingsScreen()),
  ],
);
