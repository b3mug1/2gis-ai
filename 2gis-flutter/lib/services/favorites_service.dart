import 'dart:convert';
import '../config/api_config.dart';
import '../models/favorite.dart';
import '../models/place.dart';
import 'api_service.dart';

class FavoritesService {
  static Future<List<Favorite>> getFavorites() async {
    try {
      final response = await ApiService.get(ApiConfig.favoritesUrl, requireAuth: true);
      if (response.statusCode == 200) {
        final List data = jsonDecode(response.body);
        return data.map((item) => Favorite.fromJson(item)).toList();
      }
    } catch (_) {}
    return [];
  }

  static Future<bool> addFavorite(Place place) async {
    try {
      final response = await ApiService.post(
        ApiConfig.favoritesUrl,
        body: {
          'place_id': place.id,
          'place_data': place.toJson(),
        },
        requireAuth: true,
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> removeFavorite(String placeId) async {
    try {
      final response = await ApiService.delete(
        ApiConfig.favoriteDetailUrl(placeId),
        requireAuth: true,
      );
      return response.statusCode == 200 || response.statusCode == 204;
    } catch (_) {
      return false;
    }
  }
}
