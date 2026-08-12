import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/app_theme.dart';
import '../models/place.dart';
import '../state/favorites_provider.dart';

class PlaceDetailsSheet extends StatelessWidget {
  final Place place;

  const PlaceDetailsSheet({super.key, required this.place});

  static void show(BuildContext context, Place place) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => PlaceDetailsSheet(place: place),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final favProvider = Provider.of<FavoritesProvider>(context);
    final isFav = favProvider.isFavorite(place.id);

    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkSurface : AppTheme.lightSurface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      place.name,
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.star, color: Colors.amber, size: 18),
                        const SizedBox(width: 4),
                        Text(
                          place.rating.toStringAsFixed(1),
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                        ),
                        const SizedBox(width: 12),
                        Icon(
                          Icons.location_on,
                          size: 16,
                          color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
                        ),
                        const SizedBox(width: 2),
                        Expanded(
                          child: Text(
                            place.address,
                            style: TextStyle(
                              fontSize: 13,
                              color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: Icon(
                  isFav ? Icons.favorite : Icons.favorite_border,
                  color: isFav ? Colors.redAccent : (isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary),
                  size: 28,
                ),
                onPressed: () {
                  favProvider.toggleFavorite(place);
                },
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(),
          Expanded(
            child: ListView(
              children: [
                if (place.description != null && place.description!.isNotEmpty) ...[
                  Text(
                    'Описание',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    place.description!,
                    style: const TextStyle(fontSize: 14, height: 1.4),
                  ),
                  const SizedBox(height: 16),
                ],
                if (place.workingHours != null) ...[
                  _buildDetailRow(
                    context,
                    icon: Icons.access_time,
                    title: 'Время работы',
                    value: place.workingHours!,
                  ),
                  const SizedBox(height: 12),
                ],
                if (place.phone != null) ...[
                  _buildDetailRow(
                    context,
                    icon: Icons.phone,
                    title: 'Телефон',
                    value: place.phone!,
                    onTap: () {
                      launchUrl(Uri.parse('tel:${place.phone}'));
                    },
                  ),
                  const SizedBox(height: 12),
                ],
                if (place.website != null) ...[
                  _buildDetailRow(
                    context,
                    icon: Icons.language,
                    title: 'Веб-сайт',
                    value: place.website!,
                    onTap: () {
                      launchUrl(Uri.parse(place.website!));
                    },
                  ),
                  const SizedBox(height: 12),
                ],
                if (place.tags.isNotEmpty) ...[
                  Text(
                    'Категории и теги',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: place.tags.map((t) {
                      return Chip(
                        label: Text('#$t', style: const TextStyle(fontSize: 12)),
                        backgroundColor: isDark ? AppTheme.darkSurfaceCard : AppTheme.lightSurfaceCard,
                        side: BorderSide(color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder),
                      );
                    }).toList(),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {
                Navigator.pop(context);
                final geoUri = Uri.parse('geo:${place.latitude},${place.longitude}?q=${Uri.encodeComponent(place.name)}');
                launchUrl(geoUri).catchError((_) => false);
              },
              icon: const Icon(Icons.directions),
              label: const Text('Маршрут'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String value,
    VoidCallback? onTap,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppTheme.primaryGreen),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 12,
                  color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
                ),
              ),
              Text(
                value,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: onTap != null ? AppTheme.accentBlue : (isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
