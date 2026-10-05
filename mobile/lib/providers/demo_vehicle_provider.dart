import 'package:flutter_riverpod/flutter_riverpod.dart';

class DemoVehicle {
  final String make;
  final String model;
  final int year;
  final String engine;
  final String fuelType;
  final double tankLiters;
  final double consumption;
  final double fuelPercent;

  const DemoVehicle({
    required this.make,
    required this.model,
    required this.year,
    required this.engine,
    required this.fuelType,
    required this.tankLiters,
    required this.consumption,
    required this.fuelPercent,
  });

  double get fuelLiters => tankLiters * fuelPercent / 100;
  double get rangeKm => (fuelLiters / consumption) * 100;
}

final demoVehicleProvider = Provider<DemoVehicle>(
  (_) => const DemoVehicle(
    make: 'Toyota',
    model: 'Corolla',
    year: 2022,
    engine: '1.8L',
    fuelType: 'Petrol',
    tankLiters: 50,
    consumption: 7.5,
    fuelPercent: 60,
  ),
);

final fuelPercentProvider = NotifierProvider<FuelPercentNotifier, double>(FuelPercentNotifier.new);

class FuelPercentNotifier extends Notifier<double> {
  @override
  double build() => 60;
  void set(double v) => state = v.clamp(0, 100);
}
