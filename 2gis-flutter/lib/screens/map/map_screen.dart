import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../state/map_provider.dart';
import '../../state/search_provider.dart';
import '../../widgets/place_details_sheet.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  final MapController _mapController = MapController();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final mapProvider = Provider.of<MapProvider>(context);
    final searchProvider = Provider.of<SearchProvider>(context);

    final places = searchProvider.places;

    return Scaffold(
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: mapProvider.center,
              initialZoom: mapProvider.zoom,
              onTap: (_, __) {
                mapProvider.clearSelectedPlace();
              },
            ),
            children: [
              TileLayer(
                urlTemplate: isDark
                    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                    : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                subdomains: const ['a', 'b', 'c'],
                userAgentPackageName: 'com.cityguide.flutter',
              ),
              MarkerLayer(
                markers: places.map((place) {
                  final isSelected = mapProvider.selectedPlace?.id == place.id;
                  return Marker(
                    point: LatLng(place.latitude, place.longitude),
                    width: isSelected ? 48.0 : 36.0,
                    height: isSelected ? 48.0 : 36.0,
                    child: GestureDetector(
                      onTap: () {
                        mapProvider.selectPlace(place);
                        _mapController.move(LatLng(place.latitude, place.longitude), 15.0);
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        decoration: BoxDecoration(
                          color: isSelected ? AppTheme.primaryGreen : Colors.redAccent,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.3),
                              blurRadius: 6,
                              offset: const Offset(0, 3),
                            ),
                          ],
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                        child: Icon(
                          Icons.location_on,
                          color: Colors.white,
                          size: isSelected ? 26 : 20,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ),

          // Map Control Floating Buttons
          Positioned(
            right: 16,
            top: 60,
            child: Column(
              children: [
                FloatingActionButton.small(
                  heroTag: 'zoom_in',
                  backgroundColor: isDark ? AppTheme.darkSurface : AppTheme.lightSurface,
                  foregroundColor: isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary,
                  onPressed: () {
                    _mapController.move(_mapController.camera.center, _mapController.camera.zoom + 1);
                  },
                  child: const Icon(Icons.add),
                ),
                const SizedBox(height: 8),
                FloatingActionButton.small(
                  heroTag: 'zoom_out',
                  backgroundColor: isDark ? AppTheme.darkSurface : AppTheme.lightSurface,
                  foregroundColor: isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary,
                  onPressed: () {
                    _mapController.move(_mapController.camera.center, _mapController.camera.zoom - 1);
                  },
                  child: const Icon(Icons.remove),
                ),
                const SizedBox(height: 8),
                FloatingActionButton.small(
                  heroTag: 'recenter',
                  backgroundColor: AppTheme.primaryGreen,
                  foregroundColor: Colors.white,
                  onPressed: () {
                    if (mapProvider.selectedPlace != null) {
                      final p = mapProvider.selectedPlace!;
                      _mapController.move(LatLng(p.latitude, p.longitude), 15.0);
                    } else {
                      _mapController.move(const LatLng(55.7558, 37.6173), 13.0);
                    }
                  },
                  child: const Icon(Icons.my_location),
                ),
              ],
            ),
          ),

          // Selected Place Preview Sheet at bottom
          if (mapProvider.selectedPlace != null)
            Positioned(
              left: 16,
              right: 16,
              bottom: 24,
              child: Card(
                elevation: 4,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              mapProvider.selectedPlace!.name,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              mapProvider.selectedPlace!.address,
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: () {
                          PlaceDetailsSheet.show(context, mapProvider.selectedPlace!);
                        },
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        ),
                        child: const Text('Детали', style: TextStyle(fontSize: 13)),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
