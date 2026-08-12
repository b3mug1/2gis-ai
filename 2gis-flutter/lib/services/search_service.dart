import 'dart:convert';
import '../config/api_config.dart';
import '../models/search_result.dart';
import 'api_service.dart';

class SearchService {
  static Future<SearchResult> search({
    required String query,
    Map<String, dynamic>? location,
    Map<String, dynamic>? filters,
  }) async {
    final response = await ApiService.post(
      ApiConfig.searchUrl,
      body: {
        'query': query,
        if (location != null) 'location': location,
        if (filters != null) 'filters': filters,
      },
      requireAuth: false,
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return SearchResult.fromJson(data);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['detail'] ?? 'Ошибка выполнения поиска');
    }
  }

  static Future<List<Map<String, dynamic>>> getSearchHistory() async {
    try {
      final response = await ApiService.get(ApiConfig.historyUrl, requireAuth: true);
      if (response.statusCode == 200) {
        final List data = jsonDecode(response.body);
        return data.cast<Map<String, dynamic>>();
      }
    } catch (_) {}
    return [];
  }
}
