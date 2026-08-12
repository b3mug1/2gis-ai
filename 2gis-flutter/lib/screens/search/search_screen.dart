import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../state/search_provider.dart';
import '../../state/map_provider.dart';
import '../../widgets/category_chip.dart';
import '../../widgets/place_card.dart';
import '../../widgets/place_details_sheet.dart';

class SearchScreen extends StatefulWidget {
  final Function(int) onTabChange;

  const SearchScreen({super.key, required this.onTabChange});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _searchController = TextEditingController();

  final List<Map<String, dynamic>> _categories = [
    {'name': 'Все', 'icon': Icons.explore},
    {'name': 'Рестораны', 'icon': Icons.restaurant},
    {'name': 'Кофейни', 'icon': Icons.local_cafe},
    {'name': 'Парки', 'icon': Icons.park},
    {'name': 'Музеи', 'icon': Icons.account_balance},
    {'name': 'Отели', 'icon': Icons.hotel},
  ];

  final List<String> _quickPrompts = [
    'Где поесть вкусные бургеры',
    'Тихий парк для вечерней прогулки',
    'Уютная кофейня с Wi-Fi для работы',
    'Лучшие места для семейного отдыха',
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchSubmitted(String query) {
    if (query.trim().isEmpty) return;
    final provider = Provider.of<SearchProvider>(context, listen: false);
    provider.performSearch(query);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final searchProvider = Provider.of<SearchProvider>(context);
    final mapProvider = Provider.of<MapProvider>(context, listen: false);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.explore, color: AppTheme.primaryGreen),
            const SizedBox(width: 8),
            const Text('2GIS AI Guide', style: TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
      ),
      body: Column(
        children: [
          // Search Header Area
          Container(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
            color: isDark ? AppTheme.darkSurface : AppTheme.lightSurface,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: _searchController,
                  onSubmitted: _onSearchSubmitted,
                  textInputAction: TextInputAction.search,
                  decoration: InputDecoration(
                    hintText: 'Попросите ИИ найти идеальное место...',
                    prefixIcon: const Icon(Icons.auto_awesome, color: AppTheme.primaryGreen),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 20),
                            onPressed: () {
                              _searchController.clear();
                              searchProvider.clearResults();
                              setState(() {});
                            },
                          )
                        : IconButton(
                            icon: const Icon(Icons.send, color: AppTheme.primaryGreen),
                            onPressed: () => _onSearchSubmitted(_searchController.text),
                          ),
                  ),
                  onChanged: (val) {
                    setState(() {});
                  },
                ),
                const SizedBox(height: 12),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _categories.map((cat) {
                      final isSelected = searchProvider.selectedCategory == cat['name'];
                      return CategoryChip(
                        label: cat['name'],
                        icon: cat['icon'],
                        isSelected: isSelected,
                        onTap: () {
                          searchProvider.setSelectedCategory(cat['name']);
                          if (cat['name'] != 'Все') {
                            _searchController.text = cat['name'];
                            _onSearchSubmitted(cat['name']);
                          }
                        },
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),

          // Content Area
          Expanded(
            child: searchProvider.isSearching
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircularProgressIndicator(color: AppTheme.primaryGreen),
                        SizedBox(height: 16),
                        Text('ИИ анализирует места в городе...', style: TextStyle(fontSize: 14)),
                      ],
                    ),
                  )
                : searchProvider.places.isEmpty && searchProvider.currentQuery.isEmpty
                    ? ListView(
                        padding: const EdgeInsets.all(16),
                        children: [
                          Text(
                            'Быстрые подсказки',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary,
                            ),
                          ),
                          const SizedBox(height: 12),
                          ..._quickPrompts.map((prompt) => Container(
                                margin: const EdgeInsets.only(bottom: 8),
                                child: InkWell(
                                  onTap: () {
                                    _searchController.text = prompt;
                                    _onSearchSubmitted(prompt);
                                  },
                                  borderRadius: BorderRadius.circular(12),
                                  child: Container(
                                    padding: const EdgeInsets.all(14),
                                    decoration: BoxDecoration(
                                      color: isDark ? AppTheme.darkSurfaceCard : AppTheme.lightSurfaceCard,
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                        color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder,
                                      ),
                                    ),
                                    child: Row(
                                      children: [
                                        const Icon(Icons.search, size: 18, color: AppTheme.primaryGreen),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: Text(
                                            prompt,
                                            style: const TextStyle(fontSize: 14),
                                          ),
                                        ),
                                        const Icon(Icons.arrow_forward_ios, size: 12, color: Colors.grey),
                                      ],
                                    ),
                                  ),
                                ),
                              )),
                        ],
                      )
                    : ListView(
                        padding: const EdgeInsets.all(16),
                        children: [
                          if (searchProvider.aiSummary.isNotEmpty) ...[
                            Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: AppTheme.primaryGreen.withOpacity(0.12),
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: AppTheme.primaryGreen.withOpacity(0.3)),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Icon(Icons.auto_awesome, color: AppTheme.primaryGreen, size: 22),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(
                                      searchProvider.aiSummary,
                                      style: TextStyle(
                                        fontSize: 13.5,
                                        height: 1.4,
                                        color: isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 16),
                          ],
                          Text(
                            'Найдено мест: ${searchProvider.places.length}',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
                            ),
                          ),
                          const SizedBox(height: 12),
                          ...searchProvider.places.map(
                            (place) => PlaceCard(
                              place: place,
                              onTap: () {
                                PlaceDetailsSheet.show(context, place);
                              },
                              onMapShow: () {
                                mapProvider.selectPlace(place);
                                widget.onTabChange(1); // Switch to Map tab
                              },
                            ),
                          ),
                        ],
                      ),
          ),
        ],
      ),
    );
  }
}
