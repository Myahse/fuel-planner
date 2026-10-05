import 'package:flutter/material.dart';
import '../theme/fuelgo_theme.dart';

class FuelGauge extends StatelessWidget {
  const FuelGauge({
    super.key,
    required this.percent,
    required this.tankLiters,
    required this.consumption,
    required this.onChanged,
    this.bars = 10,
  });

  final double percent;
  final double tankLiters;
  final double consumption;
  final ValueChanged<double> onChanged;
  final int bars;

  @override
  Widget build(BuildContext context) {
    final filled = (percent / 100 * bars).round().clamp(0, bars);
    final liters = tankLiters * percent / 100;
    final range = (liters / consumption) * 100;

    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: const [Text('E', style: TextStyle(color: FuelGoColors.muted)), Text('F', style: TextStyle(color: FuelGoColors.muted))],
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(bars, (i) {
            final active = i < filled;
            return GestureDetector(
              onTap: () => onChanged(((i + 1) / bars * 100).clamp(0, 100)),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                margin: const EdgeInsets.symmetric(horizontal: 2),
                width: 22,
                height: 56,
                decoration: BoxDecoration(
                  color: active ? FuelGoColors.primaryHover : const Color(0xFFE5E7EB),
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            );
          }),
        ),
        const SizedBox(height: 16),
        Text('$filled bars ≈ ${percent.round()}%', style: const TextStyle(fontWeight: FontWeight.w600, color: FuelGoColors.primary)),
        Text('${liters.toStringAsFixed(1)} L', style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold)),
        Text('of ${tankLiters.toStringAsFixed(0)} L', style: const TextStyle(color: FuelGoColors.muted)),
        Text('Range ${range.round()} km', style: const TextStyle(color: FuelGoColors.muted)),
        Slider(value: percent, onChanged: onChanged, min: 0, max: 100, activeColor: FuelGoColors.primary),
        const Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Empty (0%)', style: TextStyle(fontSize: 12, color: FuelGoColors.muted)),
            Text('Full (100%)', style: TextStyle(fontSize: 12, color: FuelGoColors.muted)),
          ],
        ),
      ],
    );
  }
}
