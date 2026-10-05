import 'package:flutter/material.dart';
// ignore_for_file: prefer_const_constructors
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/demo_vehicle_provider.dart';
import '../theme/fuelgo_theme.dart';
import '../widgets/fuel_gauge.dart';
import '../widgets/map_card.dart';
import '../widgets/primary_button.dart';

class VehiclesScreen extends ConsumerWidget {
  const VehiclesScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final v = ref.watch(demoVehicleProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('My Vehicles'), leading: BackButton(onPressed: () => context.pop())),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Card(child: Column(children: [
          Container(height: 160, color: const Color(0xFFE5E7EB), child: const Icon(Icons.directions_car, size: 64)),
          Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('${v.make} ${v.model}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            Text('${v.year} • ${v.engine} • ${v.fuelType}'),
            const SizedBox(height: 12),
            Row(children: [Expanded(child: SecondaryButton(label: 'Edit', onPressed: () {})), const SizedBox(width: 8), Expanded(child: PrimaryButton(label: 'Set as Default', onPressed: () {}, fullWidth: true))]),
          ])),
        ])),
        const SizedBox(height: 16),
        const Text('Other Vehicles', style: TextStyle(color: FuelGoColors.muted, fontWeight: FontWeight.w600)),
        const ListTile(title: Text('Hyundai Tucson'), subtitle: Text('2021 • 2.0L • Diesel')),
        const ListTile(title: Text('Kia Sportage'), subtitle: Text('2020 • 2.0L • Petrol')),
        PrimaryButton(label: '+ Add Vehicle', onPressed: () => context.push('/vehicles/add')),
      ]),
    );
  }
}

class FuelLevelScreen extends ConsumerWidget {
  const FuelLevelScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final v = ref.watch(demoVehicleProvider);
    final pct = ref.watch(fuelPercentProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('How much fuel do you have?'), actions: [TextButton(onPressed: () => context.pop(), child: const Text('Skip'))]),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Card(child: Padding(padding: const EdgeInsets.all(16), child: FuelGauge(percent: pct, tankLiters: v.tankLiters, consumption: v.consumption, onChanged: (p) => ref.read(fuelPercentProvider.notifier).set(p)))),
        const SizedBox(height: 12),
        const Card(child: Padding(padding: EdgeInsets.all(16), child: Text('This is an estimate. Fuel gauges are not perfectly linear.'))),
        PrimaryButton(label: 'Continue →', onPressed: () => context.pop()),
      ]),
    );
  }
}

class PlanTripScreen extends StatelessWidget {
  const PlanTripScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Plan a Trip')),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        const TextField(decoration: InputDecoration(labelText: 'From', prefixIcon: Icon(Icons.trip_origin)), controller: TextEditingController(text: 'Abidjan')),
        const TextField(decoration: InputDecoration(labelText: 'To', prefixIcon: Icon(Icons.place)), controller: TextEditingController(text: 'Yamoussoukro')),
        const SizedBox(height: 12),
        SegmentedButton<int>(segments: const [ButtonSegment(value: 0, label: Text('One way')), ButtonSegment(value: 1, label: Text('Round trip')), ButtonSegment(value: 2, label: Text('Multi-stop'))], selected: const {1}, onSelectionChanged: (_) {}),
        const SizedBox(height: 12),
        PrimaryButton(label: 'Show Results →', onPressed: () => context.push('/trip-result')),
      ]),
    );
  }
}

class TripResultScreen extends StatelessWidget {
  const TripResultScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Trip Result')),
      body: ListView(children: [
        const MapCard(height: 260),
        Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Abidjan → Yamoussoukro', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text('490 km'), Text('5h 40m'), Text('36.8 L')]),
          const SizedBox(height: 12),
          const Card(color: Color(0xFFFFEBEE), child: Padding(padding: EdgeInsets.all(12), child: Text('🔴 Not enough fuel\nYou need approximately 6.8 L more.'))),
          const Text('≈ 32,200 FCFA', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: FuelGoColors.primary)),
          const SizedBox(height: 12),
          SecondaryButton(label: 'Find Fuel Stations', onPressed: () => context.push('/stations')),
          const SizedBox(height: 8),
          PrimaryButton(label: 'Start Navigation', onPressed: () => context.push('/navigation')),
        ])),
      ]),
    );
  }
}

class NavigationScreen extends StatelessWidget {
  const NavigationScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(children: [
        const MapCard(height: double.infinity, showRoute: true),
        SafeArea(child: Padding(padding: const EdgeInsets.all(16), child: Card(child: Padding(padding: const EdgeInsets.all(12), child: const Text('500 m\nContinue on A3', style: TextStyle(fontWeight: FontWeight.bold)))))),
        Align(alignment: Alignment.bottomCenter, child: Padding(padding: const EdgeInsets.all(16), child: Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(children: [
          const Text('5h 40m • 245 km • 10:25 AM'),
          const SizedBox(height: 8),
          FilledButton(style: FilledButton.styleFrom(backgroundColor: FuelGoColors.danger), onPressed: () => context.push('/trip-summary'), child: const Text('End')),
        ]))))),
      ]),
    );
  }
}

class StationsScreen extends StatelessWidget {
  const StationsScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return SafeArea(child: ListView(padding: const EdgeInsets.all(16), children: [
      const Text('Fuel Stations', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
      const MapCard(),
      const SizedBox(height: 12),
      ...['Total Energies — Tiébissou', 'Petro Ivoire — Didievi', 'Total Energies — Agboville'].map((s) => Card(child: ListTile(title: Text(s), subtitle: const Text('875 FCFA/L'), trailing: const Icon(Icons.navigation)))),
    ]));
  }
}

class AddFuelScreen extends StatelessWidget {
  const AddFuelScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(appBar: AppBar(title: const Text('Add Fuel')), body: Padding(padding: const EdgeInsets.all(16), child: Column(children: [
      SegmentedButton<int>(segments: const [ButtonSegment(value: 0, label: Text('By Liters')), ButtonSegment(value: 1, label: Text('By Amount'))], selected: const {0}, onSelectionChanged: (_) {}),
      const TextField(decoration: InputDecoration(labelText: 'Liters Added'), controller: TextEditingController(text: '20')),
      const TextField(decoration: InputDecoration(labelText: 'Price per liter'), controller: TextEditingController(text: '875')),
      Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: const [Text('Total Cost'), Text('17,500 FCFA', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold))]))),
      const Spacer(),
      PrimaryButton(label: 'Save', onPressed: () => context.pop()),
    ])));
  }
}

class StatisticsScreen extends StatelessWidget {
  const StatisticsScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return SafeArea(child: ListView(padding: const EdgeInsets.all(16), children: [
      const Text('Statistics', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
      GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 8,
        crossAxisSpacing: 8,
        children: const [
          Card(child: Padding(padding: EdgeInsets.all(12), child: Text('1,240 km\nTotal Distance'))),
          Card(child: Padding(padding: EdgeInsets.all(12), child: Text('98.5 L\nFuel Used'))),
          Card(child: Padding(padding: EdgeInsets.all(12), child: Text('86,190 FCFA\nFuel Cost'))),
          Card(child: Padding(padding: EdgeInsets.all(12), child: Text('7.9 L/100 km\nAvg Consumption'))),
        ],
      ),
    ]));
  }
}

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(children: const [
        ListTile(title: Text('VEHICLE & FUEL', style: TextStyle(fontSize: 12, color: FuelGoColors.muted))),
        ListTile(title: Text('My Vehicles'), trailing: Icon(Icons.chevron_right)),
        ListTile(title: Text('Currency'), subtitle: Text('FCFA (XOF)'), trailing: Icon(Icons.chevron_right)),
        SwitchListTile(title: Text('Notifications'), value: true, onChanged: null),
      ]),
    );
  }
}

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return SafeArea(child: ListView(padding: const EdgeInsets.all(16), children: [
      Card(color: FuelGoColors.primary, child: const Padding(padding: EdgeInsets.all(20), child: Text('FUELGO\nMohammed', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)))),
      ListTile(title: const Text('Statistics'), onTap: () => context.push('/statistics')),
      ListTile(title: const Text('Settings'), onTap: () => context.push('/settings')),
    ]));
  }
}

class MapScreen extends StatelessWidget {
  const MapScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const Text('Map', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            const Expanded(child: MapCard(height: double.infinity)),
            PrimaryButton(label: 'Plan a Trip →', onPressed: () => context.push('/plan')),
          ],
        ),
      ),
    );
  }
}

class HistoryScreen extends StatelessWidget {
  const HistoryScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return SafeArea(child: ListView(padding: const EdgeInsets.all(16), children: [
      const Text('Trip History', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
      Card(child: ListTile(title: const Text('Abidjan → Yamoussoukro'), subtitle: Text('490 km • 36.1 L • 31,600 FCFA\nOct 3, 2026'))),
    ]));
  }
}

class TripSummaryScreen extends StatelessWidget {
  const TripSummaryScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Trip Summary')),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        const MapCard(),
        const SizedBox(height: 12),
        const Text('490 km • 5h 38m • 36.1 L • 31,600 FCFA'),
        PrimaryButton(label: 'Save to History', onPressed: () => context.go('/history')),
      ]),
    );
  }
}

class AddVehicleScreen extends StatelessWidget {
  const AddVehicleScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add Vehicle')),
      body: ListView(padding: const EdgeInsets.all(16), children: const [
        TextField(decoration: InputDecoration(labelText: 'Make')),
        TextField(decoration: InputDecoration(labelText: 'Model')),
        TextField(decoration: InputDecoration(labelText: 'Tank capacity')),
      ]),
    );
  }
}
