import 'package:flutter/material.dart';
import '../models/favorite.dart';
import '../models/place.dart';
import '../services/favorites_service.dart';

class FavoritesProvider extends ChangeNotifier {
  List<Favorite> _favorites = [];
  bool _isLoading = false;

  List<Favorite> get favorites => _favorites;
  bool get isLoading => _isLoading;

  Future<void> loadFavorites() async {
    _isLoading = true;
    notifyListeners();
    _favorites = await FavoritesService.getFavorites();
    _isLoading = false;
    notifyListeners();
  }

  bool isFavorite(String placeId) {
    return _favorites.any((fav) => fav.placeId == placeId || fav.place?.id == placeId);
  }

  Future<bool> toggleFavorite(Place place) async {
    final currentlyFav = isFavorite(place.id);
    if (currentlyFav) {
      final success = await FavoritesService.removeFavorite(place.id);
      if (success) {
        _favorites.removeWhere((fav) => fav.placeId == place.id || fav.place?.id == place.id);
        notifyListeners();
      }
      return !success;
    } else {
      final success = await FavoritesService.addFavorite(place);
      if (success) {
        await loadFavorites();
      }
      return success;
    }
  }
}
