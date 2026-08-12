import 'place.dart';

class SearchResult {
  final String query;
  final String summary;
  final List<Place> places;

  SearchResult({
    required this.query,
    required this.summary,
    required this.places,
  });

  factory SearchResult.fromJson(Map<String, dynamic> json) {
    List<Place> parsedPlaces = [];
    if (json['places'] is List) {
      parsedPlaces = (json['places'] as List)
          .map((item) => Place.fromJson(item as Map<String, dynamic>))
          .toList();
    } else if (json['results'] is List) {
      parsedPlaces = (json['results'] as List)
          .map((item) => Place.fromJson(item as Map<String, dynamic>))
          .toList();
    }

    return SearchResult(
      query: json['query'] ?? '',
      summary: json['summary'] ?? json['recommendation'] ?? '',
      places: parsedPlaces,
    );
  }
}
