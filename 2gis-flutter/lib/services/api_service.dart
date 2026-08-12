import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class ApiService {
  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';

  static Future<String?> getAccessToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_accessTokenKey);
  }

  static Future<String?> getRefreshToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_refreshTokenKey);
  }

  static Future<void> saveTokens(String accessToken, String refreshToken) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_accessTokenKey, accessToken);
    await prefs.setString(_refreshTokenKey, refreshToken);
  }

  static Future<void> clearTokens() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_accessTokenKey);
    await prefs.remove(_refreshTokenKey);
  }

  static Future<Map<String, String>> _getHeaders({bool requireAuth = true}) async {
    final headers = {'Content-Type': 'application/json'};
    if (requireAuth) {
      final token = await getAccessToken();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    return headers;
  }

  static Future<http.Response> get(String url, {bool requireAuth = true}) async {
    final headers = await _getHeaders(requireAuth: requireAuth);
    var response = await http.get(Uri.parse(url), headers: headers);

    if (response.statusCode == 401 && requireAuth) {
      final refreshed = await _tryRefreshToken();
      if (refreshed) {
        final newHeaders = await _getHeaders(requireAuth: requireAuth);
        response = await http.get(Uri.parse(url), headers: newHeaders);
      }
    }
    return response;
  }

  static Future<http.Response> post(String url, {dynamic body, bool requireAuth = true}) async {
    final headers = await _getHeaders(requireAuth: requireAuth);
    var response = await http.post(
      Uri.parse(url),
      headers: headers,
      body: body != null ? jsonEncode(body) : null,
    );

    if (response.statusCode == 401 && requireAuth) {
      final refreshed = await _tryRefreshToken();
      if (refreshed) {
        final newHeaders = await _getHeaders(requireAuth: requireAuth);
        response = await http.post(
          Uri.parse(url),
          headers: newHeaders,
          body: body != null ? jsonEncode(body) : null,
        );
      }
    }
    return response;
  }

  static Future<http.Response> delete(String url, {bool requireAuth = true}) async {
    final headers = await _getHeaders(requireAuth: requireAuth);
    var response = await http.delete(Uri.parse(url), headers: headers);

    if (response.statusCode == 401 && requireAuth) {
      final refreshed = await _tryRefreshToken();
      if (refreshed) {
        final newHeaders = await _getHeaders(requireAuth: requireAuth);
        response = await http.delete(Uri.parse(url), headers: newHeaders);
      }
    }
    return response;
  }

  static Future<bool> _tryRefreshToken() async {
    final refreshToken = await getRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) return false;

    try {
      final response = await http.post(
        Uri.parse(ApiConfig.refreshUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refresh_token': refreshToken}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final newAccess = data['access_token'] ?? data['accessToken'];
        final newRefresh = data['refresh_token'] ?? data['refreshToken'] ?? refreshToken;
        if (newAccess != null) {
          await saveTokens(newAccess, newRefresh);
          return true;
        }
      }
    } catch (_) {}
    await clearTokens();
    return false;
  }
}
