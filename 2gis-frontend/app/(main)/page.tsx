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
    <div className="relative min-h-screen overflow-hidden">
      {/* Background orbs */}
      <div className="orb w-[600px] h-[600px] bg-brand-500/8 dark:bg-brand-500/5 -top-60 -right-40" />
      <div className="orb w-[500px] h-[500px] bg-purple-500/8 dark:bg-purple-500/5 -bottom-40 -left-40" />

      {/* Topbar */}
      <header className="relative z-10 flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold gradient-text text-sm hidden sm:block">City Guide AI</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          {user && (
            <Link href="/profile" className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {user.full_name.charAt(0).toUpperCase()}
            </Link>
          )}
        </div>
      </header>

      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-12 pb-24">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
            className="inline-flex items-center gap-2 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-full px-4 py-1.5 text-xs font-semibold mb-5 border border-brand-500/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered City Guide
          </motion.div>

          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4">
            Find the{" "}
            <span className="gradient-text">perfect place</span>
            <br />
            in Astana
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-lg mx-auto">
            Describe what you&apos;re looking for in plain language. Our AI finds and ranks the best places just for you.
          </p>
        </motion.div>

        {/* Search box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-8"
        >
          <div className="relative flex items-center rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-lg shadow-black/5 dark:shadow-black/20 focus-within:border-brand-400 focus-within:shadow-brand-500/10 transition-all">
            <Search className="absolute left-4 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="I want delicious sushi near Astana IT University under 10,000 ₸…"
              className="w-full bg-transparent text-sm pl-11 pr-32 py-4 outline-none placeholder:text-muted-foreground/70"
              id="main-search-input"
            />
            <button
              onClick={() => handleSearch()}
              className="absolute right-2 flex items-center gap-2 bg-gradient-to-r from-brand-500 to-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm hover:shadow-brand-500/30 hover:shadow-md transition-all"
            >
              Search
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Popular prompts */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-10"
        >
          <div className="flex flex-wrap gap-2 justify-center">
            {POPULAR_PROMPTS.map((p) => (
              <button
                key={p.text}
                onClick={() => handleSearch(p.text)}
                className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] hover:border-brand-400 hover:bg-brand-500/5 hover:text-brand-600 dark:hover:text-brand-400 transition-all shadow-sm"
              >
                <span>{p.emoji}</span>
                {p.text}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Categories */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-500" />
              Browse Categories
            </h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                onClick={() => handleSearch(cat.label + " in Astana")}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-[hsl(var(--border))] hover:border-transparent hover:shadow-lg transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform`}>
                  {cat.emoji}
                </div>
                <span className="text-xs font-medium">{cat.label}</span>
              </button>
            ))}
          </div>
        </motion.section>

        {/* Recent searches */}
        {recentSearches.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-500" />
                Recent Searches
              </h2>
              <Link href="/history" className="text-xs text-brand-500 hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-2">
              {recentSearches.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSearch(item.query)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] hover:border-brand-400/60 hover:bg-brand-500/3 text-left transition-all group"
                >
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate flex-1">{item.query}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
