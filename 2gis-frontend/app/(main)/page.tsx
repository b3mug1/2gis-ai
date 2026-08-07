"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Sparkles,
  TrendingUp,
  Clock,
  ArrowRight,
  MapPin,
  Utensils,
  Coffee,
  Beer,
  Pizza,
  Cake,
  Heart,
  UtensilsCrossed,
  Star,
} from "lucide-react";
import { useHistory } from "@/hooks/useHistory";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";
import { useAuth } from "@/features/auth/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { discoverService } from "@/services/discoverService";
import type { PlaceRecommendation } from "@/types/api";
import Link from "next/link";
import { cn } from "@/utils/cn";

// Lucide doesn't have "Fire" so use TrendingUp as alias
const FireIcon = TrendingUp;

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [popularPlaces, setPopularPlaces] = useState<PlaceRecommendation[]>([]);
  const router = useRouter();
  const { data: history } = useHistory();
  const { user } = useAuth();
  const { t } = useLanguage();
  const suggestTimeout = useRef<NodeJS.Timeout | null>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  const CATEGORIES = [
    { icon: UtensilsCrossed, label: t.home.catLabels.restaurants, color: "from-orange-500 to-rose-500" },
    { icon: Coffee, label: t.home.catLabels.cafes, color: "from-amber-500 to-orange-500" },
    { icon: Beer, label: t.home.catLabels.bars, color: "from-yellow-500 to-amber-500" },
    { icon: Pizza, label: t.home.catLabels.fastfood, color: "from-red-500 to-rose-500" },
    { icon: Cake, label: t.home.catLabels.bakeries, color: "from-pink-500 to-rose-400" },
    { icon: Heart, label: t.home.catLabels.healthy, color: "from-emerald-500 to-teal-500" },
  ];

  // Load popular places on mount
  useEffect(() => {
    discoverService.getPopular(6).then(setPopularPlaces).catch(() => setPopularPlaces([]));
  }, []);

  // Autocomplete
  useEffect(() => {
    if (suggestTimeout.current) clearTimeout(suggestTimeout.current);
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    suggestTimeout.current = setTimeout(async () => {
      const results = await discoverService.suggest(query.trim(), 5);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    }, 300);
  }, [query]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSearch(q?: string) {
    const finalQuery = q ?? query;
    if (!finalQuery.trim()) return;
    setShowSuggestions(false);
    router.push(`/chat?q=${encodeURIComponent(finalQuery.trim())}`);
  }

  const recentSearches = history?.slice(0, 4) ?? [];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Subtle Glowing Background Orbs */}
      <div className="orb w-[600px] h-[600px] bg-brand-500/10 dark:bg-brand-500/10 -top-60 -right-40 animate-pulse-subtle" />
      <div className="orb w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-500/10 -bottom-40 -left-40 animate-pulse-subtle" />

      {/* Top Header Navigation */}
      <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 h-20 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/25">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight gradient-text">City Guide AI</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          {user && (
            <Link
              href="/profile"
              className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-brand-500/20 hover:scale-105 transition-transform"
            >
              {user.full_name.charAt(0).toUpperCase()}
            </Link>
          )}
        </div>
      </header>

      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-10 pb-28">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
            className="inline-flex items-center gap-2 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-full px-4 py-1.5 text-xs font-semibold mb-6 border border-brand-500/20 backdrop-blur-md shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {t.home.badge}
          </motion.div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.15] mb-5 text-foreground">
            {t.home.heroTitle1}<span className="gradient-text">{t.home.heroTitle2}</span>
            <br />
            {t.home.heroTitle3}
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
            {t.home.heroSubtitle}
          </p>
        </motion.div>

        {/* Search Bar with Autocomplete */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="relative mb-8"
          ref={searchWrapRef}
        >
          <div className="relative flex items-center rounded-2xl border border-[hsl(var(--border))] bg-card/90 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/30 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10 transition-all duration-300">
            <Search className="absolute left-4.5 w-5 h-5 text-muted-foreground/80" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder={t.home.placeholder}
              className="w-full bg-transparent text-sm sm:text-base pl-12 pr-36 py-4.5 outline-none placeholder:text-muted-foreground/60 text-foreground"
              id="main-search-input"
            />
            <button
              onClick={() => handleSearch()}
              className="absolute right-2.5 flex items-center gap-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-brand-500/25 hover:shadow-lg hover:shadow-brand-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              {t.home.searchBtn}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Autocomplete Dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border border-[hsl(var(--border))] bg-card shadow-xl shadow-black/10 dark:shadow-black/30 overflow-hidden"
              >
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setQuery(s); handleSearch(s); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-foreground hover:bg-muted/60 transition-colors border-b border-[hsl(var(--border)/0.5)] last:border-0"
                  >
                    <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{s}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Popular Prompts Pills */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-12"
        >
          <div className="flex flex-wrap gap-2.5 justify-center">
            {t.home.popularPrompts.map((promptText) => (
              <button
                key={promptText}
                onClick={() => handleSearch(promptText)}
                className="flex items-center gap-2 text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-[hsl(var(--border)/0.8)] bg-card/60 hover:bg-card hover:border-brand-500/40 hover:text-brand-500 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <span className="font-medium">{promptText}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Minimal Categories Grid */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-brand-500" />
              {t.home.categories}
            </h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {CATEGORIES.map((cat) => {
              const IconComponent = cat.icon;
              return (
                <button
                  key={cat.label}
                  onClick={() => handleSearch(cat.label + " в Астане")}
                  className="flex flex-col items-center gap-2.5 p-3.5 rounded-2xl border border-[hsl(var(--border)/0.8)] bg-card/60 hover:bg-card hover:border-brand-500/30 hover:shadow-lg transition-all duration-200 group"
                >
                  <div
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform duration-200`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-foreground/90">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </motion.section>

        {/* Popular Now Section */}
        {popularPlaces.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2">
                <FireIcon className="w-3.5 h-3.5 text-orange-500" />
                {t.home.popularNow}
              </h2>
              <Link href="/chat?q=популярные места Астана" className="text-xs font-semibold text-brand-500 hover:underline">
                {t.home.viewAll}
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {popularPlaces.slice(0, 4).map((place, i) => (
                <motion.button
                  key={place.place_id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.28 + i * 0.04 }}
                  onClick={() => handleSearch(place.name)}
                  className="group flex items-start gap-3 p-3.5 rounded-2xl border border-[hsl(var(--border)/0.8)] bg-card/60 hover:bg-card hover:border-brand-500/30 hover:shadow-lg transition-all duration-200 text-left"
                >
                  {/* Thumbnail or gradient placeholder */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-brand-400/30 to-purple-400/30">
                    {place.photos && place.photos[0] ? (
                      <img src={place.photos[0]} alt={place.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Utensils className="w-5 h-5 text-brand-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground group-hover:text-brand-500 transition-colors truncate">
                      {place.name}
                    </p>
                    {place.address && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{place.address}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      {place.rating && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500">
                          <Star className="w-3 h-3 fill-amber-500" />
                          {place.rating.toFixed(1)}
                        </span>
                      )}
                      {place.categories[0] && (
                        <span className="text-[11px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                          {place.categories[0]}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                </motion.button>
              ))}
            </div>
          </motion.section>
        )}

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-brand-500" />
                {t.home.recentSearches}
              </h2>
              <Link href="/history" className="text-xs font-semibold text-brand-500 hover:underline">
                {t.home.viewAll}
              </Link>
            </div>
            <div className="space-y-2">
              {recentSearches.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSearch(item.query)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[hsl(var(--border)/0.7)] bg-card/50 hover:bg-card hover:border-brand-500/40 text-left transition-all duration-200 group"
                >
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium truncate flex-1 text-foreground/90">{item.query}</span>
                  <ArrowRight className="w-4 h-4 text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
