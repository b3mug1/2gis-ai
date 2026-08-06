"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Heart, Trash2, Clock, SortAsc } from "lucide-react";
import { useFavorites, useRemoveFavorite } from "@/hooks/useFavorites";
import { EmptyState } from "@/components/shared/EmptyState";
import { CardSkeleton } from "@/components/shared/Skeleton";
import { Rating } from "@/components/shared/Rating";
import { PriceBadge } from "@/components/shared/PriceBadge";
import { timeAgo } from "@/utils/format";
import type { FavoriteResponse } from "@/types/api";
import { cn } from "@/utils/cn";

type SortKey = "date_desc" | "date_asc" | "name_asc";

function sortFavorites(favs: FavoriteResponse[], sort: SortKey): FavoriteResponse[] {
  const arr = [...favs];
  switch (sort) {
    case "date_asc":
      return arr.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    case "name_asc":
      return arr.sort((a, b) => a.place_name.localeCompare(b.place_name));
    default:
      return arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

export default function FavoritesPage() {
  const { data: favorites, isLoading } = useFavorites();
  const removeFav = useRemoveFavorite();
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("date_desc");

  const filtered = sortFavorites(
    (favorites ?? []).filter((f) =>
      f.place_name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    sort
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-1">
          <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
          Favorites
        </h1>
        <p className="text-muted-foreground text-sm">
          {favorites?.length ?? 0} saved place{favorites?.length !== 1 ? "s" : ""}
        </p>
      </motion.div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search favorites…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm outline-none focus:border-brand-400 transition-colors"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="px-3 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm outline-none cursor-pointer focus:border-brand-400"
        >
          <option value="date_desc">Newest first</option>
          <option value="date_asc">Oldest first</option>
          <option value="name_asc">Name A–Z</option>
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="heart"
          title={searchQuery ? "No matching favorites" : "No favorites yet"}
          description={
            searchQuery
              ? "Try a different search term"
              : "Start exploring and save places you love"
          }
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid sm:grid-cols-2 gap-4"
        >
          {filtered.map((fav, i) => {
            const payload = fav.payload as {
              rating?: number;
              price_category?: string;
              address?: string;
              reason?: string;
            };
            return (
              <motion.div
                key={fav.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-[hsl(var(--border))] bg-card p-5 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate mb-1">{fav.place_name}</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <Rating value={payload.rating} />
                      <PriceBadge level={payload.price_category} />
                    </div>
                  </div>
                  <button
                    onClick={() => removeFav.mutate(fav.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Remove from favorites"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {payload.address && (
                  <p className="text-xs text-muted-foreground mb-2 truncate">{payload.address}</p>
                )}
                {payload.reason && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{payload.reason}</p>
                )}
                {fav.note && (
                  <div className="mb-3 text-xs bg-[hsl(var(--muted))] px-3 py-2 rounded-lg italic">
                    &ldquo;{fav.note}&rdquo;
                  </div>
                )}

                <div className="flex items-center gap-1 text-[10px] text-muted-foreground pt-3 border-t border-[hsl(var(--border))]">
                  <Clock className="w-3 h-3" />
                  Saved {timeAgo(fav.created_at)}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
