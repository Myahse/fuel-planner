import 'package:flutter/material.dart';
import 'package:model_viewer_plus/model_viewer_plus.dart';

class CarModelViewer extends StatelessWidget {
  const CarModelViewer({super.key, this.height = 220, this.autoRotate = true});

  final double height;
  final bool autoRotate;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: SizedBox(
        height: height,
        width: double.infinity,
        child: ModelViewer(
          src: 'assets/models/sedan.glb',
          alt: 'Vehicle 3D model',
          autoRotate: autoRotate,
          cameraControls: true,
          disableZoom: false,
          backgroundColor: const Color(0xFFF8FAF8),
        ),
      ),
    );
  }
}
