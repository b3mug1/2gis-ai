import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

class ApiConfig {
  // Configurable base URL depending on platform
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:8001';
    }
    try {
      if (Platform.isAndroid) {
        // Android emulator maps 10.0.2.2 to localhost
        return 'http://10.0.2.2:8001';
      }
    } catch (_) {}
    return 'http://localhost:8001';
  }

  // Auth endpoints
  static String get loginUrl => '$baseUrl/auth/login';
  static String get registerUrl => '$baseUrl/auth/register';
  static String get refreshUrl => '$baseUrl/auth/refresh';
  static String get logoutUrl => '$baseUrl/auth/logout';
  static String get meUrl => '$baseUrl/me';

  // Search & Recommendations
  static String get searchUrl => '$baseUrl/search';
  static String get historyUrl => '$baseUrl/history';

  // Favorites
  static String get favoritesUrl => '$baseUrl/favorites';
  static String favoriteDetailUrl(String id) => '$baseUrl/favorites/$id';

  // Admin
  static String get adminStatsUrl => '$baseUrl/admin/stats';
}
