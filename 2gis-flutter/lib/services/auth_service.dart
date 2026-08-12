import 'dart:convert';
import '../config/api_config.dart';
import '../models/user.dart';
import '../models/auth_tokens.dart';
import 'api_service.dart';

class AuthService {
  static Future<User?> getCurrentUser() async {
    try {
      final token = await ApiService.getAccessToken();
      if (token == null || token.isEmpty) return null;

      final response = await ApiService.get(ApiConfig.meUrl, requireAuth: true);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return User.fromJson(data);
      }
    } catch (_) {}
    return null;
  }

  static Future<User> login({required String email, required String password}) async {
    final response = await ApiService.post(
      ApiConfig.loginUrl,
      body: {'email': email, 'password': password},
      requireAuth: false,
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final tokens = AuthTokens.fromJson(data);
      await ApiService.saveTokens(tokens.accessToken, tokens.refreshToken);

      if (data['user'] != null) {
        return User.fromJson(data['user']);
      }
      final user = await getCurrentUser();
      if (user != null) return user;
      throw Exception('Не удалось загрузить профиль пользователя');
    } else {
      final errorJson = jsonDecode(response.body);
      final detail = errorJson['detail'] ?? 'Неверный email или пароль';
      throw Exception(detail);
    }
  }

  static Future<User> register({
    required String email,
    required String password,
    String? fullName,
  }) async {
    final response = await ApiService.post(
      ApiConfig.registerUrl,
      body: {
        'email': email,
        'password': password,
        if (fullName != null && fullName.isNotEmpty) 'full_name': fullName,
      },
      requireAuth: false,
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      final data = jsonDecode(response.body);
      if (data['access_token'] != null) {
        final tokens = AuthTokens.fromJson(data);
        await ApiService.saveTokens(tokens.accessToken, tokens.refreshToken);
      }
      if (data['user'] != null) {
        return User.fromJson(data['user']);
      }
      final user = await getCurrentUser();
      if (user != null) return user;
      throw Exception('Регистрация успешна, войдите в аккаунт');
    } else {
      final errorJson = jsonDecode(response.body);
      final detail = errorJson['detail'] ?? 'Ошибка при регистрации';
      throw Exception(detail);
    }
  }

  static Future<void> logout() async {
    try {
      final refreshToken = await ApiService.getRefreshToken();
      if (refreshToken != null) {
        await ApiService.post(
          ApiConfig.logoutUrl,
          body: {'refresh_token': refreshToken},
          requireAuth: true,
        );
      }
    } catch (_) {}
    await ApiService.clearTokens();
  }
}
