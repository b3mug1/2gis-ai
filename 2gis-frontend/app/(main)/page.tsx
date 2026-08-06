"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Sparkles, TrendingUp, Clock, ArrowRight, MapPin } from "lucide-react";
import { useHistory } from "@/hooks/useHistory";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";
import { useAuth } from "@/features/auth/AuthContext";
import Link from "next/link";

const POPULAR_PROMPTS = [
  { emoji: "🍣", text: "Best sushi under 10,000 ₸" },
  { emoji: "☕", text: "Quiet café to work from" },
  { emoji: "❤️", text: "Romantic dinner for two" },
  { emoji: "👨‍👩‍👧", text: "Restaurant for a group" },
  { emoji: "🌃", text: "Rooftop bar with a view" },
  { emoji: "🥗", text: "Healthy lunch spots" },
];

const CATEGORIES = [
  { emoji: "🍜", label: "Restaurants", color: "from-orange-400 to-rose-500" },
  { emoji: "☕", label: "Cafes", color: "from-amber-400 to-orange-500" },
  { emoji: "🍺", label: "Bars", color: "from-yellow-400 to-amber-500" },
  { emoji: "🍕", label: "Fast Food", color: "from-red-400 to-rose-500" },
  { emoji: "🧁", label: "Bakeries", color: "from-pink-400 to-rose-400" },
  { emoji: "🌿", label: "Healthy", color: "from-green-400 to-emerald-500" },
];

export default function HomePage() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { data: history } = useHistory();
  const { user } = useAuth();

  function handleSearch(q?: string) {
    const finalQuery = q ?? query;
    if (!finalQuery.trim()) return;
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
            <Link href="/profile" className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-brand-500/20 hover:scale-105 transition-transform">
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
            AI-Powered Smart Search for Astana
          </motion.div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.15] mb-5 text-foreground">
            Find the <span className="gradient-text">perfect place</span>
            <br />
            in Astana
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
            Ask in natural language. Our AI finds, ranks, and maps the best restaurants, cafes, and spots tailored to you.
          </p>
        </motion.div>

        {/* Minimalist Floating Glass Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="relative mb-8"
        >
          <div className="relative flex items-center rounded-2xl border border-[hsl(var(--border))] bg-card/90 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/30 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10 transition-all duration-300">
            <Search className="absolute left-4.5 w-5 h-5 text-muted-foreground/80" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Sushi near Astana IT University under 10,000 ₸…"
              className="w-full bg-transparent text-sm sm:text-base pl-12 pr-36 py-4.5 outline-none placeholder:text-muted-foreground/60 text-foreground"
              id="main-search-input"
            />
            <button
              onClick={() => handleSearch()}
              className="absolute right-2.5 flex items-center gap-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-brand-500/25 hover:shadow-lg hover:shadow-brand-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              Search
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Popular Prompts Pills */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-12"
        >
          <div className="flex flex-wrap gap-2.5 justify-center">
            {POPULAR_PROMPTS.map((p) => (
              <button
                key={p.text}
                onClick={() => handleSearch(p.text)}
                className="flex items-center gap-2 text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-[hsl(var(--border)/0.8)] bg-card/60 hover:bg-card hover:border-brand-500/40 hover:text-brand-500 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <span>{p.emoji}</span>
                <span className="font-medium">{p.text}</span>
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
              Categories
            </h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                onClick={() => handleSearch(cat.label + " in Astana")}
                className="flex flex-col items-center gap-2.5 p-3.5 rounded-2xl border border-[hsl(var(--border)/0.8)] bg-card/60 hover:bg-card hover:border-brand-500/30 hover:shadow-lg transition-all duration-200 group"
              >
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                  {cat.emoji}
                </div>
                <span className="text-xs font-semibold text-foreground/90">{cat.label}</span>
              </button>
            ))}
          </div>
        </motion.section>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-brand-500" />
                Recent Searches
              </h2>
              <Link href="/history" className="text-xs font-semibold text-brand-500 hover:underline">
                View all
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

