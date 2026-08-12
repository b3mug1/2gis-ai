import 'package:flutter/material.dart';
import '../models/place.dart';
import '../models/search_result.dart';
import '../services/search_service.dart';

class SearchProvider extends ChangeNotifier {
  String _currentQuery = '';
  String _aiSummary = '';
  List<Place> _places = [];
  bool _isSearching = false;
  String? _errorMessage;
  String _selectedCategory = 'Все';

  String get currentQuery => _currentQuery;
  String get aiSummary => _aiSummary;
  List<Place> get places => _places;
  bool get isSearching => _isSearching;
  String? get errorMessage => _errorMessage;
  String get selectedCategory => _selectedCategory;

  void setSelectedCategory(String category) {
    _selectedCategory = category;
    notifyListeners();
  }

  Future<void> performSearch(String query) async {
    if (query.trim().isEmpty) return;

    _currentQuery = query;
    _isSearching = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final result = await SearchService.search(query: query);
      _aiSummary = result.summary;
      _places = result.places;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _places = [];
      _aiSummary = '';
    } finally {
      _isSearching = false;
      notifyListeners();
    }
  }

  void clearResults() {
    _currentQuery = '';
    _aiSummary = '';
    _places = [];
    _errorMessage = null;
    notifyListeners();
  }
}
