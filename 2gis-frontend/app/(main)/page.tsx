"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  MapPin,
  Search,
  Sparkles,
  Star,
  UtensilsCrossed,
  Wand2,
} from "lucide-react";
import { useHistory } from "@/hooks/useHistory";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";
import { useAuth } from "@/features/auth/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { discoverService } from "@/services/discoverService";
import type { PlaceRecommendation } from "@/types/api";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [popularPlaces, setPopularPlaces] = useState<PlaceRecommendation[]>([]);
  const router = useRouter();
  const { data: history } = useHistory();
  const { user } = useAuth();
  const { t } = useLanguage();
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const suggestTimeout = useRef<NodeJS.Timeout | null>(null);

  const categories = [
    { label: t.home.catLabels.restaurants, count: "240+", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80" },
    { label: t.home.catLabels.cafes, count: "180+", image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=80" },
    { label: t.home.catLabels.bars, count: "95+", image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=900&q=80" },
    { label: t.home.catLabels.fastfood, count: "150+", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80" },
    { label: t.home.catLabels.bakeries, count: "70+", image: "https://images.unsplash.com/photo-1559553156-2e97137af16f?auto=format&fit=crop&w=900&q=80" },
    { label: t.home.catLabels.healthy, count: "45+", image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=80" },
  ];

  useEffect(() => {
    discoverService.getPopular(6).then(setPopularPlaces).catch(() => setPopularPlaces([]));
  }, []);

  useEffect(() => {
    if (suggestTimeout.current) clearTimeout(suggestTimeout.current);
    if (query.trim().length < 2) {
      return;
    }

    suggestTimeout.current = setTimeout(async () => {
      const results = await discoverService.suggest(query.trim(), 5);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    }, 220);
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

  function handleSearch(nextQuery?: string) {
    const finalQuery = (nextQuery ?? query).trim();
    if (!finalQuery) return;
    setShowSuggestions(false);
    router.push(`/chat?q=${encodeURIComponent(finalQuery)}`);
  }

  const recentSearches = history?.slice(0, 4) ?? [];
  const featuredPlace = popularPlaces[0];
  const featuredCategories = categories.slice(0, 4);

  return (
    <div className="premium-shell min-h-screen text-[hsl(var(--foreground))]">
      <header className="sticky top-0 z-30 border-b border-[hsl(var(--border))] backdrop-blur-2xl" style={{ backgroundColor: "hsl(var(--background) / 0.75)" }}>
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{t.home.badge}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight">City Guide</span>
                <span className="text-sm font-semibold tracking-tight text-[hsl(var(--primary))]">AI</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            {user ? (
              <button
                onClick={() => router.push("/profile")}
                className="hidden items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.86)] px-3.5 py-2 text-xs font-semibold text-foreground transition-transform hover:-translate-y-0.5 sm:inline-flex"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--secondary))] text-[11px] font-bold">
                  {user.full_name.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[120px] truncate">{user.full_name}</span>
              </button>
            ) : (
              <button
                onClick={() => router.push("/chat")}
                className="hidden btn-minimal btn-minimal-primary text-xs uppercase tracking-[0.16em] sm:inline-flex"
              >
                {t.home.navStart}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <section className="grid min-h-[calc(100vh-4rem)] grid-cols-1 items-center gap-10 py-10 lg:grid-cols-12 lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="lg:col-span-7"
          >
            <div className="space-y-6">
              <span className="section-eyebrow">
                <Sparkles className="h-3.5 w-3.5" />
                {t.home.badge}
              </span>

              <div className="space-y-4">
                <h1 className="hero-title max-w-3xl text-balance text-foreground">
                  {t.home.heroTitle1}
                  <span className="text-[hsl(var(--primary))]">{t.home.heroTitle2}</span>
                  {t.home.heroTitle3}
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">{t.home.heroSubtitle}</p>
              </div>

              <div className="relative max-w-2xl" ref={searchWrapRef}>
                <div className="premium-input-shell flex items-center gap-3 p-2.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]">
                    <Search className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setQuery(nextValue);
                      if (nextValue.trim().length < 2) {
                        setSuggestions([]);
                        setShowSuggestions(false);
                      }
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    placeholder={t.home.placeholder}
                    className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 sm:text-base"
                  />
                  <button onClick={() => handleSearch()} className="btn-minimal btn-minimal-primary shrink-0 px-4 text-xs uppercase tracking-[0.16em]">
                    <span>{t.home.searchBtn}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="absolute left-0 right-0 top-full z-50 mt-3 overflow-hidden rounded-[1.25rem] border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.96)] shadow-[0_24px_80px_-40px_hsl(0_0%_0%/0.55)] backdrop-blur-xl"
                    >
                      <div className="border-b border-[hsl(var(--border))] px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                          {t.home.searchBtn}
                        </p>
                      </div>
                      <div className="divide-y divide-[hsl(var(--border))]">
                        {suggestions.map((item, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setQuery(item);
                              handleSearch(item);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-[hsl(var(--secondary)/0.7)]"
                          >
                            <Search className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--primary))]" />
                            <span className="truncate">{item}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex flex-wrap gap-2">
                {t.home.popularPrompts.slice(0, 3).map((promptText) => (
                  <button
                    key={promptText}
                    onClick={() => handleSearch(promptText)}
                    className="premium-chip transition-transform hover:-translate-y-0.5 hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]"
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                    {promptText}
                  </button>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="premium-card p-4">
                  <div className="text-2xl font-bold tracking-tight text-[hsl(var(--primary))]">{t.home.stats1Val}</div>
                  <p className="mt-1 text-sm font-semibold text-foreground">{t.home.stats1Label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t.home.stats1Sub}</p>
                </div>
                <div className="premium-card p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    <Compass className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                    {t.home.stats2Title}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">{t.home.stats2Sub}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t.home.ribbonRoutes}</p>
                </div>
                <div className="premium-card p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                    {t.home.ribbonReviews}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">{t.home.ribbonAI}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t.home.ribbon2GIS}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:col-span-5"
          >
            <div className="surface-panel relative overflow-hidden">
              <div className="subtle-grid absolute inset-0 opacity-35" />
              <div className="relative p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="premium-chip premium-chip-active">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t.home.topPickTag}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {t.home.viewAll}
                  </span>
                </div>

                <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-[hsl(var(--border))] bg-[hsl(var(--secondary))]">
                  <div className="relative h-[360px]">
                    <img
                      src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80"
                      alt="Astana food and dining"
                      className="h-full w-full object-cover grayscale-[10%] transition-transform duration-700 hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--background))] via-[hsl(var(--background)/0.18)] to-transparent" />
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="premium-card p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      {t.home.stats1Label}
                    </p>
                    <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">{t.home.stats1Val}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{t.home.stats1Sub}</p>
                  </div>
                  <div className="premium-card p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      {t.home.stats2Title}
                    </p>
                    <div className="mt-2 text-sm font-semibold text-foreground">{t.home.stats2Sub}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{t.home.ribbonRoutes}</p>
                  </div>
                </div>

                {featuredPlace && (
                  <div className="mt-4 premium-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                          {t.home.topPickTitle}
                        </p>
                        <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">{featuredPlace.name}</h2>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {featuredPlace.address || featuredPlace.categories[0] || t.home.topPickAll}
                        </p>
                      </div>
                      <div className="rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 py-1 text-xs font-semibold text-foreground">
                        {featuredPlace.rating ? featuredPlace.rating.toFixed(1) : "—"}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {featuredCategories.map((cat) => (
                    <button
                      key={cat.label}
                      onClick={() => handleSearch(`${cat.label} Астана`)}
                      className="premium-chip transition-transform hover:-translate-y-0.5 hover:border-[hsl(var(--primary))]"
                    >
                      <span className="h-2 w-2 rounded-full bg-[hsl(var(--primary))]" />
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="py-6 sm:py-8">
          <div className="premium-card flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--primary))]" />
              <span>{t.home.ribbonAI}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--primary))]" />
              <span>{t.home.ribbon2GIS}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--primary))]" />
              <span>{t.home.ribbonRoutes}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--primary))]" />
              <span>{t.home.ribbonReviews}</span>
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="space-y-4 lg:col-span-5">
              <span className="section-eyebrow">{t.home.aboutTag}</span>
              <h2 className="section-title max-w-xl text-foreground">{t.home.aboutTitle}</h2>
              <p className="max-w-xl text-base leading-7 text-muted-foreground">{t.home.aboutDesc}</p>
              <div className="pt-2">
                <button
                  onClick={() => router.push("/chat")}
                  className="btn-minimal btn-minimal-primary text-xs uppercase tracking-[0.16em]"
                >
                  {t.home.aboutBtn}
                </button>
              </div>
            </div>

            <div className="grid gap-4 lg:col-span-7 sm:grid-cols-2">
              <div className="overflow-hidden rounded-[1.5rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[0_18px_50px_-34px_hsl(0_0%_0%/0.45)]">
                <img
                  src="https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=900&q=80"
                  alt="Dining experience"
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                />
              </div>
              <div className="overflow-hidden rounded-[1.5rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[0_18px_50px_-34px_hsl(0_0%_0%/0.45)] sm:mt-10">
                <img
                  src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=900&q=80"
                  alt="Coffee and work"
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-16">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <span className="section-eyebrow">{t.home.catTag}</span>
              <h2 className="section-title mt-4 text-foreground">{t.home.catTitle}</h2>
            </div>
            <button
              onClick={() => router.push("/chat")}
              className="hidden items-center gap-1 text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--primary))] hover:underline sm:inline-flex"
            >
              <span>{t.home.viewAll}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            {categories.map((cat, index) => (
              <motion.button
                key={cat.label}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                onClick={() => handleSearch(`${cat.label} Астана`)}
                className="group overflow-hidden rounded-[1.5rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-left shadow-[0_18px_50px_-34px_hsl(0_0%_0%/0.45)]"
              >
                <div className="relative h-40 overflow-hidden">
                  <img src={cat.image} alt={cat.label} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--background))] via-transparent to-transparent opacity-90" />
                  <div className="absolute left-3 top-3 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.9)] px-2.5 py-1 text-[11px] font-semibold text-foreground backdrop-blur-md">
                    {cat.count}
                  </div>
                </div>
                <div className="space-y-1 p-4">
                  <h3 className="text-sm font-semibold tracking-tight text-foreground transition-colors group-hover:text-[hsl(var(--primary))]">
                    {cat.label}
                  </h3>
                  <p className="text-xs text-muted-foreground">{index % 2 === 0 ? t.home.aboutDesc : t.home.heroSubtitle}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {popularPlaces.length > 0 && (
          <section className="py-10 sm:py-16">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <span className="section-eyebrow">{t.home.topPickTag}</span>
                <h2 className="section-title mt-4 text-foreground">{t.home.topPickTitle}</h2>
              </div>
              <Link
                href="/chat?q=%D0%BF%D0%BE%D0%BF%D1%83%D0%BB%D1%8F%D1%80%D0%BD%D1%8B%D0%B5%20%D0%BC%D0%B5%D1%81%D1%82%D0%B0%20%D0%90%D1%81%D1%82%D0%B0%D0%BD%D0%B0"
                className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--primary))] hover:underline"
              >
                <span>{t.home.topPickAll}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {popularPlaces.slice(0, 6).map((place) => (
                <motion.button
                  key={place.place_id}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => handleSearch(place.name)}
                  className="group overflow-hidden rounded-[1.5rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-left shadow-[0_18px_50px_-34px_hsl(0_0%_0%/0.45)]"
                >
                  <div className="relative h-48 overflow-hidden">
                    {place.photos && place.photos[0] ? (
                      <img
                        src={place.photos[0]}
                        alt={place.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[hsl(var(--secondary))]">
                        <UtensilsCrossed className="h-7 w-7 text-[hsl(var(--primary))]" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--background))] via-transparent to-transparent opacity-90" />
                    {place.rating && (
                      <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.92)] px-2.5 py-1 text-[11px] font-semibold text-foreground backdrop-blur-md">
                        <Star className="h-3 w-3 fill-[hsl(var(--primary))] text-[hsl(var(--primary))]" />
                        {place.rating.toFixed(1)}
                      </div>
                    )}
                    <div className="absolute left-3 bottom-3 max-w-[85%]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {place.categories[0] || "Venue"}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold tracking-tight text-foreground">{place.name}</h3>
                    </div>
                  </div>

                  <div className="space-y-4 p-4">
                    <p className="line-clamp-2 text-sm text-muted-foreground">{place.reason || place.address || t.home.aboutDesc}</p>

                    <div className="flex items-center justify-between border-t border-[hsl(var(--border))] pt-3 text-xs">
                      <span className="font-medium text-[hsl(var(--primary))]">{place.categories[0] || "Venue"}</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                        <span>{t.home.searchBtn}</span>
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {recentSearches.length > 0 && (
          <section className="py-10 sm:py-16">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                {t.home.recentTitle}
              </h2>
              <Link href="/history" className="text-xs font-semibold text-[hsl(var(--primary))] hover:underline">
                {t.home.recentHistory}
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSearch(item.query)}
                  className="premium-chip transition-transform hover:-translate-y-0.5 hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span className="max-w-[220px] truncate">{item.query}</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
