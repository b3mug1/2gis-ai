import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../state/favorites_provider.dart';
import '../../state/map_provider.dart';
import '../../widgets/place_card.dart';
import '../../widgets/place_details_sheet.dart';

class FavoritesScreen extends StatefulWidget {
  final Function(int) onTabChange;

  const FavoritesScreen({super.key, required this.onTabChange});

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<FavoritesProvider>(context, listen: false).loadFavorites();
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final favProvider = Provider.of<FavoritesProvider>(context);
    final mapProvider = Provider.of<MapProvider>(context, listen: false);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Избранное', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: favProvider.isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
          : favProvider.favorites.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.favorite_border,
                        size: 64,
                        color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Список избранного пуст',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Сохраняйте понравившиеся места, нажав на сердечко',
                        style: TextStyle(
                          fontSize: 14,
                          color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: favProvider.favorites.length,
                  itemBuilder: (context, index) {
                    final fav = favProvider.favorites[index];
                    if (fav.place == null) return const SizedBox.shrink();

                    return PlaceCard(
                      place: fav.place!,
                      onTap: () {
                        PlaceDetailsSheet.show(context, fav.place!);
                      },
                      onMapShow: () {
                        mapProvider.selectPlace(fav.place!);
                        widget.onTabChange(1);
                      },
                    );
                  },
                ),
    );
  }
}
