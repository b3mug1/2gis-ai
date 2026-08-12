class User {
  final String id;
  final String email;
  final String? fullName;
  final String role;
  final bool isActive;
  final String? avatarUrl;

  User({
    required this.id,
    required this.email,
    this.fullName,
    required this.role,
    this.isActive = true,
    this.avatarUrl,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id']?.toString() ?? '',
      email: json['email'] ?? '',
      fullName: json['full_name'] ?? json['fullName'],
      role: json['role'] ?? 'user',
      isActive: json['is_active'] ?? json['isActive'] ?? true,
      avatarUrl: json['avatar_url'] ?? json['avatarUrl'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'full_name': fullName,
      'role': role,
      'is_active': isActive,
      'avatar_url': avatarUrl,
    };
  }

  bool get isAdmin => role.toLowerCase() == 'admin';
}
