class Place {
  final String id;
  final String name;
  final String address;
  final String? description;
  final double latitude;
  final double longitude;
  final double rating;
  final List<String> tags;
  final String? phone;
  final String? website;
  final String? workingHours;
  final String? photoUrl;
  final String? category;

  Place({
    required this.id,
    required this.name,
    required this.address,
    this.description,
    required this.latitude,
    required this.longitude,
    this.rating = 4.5,
    this.tags = const [],
    this.phone,
    this.website,
    this.workingHours,
    this.photoUrl,
    this.category,
  });

  factory Place.fromJson(Map<String, dynamic> json) {
    List<String> parsedTags = [];
    if (json['tags'] is List) {
      parsedTags = (json['tags'] as List).map((e) => e.toString()).toList();
    }

    double lat = 55.7558; // Default Moscow/city lat
    double lng = 37.6173;
    if (json['latitude'] != null) {
      lat = (json['latitude'] as num).toDouble();
    } else if (json['lat'] != null) {
      lat = (json['lat'] as num).toDouble();
    }
    if (json['longitude'] != null) {
      lng = (json['longitude'] as num).toDouble();
    } else if (json['lon'] != null) {
      lng = (json['lon'] as num).toDouble();
    } else if (json['lng'] != null) {
      lng = (json['lng'] as num).toDouble();
    }

    return Place(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? json['title'] ?? 'Место',
      address: json['address'] ?? 'Адрес не указан',
      description: json['description'] ?? json['summary'],
      latitude: lat,
      longitude: lng,
      rating: (json['rating'] != null) ? (json['rating'] as num).toDouble() : 4.5,
      tags: parsedTags,
      phone: json['phone'],
      website: json['website'],
      workingHours: json['working_hours'] ?? json['workingHours'],
      photoUrl: json['photo_url'] ?? json['photoUrl'] ?? json['image'],
      category: json['category'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'address': address,
      'description': description,
      'latitude': latitude,
      'longitude': longitude,
      'rating': rating,
      'tags': tags,
      'phone': phone,
      'website': website,
      'working_hours': workingHours,
      'photo_url': photoUrl,
      'category': category,
    };
  }
}
