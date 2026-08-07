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
  UtensilsCrossed,
  Coffee,
  Beer,
  Pizza,
  Cake,
  Heart,
  Star,
  Compass,
  CheckCircle2,
} from "lucide-react";
import { useHistory } from "@/hooks/useHistory";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
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
    <div className="relative min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] selection:bg-brand-400 selection:text-black">
      {/* Background Ambient Glowing Orbs */}
      <div className="orb w-[650px] h-[650px] bg-brand-400/15 -top-60 -right-40 animate-pulse-subtle" />
      <div className="orb w-[550px] h-[550px] bg-brand-500/10 -bottom-40 -left-40 animate-pulse-subtle" />

      {/* Breakpoint Style Navigation Bar */}
      <header className="relative z-20 flex items-center justify-between px-6 sm:px-12 h-24 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-400 flex items-center justify-center shadow-lg shadow-brand-400/30 text-black">
            <MapPin className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-foreground uppercase">
            City Guide <span className="text-brand-400">AI</span>
          </span>
        </div>

        {/* Central Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Link href="/" className="text-brand-400 hover:text-brand-300 transition-colors">
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

        {/* Controls: Theme Switcher + CTA */}
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
      <section className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 pt-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headlines & Search */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 space-y-8"
          >
            <div className="inline-flex items-center gap-2 bg-brand-400/10 text-brand-400 border border-brand-400/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              {t.home.badge}
            </div>

            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.08] text-foreground">
              {t.home.heroTitle1}<span className="text-brand-400">{t.home.heroTitle2}</span>
              {t.home.heroTitle3}
            </h1>

            <p className="text-muted-foreground text-base sm:text-lg max-w-xl leading-relaxed">
              {t.home.heroSubtitle}
            </p>

            {/* Main Input Search */}
            <div className="relative max-w-xl" ref={searchWrapRef}>
              <div className="relative flex items-center rounded-full border border-[hsl(var(--border))] bg-card/90 backdrop-blur-xl shadow-2xl focus-within:border-brand-400 transition-all p-2">
                <Search className="ml-4 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder={t.home.placeholder}
                  className="w-full bg-transparent text-sm sm:text-base px-4 py-3 outline-none placeholder:text-muted-foreground/60 text-foreground"
                />
                <button
                  onClick={() => handleSearch()}
                  className="btn-minimal btn-minimal-primary shrink-0 text-xs uppercase"
                >
                  <span>{t.home.searchBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Autocomplete */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute top-full left-0 right-0 mt-3 z-50 rounded-2xl border border-[hsl(var(--border))] bg-card shadow-2xl overflow-hidden"
                  >
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setQuery(s);
                          handleSearch(s);
                        }}
                        className="w-full flex items-center gap-3 px-5 py-3.5 text-left text-sm text-foreground hover:bg-muted/80 transition-colors border-b border-[hsl(var(--border)/0.5)] last:border-0"
                      >
                        <Search className="w-4 h-4 text-brand-400 shrink-0" />
                        <span className="truncate">{s}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Popular Quick Tag Pills */}
            <div className="flex flex-wrap gap-2 pt-2">
              {t.home.popularPrompts.slice(0, 3).map((promptText) => (
                <button
                  key={promptText}
                  onClick={() => handleSearch(promptText)}
                  className="text-xs px-4 py-2 rounded-full border border-[hsl(var(--border))] bg-card/60 hover:bg-brand-400 hover:text-black hover:border-brand-400 transition-all font-semibold"
                >
                  {promptText}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Right Column: Hero Visual & Floating Metric Cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            {/* Main Arch Frame Hero Image */}
            <div className="arch-frame relative w-full h-[450px] sm:h-[520px] bg-gradient-to-b from-brand-400/20 to-card border border-[hsl(var(--border))] shadow-2xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80"
                alt="Astana Food & Dining"
                className="w-full h-full object-cover opacity-85 hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--background))] via-transparent to-transparent" />
            </div>

            {/* Floating Metric Card 1 */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="absolute -bottom-6 -left-6 bg-card/95 border border-[hsl(var(--border))] p-5 rounded-3xl shadow-2xl backdrop-blur-xl max-w-[220px]"
            >
              <div className="text-3xl font-extrabold text-brand-400 mb-1">{t.home.stats1Val}</div>
              <div className="text-xs font-bold text-foreground">{t.home.stats1Label}</div>
              <p className="text-[11px] text-muted-foreground mt-1">{t.home.stats1Sub}</p>
            </motion.div>

            {/* Floating Metric Card 2 */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute -top-6 -right-4 bg-card/95 border border-[hsl(var(--border))] p-4 rounded-3xl shadow-2xl backdrop-blur-xl flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-2xl bg-brand-400 text-black flex items-center justify-center font-bold shrink-0">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-foreground">{t.home.stats2Title}</p>
                <p className="text-[10px] text-muted-foreground">{t.home.stats2Sub}</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* BreakPoint Style Mint Accent Ribbon Bar */}
      <section className="teal-ribbon my-12 py-5 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-black" />
            <span>{t.home.ribbonAI}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-black" />
            <span>{t.home.ribbon2GIS}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-black" />
            <span>{t.home.ribbonRoutes}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-black" />
            <span>{t.home.ribbonReviews}</span>
          </div>
        </div>
      </section>

      {/* About Us / Capabilities Section */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-extrabold uppercase tracking-widest text-brand-400">{t.home.aboutTag}</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              {t.home.aboutTitle}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              {t.home.aboutDesc}
            </p>

            <div className="pt-4 flex items-center gap-4">
              <button
                onClick={() => router.push("/chat")}
                className="btn-minimal btn-minimal-primary text-xs uppercase"
              >
                {t.home.aboutBtn}
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <div className="arch-frame h-64 bg-card border border-[hsl(var(--border))] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=600&q=80"
                alt="Dining Experience"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="arch-frame h-64 bg-card border border-[hsl(var(--border))] overflow-hidden mt-8">
              <img
                src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=600&q=80"
                alt="Coffee & Work"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Arched Category Grid */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 py-16 border-t border-[hsl(var(--border))]">
        <div className="flex items-center justify-between mb-10">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-brand-400">{t.home.catTag}</span>
            <h2 className="text-3xl font-extrabold text-foreground mt-1">{t.home.catTitle}</h2>
          </div>
          <button
            onClick={() => router.push("/chat")}
            className="text-xs font-bold uppercase tracking-wider text-brand-400 hover:underline flex items-center gap-1"
          >
            <span>{t.home.viewAll}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat.labelKey}
              whileHover={{ y: -6 }}
              onClick={() => handleSearch(cat.labelKey + " Астана")}
              className="group flex flex-col rounded-3xl border border-[hsl(var(--border))] bg-card overflow-hidden text-left shadow-lg hover:border-brand-400/60 transition-all"
            >
              <div className="arch-frame-sm h-40 w-full overflow-hidden relative">
                <img src={cat.image} alt={cat.labelKey} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
              </div>
              <div className="p-4 text-center">
                <h3 className="font-extrabold text-sm text-foreground group-hover:text-brand-400 transition-colors">
                  {cat.labelKey}
                </h3>
                <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">{cat.count}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Popular Now Section */}
      {popularPlaces.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 sm:px-12 py-16 border-t border-[hsl(var(--border))]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-brand-400">{t.home.topPickTag}</span>
              <h2 className="text-3xl font-extrabold text-foreground mt-1">{t.home.topPickTitle}</h2>
            </div>
            <Link href="/chat?q=популярные места Астана" className="text-xs font-bold uppercase tracking-wider text-brand-400 hover:underline">
              {t.home.topPickAll}
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularPlaces.slice(0, 6).map((place) => (
              <motion.div
                key={place.place_id}
                whileHover={{ y: -4 }}
                onClick={() => handleSearch(place.name)}
                className="group cursor-pointer rounded-3xl border border-[hsl(var(--border))] bg-card p-5 shadow-xl hover:border-brand-400/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 rounded-2xl overflow-hidden mb-4 bg-muted relative">
                    {place.photos && place.photos[0] ? (
                      <img src={place.photos[0]} alt={place.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-brand-400/10">
                        <UtensilsCrossed className="w-8 h-8 text-brand-400" />
                      </div>
                    )}
                    {place.rating && (
                      <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md text-amber-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        {place.rating.toFixed(1)}
                      </div>
                    )}
                  </div>

                  <h3 className="font-extrabold text-lg text-foreground group-hover:text-brand-400 transition-colors">
                    {place.name}
                  </h3>
                  {place.address && <p className="text-xs text-muted-foreground mt-1 truncate">{place.address}</p>}
                </div>

                <div className="pt-4 mt-4 border-t border-[hsl(var(--border))] flex items-center justify-between text-xs">
                  <span className="font-semibold text-brand-400">{place.categories[0] || "Заведение"}</span>
                  <span className="font-bold text-foreground flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>{t.home.searchBtn}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 sm:px-12 py-12 border-t border-[hsl(var(--border))]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs uppercase tracking-wider font-extrabold text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-400" />
              {t.home.recentTitle}
            </h2>
            <Link href="/history" className="text-xs font-bold text-brand-400 hover:underline">
              {t.home.recentHistory}
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentSearches.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSearch(item.query)}
                className="flex items-center justify-between p-4 rounded-2xl border border-[hsl(var(--border))] bg-card hover:border-brand-400 transition-all text-left group"
              >
                <span className="text-xs font-bold text-foreground truncate">{item.query}</span>
                <ArrowRight className="w-3.5 h-3.5 text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
