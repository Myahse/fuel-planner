import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../config/product.dart';
import '../widgets/primary_button.dart';

class OnboardingScreen extends StatelessWidget {
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        Image.network(
          'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=80',
          fit: BoxFit.cover,
        ),
        Container(color: Colors.black.withValues(alpha: 0.55)),
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(ProductConfig.name, style: const TextStyle(color: Colors.white70, letterSpacing: 2)),
                const Spacer(),
                Row(children: List.generate(3, (i) => Container(margin: const EdgeInsets.only(right: 6), width: 8, height: 8, decoration: BoxDecoration(shape: BoxShape.circle, color: i == 0 ? Colors.white : Colors.white38)))),
                const SizedBox(height: 20),
                Text(ProductConfig.tagline, style: const TextStyle(color: Colors.white, fontSize: 34, fontWeight: FontWeight.w800, height: 1.15)),
                const SizedBox(height: 12),
                const Text('Plan your trips, estimate fuel costs, find fuel stations and never run out of fuel unexpectedly.', style: TextStyle(color: Colors.white70, fontSize: 16)),
                const SizedBox(height: 24),
                PrimaryButton(label: 'Get Started →', onPressed: () => context.go('/home')),
                TextButton(onPressed: () => context.go('/home'), child: const Center(child: Text('Sign In', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)))),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
