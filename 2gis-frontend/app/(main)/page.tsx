"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Sparkles,
  Clock,
  ArrowRight,
  MapPin,
  UtensilsCrossed,
  Star,
  Compass,
  CheckCircle2,
} from "lucide-react";
import { useHistory } from "@/hooks/useHistory";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";
import { useAuth } from "@/features/auth/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { discoverService } from "@/services/discoverService";
import type { PlaceRecommendation } from "@/types/api";
import Link from "next/link";

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
    { labelKey: t.home.catLabels.restaurants, count: "240+", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80" },
    { labelKey: t.home.catLabels.cafes, count: "180+", image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80" },
    { labelKey: t.home.catLabels.bars, count: "95+", image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80" },
    { labelKey: t.home.catLabels.fastfood, count: "150+", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80" },
    { labelKey: t.home.catLabels.bakeries, count: "70+", image: "https://images.unsplash.com/photo-1559553156-2e97137af16f?auto=format&fit=crop&w=600&q=80" },
    { labelKey: t.home.catLabels.healthy, count: "45+", image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80" },
  ];

  useEffect(() => {
    discoverService.getPopular(6).then(setPopularPlaces).catch(() => setPopularPlaces([]));
  }, []);

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
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* Header Navigation Bar */}
      <header className="relative z-20 flex items-center justify-between px-6 sm:px-10 h-20 border-b border-[hsl(var(--border))] max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground">
            City Guide <span className="text-[hsl(var(--primary))] font-semibold">AI</span>
          </span>
        </div>

        {/* Central Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Link href="/" className="text-[hsl(var(--primary))] font-bold">
            {t.home.navMain}
          </Link>
          <Link href="/chat" className="hover:text-foreground transition-colors">
            {t.home.navAI}
          </Link>
          <Link href="/history" className="hover:text-foreground transition-colors">
            {t.home.navHistory}
          </Link>
          <Link href="/favorites" className="hover:text-foreground transition-colors">
            {t.home.navFav}
          </Link>
        </nav>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <button
            onClick={() => router.push("/chat")}
            className="hidden sm:inline-flex btn-minimal btn-minimal-primary text-xs uppercase tracking-wider"
          >
            {t.home.navStart}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 pt-12 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center gap-2 bg-[hsl(var(--secondary))] text-[hsl(var(--primary))] border border-[hsl(var(--border))] px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              {t.home.badge}
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.1] text-foreground">
              {t.home.heroTitle1}
              <span className="text-[hsl(var(--primary))]">{t.home.heroTitle2}</span>
              {t.home.heroTitle3}
            </h1>

            <p className="text-muted-foreground text-base max-w-xl leading-relaxed">
              {t.home.heroSubtitle}
            </p>

            {/* Input Search */}
            <div className="relative max-w-xl" ref={searchWrapRef}>
              <div className="relative flex items-center rounded-md border border-[hsl(var(--border))] bg-card shadow-xs focus-within:border-[hsl(var(--primary))] transition-all p-1.5">
                <Search className="ml-3 w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder={t.home.placeholder}
                  className="w-full bg-transparent text-sm px-3 py-2 outline-none placeholder:text-muted-foreground/60 text-foreground"
                />
                <button
                  onClick={() => handleSearch()}
                  className="btn-minimal btn-minimal-primary shrink-0 text-xs uppercase"
                >
                  <span>{t.home.searchBtn}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Autocomplete */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full left-0 right-0 mt-2 z-50 rounded-md border border-[hsl(var(--border))] bg-card shadow-lg overflow-hidden"
                  >
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setQuery(s);
                          handleSearch(s);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm text-foreground hover:bg-[hsl(var(--muted))] transition-colors border-b border-[hsl(var(--border))] last:border-0"
                      >
                        <Search className="w-3.5 h-3.5 text-[hsl(var(--primary))] shrink-0" />
                        <span className="truncate">{s}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Popular Quick Tag Pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              {t.home.popularPrompts.slice(0, 3).map((promptText) => (
                <button
                  key={promptText}
                  onClick={() => handleSearch(promptText)}
                  className="text-xs px-3 py-1.5 rounded-md border border-[hsl(var(--border))] bg-card hover:bg-[hsl(var(--secondary))] hover:border-[hsl(var(--primary))] transition-all font-medium text-foreground"
                >
                  {promptText}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Right Column Visual */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative w-full h-[400px] rounded-lg border border-[hsl(var(--border))] overflow-hidden bg-card">
              <img
                src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80"
                alt="Astana Food & Dining"
                className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--background))] via-transparent to-transparent opacity-80" />
            </div>

            {/* Floating Metric Card 1 */}
            <div className="absolute -bottom-4 -left-4 bg-card border border-[hsl(var(--border))] p-4 rounded-md shadow-md max-w-[200px]">
              <div className="text-2xl font-bold text-[hsl(var(--primary))] mb-0.5">{t.home.stats1Val}</div>
              <div className="text-xs font-semibold text-foreground">{t.home.stats1Label}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{t.home.stats1Sub}</p>
            </div>

            {/* Floating Metric Card 2 */}
            <div className="absolute -top-4 -right-4 bg-card border border-[hsl(var(--border))] p-3.5 rounded-md shadow-md flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center font-bold shrink-0">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{t.home.stats2Title}</p>
                <p className="text-[10px] text-muted-foreground">{t.home.stats2Sub}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mint Accent Ribbon Bar */}
      <section className="bg-[hsl(var(--secondary))] border-y border-[hsl(var(--border))] py-4 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs font-medium text-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[hsl(var(--primary))]" />
            <span>{t.home.ribbonAI}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[hsl(var(--primary))]" />
            <span>{t.home.ribbon2GIS}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[hsl(var(--primary))]" />
            <span>{t.home.ribbonRoutes}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[hsl(var(--primary))]" />
            <span>{t.home.ribbonReviews}</span>
          </div>
        </div>
      </section>

      {/* About Us / Capabilities Section */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--primary))]">{t.home.aboutTag}</span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
              {t.home.aboutTitle}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t.home.aboutDesc}
            </p>

            <div className="pt-2">
              <button
                onClick={() => router.push("/chat")}
                className="btn-minimal btn-minimal-primary text-xs uppercase"
              >
                {t.home.aboutBtn}
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <div className="h-56 rounded-md border border-[hsl(var(--border))] overflow-hidden bg-card">
              <img
                src="https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=600&q=80"
                alt="Dining Experience"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="h-56 rounded-md border border-[hsl(var(--border))] overflow-hidden bg-card mt-6">
              <img
                src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=600&q=80"
                alt="Coffee & Work"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 py-16 border-t border-[hsl(var(--border))]">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--primary))]">{t.home.catTag}</span>
            <h2 className="text-2xl font-bold text-foreground mt-0.5">{t.home.catTitle}</h2>
          </div>
          <button
            onClick={() => router.push("/chat")}
            className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--primary))] hover:underline flex items-center gap-1"
          >
            <span>{t.home.viewAll}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.labelKey}
              onClick={() => handleSearch(cat.labelKey + " Астана")}
              className="group flex flex-col rounded-md border border-[hsl(var(--border))] bg-card overflow-hidden text-left hover:border-[hsl(var(--primary))] transition-all"
            >
              <div className="h-32 w-full overflow-hidden relative bg-muted">
                <img src={cat.image} alt={cat.labelKey} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-3 text-center">
                <h3 className="font-semibold text-xs text-foreground group-hover:text-[hsl(var(--primary))] transition-colors">
                  {cat.labelKey}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">{cat.count}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Popular Now Section */}
      {popularPlaces.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 sm:px-10 py-16 border-t border-[hsl(var(--border))]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--primary))]">{t.home.topPickTag}</span>
              <h2 className="text-2xl font-bold text-foreground mt-0.5">{t.home.topPickTitle}</h2>
            </div>
            <Link href="/chat?q=популярные места Астана" className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--primary))] hover:underline">
              {t.home.topPickAll}
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {popularPlaces.slice(0, 6).map((place) => (
              <div
                key={place.place_id}
                onClick={() => handleSearch(place.name)}
                className="group cursor-pointer rounded-md border border-[hsl(var(--border))] bg-card p-4 hover:border-[hsl(var(--primary))] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="h-40 rounded-sm overflow-hidden mb-3 bg-muted relative">
                    {place.photos && place.photos[0] ? (
                      <img src={place.photos[0]} alt={place.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[hsl(var(--secondary))]">
                        <UtensilsCrossed className="w-6 h-6 text-[hsl(var(--primary))]" />
                      </div>
                    )}
                    {place.rating && (
                      <div className="absolute top-2.5 right-2.5 bg-background/90 text-foreground border border-[hsl(var(--border))] px-2 py-0.5 rounded-sm text-[11px] font-semibold flex items-center gap-1">
                        <Star className="w-3 h-3 text-[hsl(var(--primary))] fill-[hsl(var(--primary))]" />
                        {place.rating.toFixed(1)}
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-foreground group-hover:text-[hsl(var(--primary))] transition-colors">
                    {place.name}
                  </h3>
                  {place.address && <p className="text-xs text-muted-foreground mt-0.5 truncate">{place.address}</p>}
                </div>

                <div className="pt-3 mt-3 border-t border-[hsl(var(--border))] flex items-center justify-between text-xs">
                  <span className="font-medium text-[hsl(var(--primary))]">{place.categories[0] || "Заведение"}</span>
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <span>{t.home.searchBtn}</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 sm:px-10 py-12 border-t border-[hsl(var(--border))]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
              {t.home.recentTitle}
            </h2>
            <Link href="/history" className="text-xs font-semibold text-[hsl(var(--primary))] hover:underline">
              {t.home.recentHistory}
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {recentSearches.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSearch(item.query)}
                className="flex items-center justify-between p-3 rounded-md border border-[hsl(var(--border))] bg-card hover:border-[hsl(var(--primary))] transition-colors text-left group"
              >
                <span className="text-xs font-medium text-foreground truncate">{item.query}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[hsl(var(--primary))] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
