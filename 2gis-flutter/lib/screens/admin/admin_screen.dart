import 'dart:convert';
import 'package:flutter/material.dart';
import '../../config/api_config.dart';
import '../../config/app_theme.dart';
import '../../services/api_service.dart';

class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  Map<String, dynamic>? _stats;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  void _fetchStats() async {
    try {
      final response = await ApiService.get(ApiConfig.adminStatsUrl, requireAuth: true);
      if (response.statusCode == 200) {
        setState(() {
          _stats = jsonDecode(response.body);
          _isLoading = false;
        });
      }
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Панель администратора'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
          : _stats == null
              ? const Center(child: Text('Не удалось загрузить данные администратора'))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Text(
                      'Статистика системы',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary,
                      ),
                    ),
                    const SizedBox(height: 16),
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      physics: const NeverScrollableScrollPhysics(),
                      children: [
                        _buildStatCard(
                          context,
                          title: 'Пользователи',
                          value: '${_stats?['total_users'] ?? _stats?['users_count'] ?? 0}',
                          icon: Icons.people,
                          color: AppTheme.primaryGreen,
                        ),
                        _buildStatCard(
                          context,
                          title: 'Запросы ИИ',
                          value: '${_stats?['total_searches'] ?? _stats?['searches_count'] ?? 0}',
                          icon: Icons.search,
                          color: AppTheme.accentBlue,
                        ),
                        _buildStatCard(
                          context,
                          title: 'Места в базе',
                          value: '${_stats?['total_places'] ?? _stats?['places_count'] ?? 0}',
                          icon: Icons.place,
                          color: AppTheme.accentOrange,
                        ),
                        _buildStatCard(
                          context,
                          title: 'Избранное',
                          value: '${_stats?['total_favorites'] ?? _stats?['favorites_count'] ?? 0}',
                          icon: Icons.favorite,
                          color: Colors.redAccent,
                        ),
                      ],
                    ),
                  ],
                ),
    );
  }

  Widget _buildStatCard(
    BuildContext context, {
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              radius: 18,
              backgroundColor: color.withOpacity(0.15),
              child: Icon(icon, size: 20, color: color),
            ),
            const Spacer(),
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              title,
              style: TextStyle(
                fontSize: 12,
                color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
