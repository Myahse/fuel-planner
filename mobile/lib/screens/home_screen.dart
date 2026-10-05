import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/demo_vehicle_provider.dart';
import '../theme/fuelgo_theme.dart';
import '../widgets/primary_button.dart';
import '../widgets/car_model_viewer.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final v = ref.watch(demoVehicleProvider);
    final pct = ref.watch(fuelPercentProvider);
    final liters = v.tankLiters * pct / 100;
    final range = (liters / v.consumption) * 100;
    final bars = (pct / 10).round();

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Good morning,', style: TextStyle(color: FuelGoColors.muted)),
                const Text('Mohammed', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              ]),
              const CircleAvatar(child: Icon(Icons.notifications_none)),
            ],
          ),
          const SizedBox(height: 16),
          const CarModelViewer(height: 200),
          const SizedBox(height: 12),
          Card(
            child: ListTile(
              leading: const Icon(Icons.directions_car, color: FuelGoColors.primary),
              title: Text('${v.make} ${v.model}', style: const TextStyle(fontWeight: FontWeight.w700)),
              subtitle: Text('${v.year} • ${v.engine} • ${v.fuelType}'),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('⛽ Fuel level', style: TextStyle(color: FuelGoColors.muted)),
                  Text('$bars bars (≈${pct.round()}%)', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: LinearProgressIndicator(value: pct / 100, minHeight: 8, color: FuelGoColors.primary, backgroundColor: const Color(0xFFE5E7EB)),
                  ),
                  const SizedBox(height: 8),
                  Text('${liters.toStringAsFixed(1)} L of ${v.tankLiters.toStringAsFixed(0)} L'),
                  const SizedBox(height: 12),
                  Text('${range.round()} km', style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w800, color: FuelGoColors.primary)),
                  const Text('Estimated range', style: TextStyle(color: FuelGoColors.muted)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: _miniStat('7.5 L/100 km', 'Avg consumption')),
            const SizedBox(width: 8),
            Expanded(child: _miniStat('875 FCFA/L', 'Fuel price')),
          ]),
          const SizedBox(height: 16),
          PrimaryButton(label: 'Plan a Trip →', onPressed: () => context.push('/plan')),
          const SizedBox(height: 12),
          Wrap(spacing: 8, runSpacing: 8, children: [
            _chip(context, 'Add Fuel', '/fuel/add'),
            _chip(context, 'Vehicles', '/vehicles'),
            _chip(context, 'Fuel Level', '/fuel/level'),
            _chip(context, 'Stations', '/stations'),
          ]),
        ],
      ),
    );
  }

  Widget _miniStat(String v, String l) => Card(child: Padding(padding: const EdgeInsets.all(12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(l, style: const TextStyle(fontSize: 11, color: FuelGoColors.muted)), Text(v, style: const TextStyle(fontWeight: FontWeight.w700))])));
  Widget _chip(BuildContext c, String t, String route) => ActionChip(label: Text(t), onPressed: () => c.push(route));
}
