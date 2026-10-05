import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

class MapCard extends StatelessWidget {
  const MapCard({super.key, this.height = 220, this.showRoute = true});
  final double height;
  final bool showRoute;

  static const _abidjan = LatLng(5.3599517, -4.0082563);
  static const _yamo = LatLng(6.827621, -5.289343);

  @override
  Widget build(BuildContext context) {
    final route = [_abidjan, LatLng(5.9, -4.5), LatLng(6.3, -4.9), _yamo];
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: SizedBox(
        height: height,
        child: FlutterMap(
          options: MapOptions(initialCenter: LatLng(6.1, -4.6), initialZoom: 7),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.fuelgo.fuelgo',
            ),
            if (showRoute)
              PolylineLayer(
                polylines: [
                  Polyline(points: route, color: const Color(0xFF2563EB), strokeWidth: 5),
                ],
              ),
            MarkerLayer(
              markers: [
                Marker(point: _abidjan, width: 16, height: 16, child: _dot(const Color(0xFF166534))),
                Marker(point: _yamo, width: 16, height: 16, child: _dot(Colors.red)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _dot(Color c) => Container(
        decoration: BoxDecoration(color: c, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 2)),
      );
}
