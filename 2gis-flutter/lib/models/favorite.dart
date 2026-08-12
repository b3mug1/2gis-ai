import 'place.dart';

class Favorite {
  final String id;
  final String userId;
  final String placeId;
  final Place? place;
  final DateTime createdAt;

  Favorite({
    required this.id,
    required this.userId,
    required this.placeId,
    this.place,
    required this.createdAt,
  });

  factory Favorite.fromJson(Map<String, dynamic> json) {
    return Favorite(
      id: json['id']?.toString() ?? '',
      userId: json['user_id']?.toString() ?? json['userId']?.toString() ?? '',
      placeId: json['place_id']?.toString() ?? json['placeId']?.toString() ?? '',
      place: json['place'] != null ? Place.fromJson(json['place']) : null,
      createdAt: json['created_at'] != null 
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
