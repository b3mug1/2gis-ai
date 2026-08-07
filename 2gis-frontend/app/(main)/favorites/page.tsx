"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Heart, Trash2, Clock, ExternalLink, ChevronDown, Check } from "lucide-react";
import { useFavorites, useRemoveFavorite } from "@/hooks/useFavorites";
import { EmptyState } from "@/components/shared/EmptyState";
import { CardSkeleton } from "@/components/shared/Skeleton";
import { Rating } from "@/components/shared/Rating";
import { PriceBadge } from "@/components/shared/PriceBadge";
import { timeAgo } from "@/utils/format";
import type { FavoriteResponse } from "@/types/api";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/utils/cn";

type SortKey = "date_desc" | "date_asc" | "name_asc";

const SORT_OPTIONS: { key: SortKey; labelKey: "newest" | "oldest" | "alphabetical" }[] = [
  { key: "date_desc", labelKey: "newest" },
  { key: "date_asc", labelKey: "oldest" },
  { key: "name_asc", labelKey: "alphabetical" },
];

export default function FavoritesPage() {
  const { data: favorites, isLoading } = useFavorites();
  const removeFav = useRemoveFavorite();
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("date_desc");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = (favorites ?? [])
    .filter((f) => f.place_name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sort === "date_desc") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === "date_asc") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sort === "name_asc") return a.place_name.localeCompare(b.place_name);
      return 0;
    });

  const activeSortLabel = t.favorites[SORT_OPTIONS.find((o) => o.key === sort)?.labelKey ?? "newest"];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 relative">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <Heart className="w-5 h-5 fill-rose-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{t.favorites.title}</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {t.favorites.savedCount} {favorites?.length ?? 0}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.favorites.searchPlaceholder}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[hsl(var(--border))] bg-card/60 backdrop-blur-md text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Custom Glass Dropdown */}
        <div className="relative shrink-0" ref={sortRef}>
          <button
            type="button"
            onClick={() => setSortOpen((s) => !s)}
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-[hsl(var(--border))] bg-card/80 backdrop-blur-md text-sm font-medium text-foreground hover:border-brand-500/50 transition-all min-w-[170px]"
          >
            <span>{activeSortLabel}</span>
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", sortOpen && "rotate-180")} />
          </button>

          <AnimatePresence>
            {sortOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 z-50 w-48 rounded-2xl border border-[hsl(var(--border))] bg-card shadow-2xl p-1.5 overflow-hidden"
              >
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setSort(opt.key);
                      setSortOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left",
                      sort === opt.key
                        ? "bg-brand-500/15 text-brand-500"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <span>{t.favorites[opt.labelKey]}</span>
                    {sort === opt.key && <Check className="w-3.5 h-3.5 text-brand-500 shrink-0" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="heart"
          title={searchQuery ? t.history.noMatchTitle : t.favorites.emptyTitle}
          description={
            searchQuery
              ? t.history.noMatchSub
              : t.favorites.emptySub
          }
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid sm:grid-cols-2 gap-5"
        >
          {filtered.map((fav, i) => {
            const payload = fav.payload as {
              rating?: number;
              price_category?: string;
              address?: string;
              reason?: string;
              url_2gis?: string;
            };
            return (
              <motion.div
                key={fav.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-3xl border border-[hsl(var(--border))] bg-card/70 backdrop-blur-sm p-6 hover:shadow-xl hover:shadow-brand-500/5 hover:border-brand-500/30 transition-all duration-200 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-base truncate text-foreground group-hover:text-brand-500 transition-colors">
                        {fav.place_name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Rating value={payload.rating} />
                        <PriceBadge level={payload.price_category} />
                      </div>
                    </div>
                    <button
                      onClick={() => removeFav.mutate(fav.id)}
                      className="p-2 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                      title={t.placeCard.favRemoved}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {payload.address && (
                    <p className="text-xs text-muted-foreground mb-3 truncate">{payload.address}</p>
                  )}
                  {payload.reason && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed bg-muted/30 p-3 rounded-xl">
                      {payload.reason}
                    </p>
                  )}
                  {fav.note && (
                    <div className="mb-4 text-xs bg-brand-500/5 border border-brand-500/10 px-3.5 py-2.5 rounded-xl italic text-foreground">
                      &ldquo;{fav.note}&rdquo;
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-4 border-t border-[hsl(var(--border))] mt-auto">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {t.favorites.savedAgo} {timeAgo(fav.created_at)}
                  </div>

                  {payload.url_2gis && (
                    <a
                      href={payload.url_2gis}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-500 hover:underline"
                    >
                      2GIS <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

