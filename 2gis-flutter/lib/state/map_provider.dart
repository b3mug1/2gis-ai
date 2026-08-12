import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import '../models/place.dart';

class MapProvider extends ChangeNotifier {
  LatLng _center = const LatLng(55.7558, 37.6173); // Default Moscow center
  double _zoom = 13.0;
  Place? _selectedPlace;

  LatLng get center => _center;
  double get zoom => _zoom;
  Place? get selectedPlace => _selectedPlace;

  void setCenter(LatLng newCenter, {double? zoom}) {
    _center = newCenter;
    if (zoom != null) _zoom = zoom;
    notifyListeners();
  }

  void selectPlace(Place? place) {
    _selectedPlace = place;
    if (place != null) {
      _center = LatLng(place.latitude, place.longitude);
      _zoom = 15.0;
    }
    notifyListeners();
  }

  void clearSelectedPlace() {
    _selectedPlace = null;
    notifyListeners();
  }
}
