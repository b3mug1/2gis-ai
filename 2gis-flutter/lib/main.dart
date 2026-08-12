import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'config/app_theme.dart';
import 'screens/main_layout.dart';
import 'state/auth_provider.dart';
import 'state/search_provider.dart';
import 'state/map_provider.dart';
import 'state/favorites_provider.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const CityGuideApp());
}

class CityGuideApp extends StatelessWidget {
  const CityGuideApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => SearchProvider()),
        ChangeNotifierProvider(create: (_) => MapProvider()),
        ChangeNotifierProvider(create: (_) => FavoritesProvider()),
      ],
      child: MaterialApp(
        title: '2GIS AI City Guide',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,
        home: const MainLayout(),
      ),
    );
  }
}
