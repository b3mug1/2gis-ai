"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Heart, Trash2, Clock, ExternalLink } from "lucide-react";
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
    <div className="max-w-5xl mx-auto px-6 py-10 relative">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <Heart className="w-5 h-5 fill-rose-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Избранное</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Сохранено заведений в вашей коллекции: {favorites?.length ?? 0}
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
            placeholder="Поиск по сохраненным местам..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[hsl(var(--border))] bg-card/60 backdrop-blur-md text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="px-4 py-3 rounded-2xl border border-[hsl(var(--border))] bg-card/60 backdrop-blur-md text-sm outline-none cursor-pointer focus:border-brand-500 text-foreground"
        >
          <option value="date_desc">Сначала новые</option>
          <option value="date_asc">Сначала старые</option>
          <option value="name_asc">По алфавиту А–Я</option>
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="heart"
          title={searchQuery ? "Ничего не найдено" : "Список избранного пуст"}
          description={
            searchQuery
              ? "Попробуйте изменить запрос"
              : "Сохраняйте рестораны и кафе для быстрого доступа"
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
                      title="Удалить из избранного"
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
                    Сохранено {timeAgo(fav.created_at)}
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

