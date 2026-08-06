"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  Clock,
  Phone,
  ExternalLink,
  Heart,
  Share2,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { formatDistance, formatConfidence } from "@/utils/format";
import { Rating } from "@/components/shared/Rating";
import { PriceBadge } from "@/components/shared/PriceBadge";
import type { PlaceRecommendation } from "@/types/api";
import { useAddFavorite, useFavorites, useRemoveFavorite } from "@/hooks/useFavorites";
import { toast } from "@/components/ui/toaster";
import { useState } from "react";

interface PlaceCardProps {
  place: PlaceRecommendation;
  isTop?: boolean;
  index?: number;
}

export function PlaceCard({ place, isTop = false, index = 0 }: PlaceCardProps) {
  const { data: favorites } = useFavorites();
  const addFav = useAddFavorite();
  const removeFav = useRemoveFavorite();
  const [copied, setCopied] = useState(false);

  const existingFav = favorites?.find((f) => f.place_id === place.place_id);
  const isFav = !!existingFav;

  async function toggleFavorite() {
    if (isFav && existingFav) {
      await removeFav.mutateAsync(existingFav.id);
      toast.info("Removed from favorites");
    } else {
      await addFav.mutateAsync({
        place_id: place.place_id,
        place_name: place.name,
        payload: place as unknown as Record<string, unknown>,
      });
      toast.success("Added to favorites");
    }
  }

  async function handleShare() {
    const text = `Check out ${place.name}${place.address ? ` at ${place.address}` : ""}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.info("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  const confidencePct = Math.round(place.confidence * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className={cn(
        "relative rounded-2xl border bg-card overflow-hidden transition-shadow hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20",
        isTop
          ? "border-brand-400/40 shadow-md shadow-brand-500/10 dark:shadow-brand-500/5"
          : "border-[hsl(var(--border))]"
      )}
    >
      {/* Top badge */}
      {isTop && (
        <div className="absolute top-3 left-3 flex items-center gap-1 bg-gradient-to-r from-brand-500 to-purple-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg">
          <Sparkles className="w-3 h-3" />
          Best Match
        </div>
      )}

      <div className="p-5 pt-6">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className={cn("font-semibold leading-tight mb-1 truncate", isTop ? "text-base" : "text-sm")}>
              {place.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <Rating value={place.rating} />
              <PriceBadge level={place.price_category} />
              {place.categories[0] && (
                <span className="text-xs text-muted-foreground">{place.categories[0]}</span>
              )}
            </div>
          </div>

          {/* Confidence ring */}
          <div className="shrink-0 flex flex-col items-center gap-0.5">
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18" cy="18" r="15.9"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="3"
                />
                <circle
                  cx="18" cy="18" r="15.9"
                  fill="none"
                  stroke="url(#conf-grad)"
                  strokeWidth="3"
                  strokeDasharray={`${confidencePct} ${100 - confidencePct}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="conf-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6171f6" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                {confidencePct}%
              </span>
            </div>
            <span className="text-[9px] text-muted-foreground">AI score</span>
          </div>
        </div>

        {/* AI reason */}
        <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
          {place.reason}
        </p>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3 text-xs text-muted-foreground">
          {place.distance_m != null && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {formatDistance(place.distance_m)}
              {place.walking_time && ` · ${place.walking_time} min`}
            </span>
          )}
          {place.address && (
            <span className="flex items-center gap-1 truncate max-w-[200px]">
              <MapPin className="w-3 h-3 shrink-0" />
              {place.address}
            </span>
          )}
          {place.opening_hours && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {place.opening_hours}
            </span>
          )}
          {place.phone && (
            <a
              href={`tel:${place.phone}`}
              className="flex items-center gap-1 hover:text-brand-500 transition-colors"
            >
              <Phone className="w-3 h-3" />
              {place.phone}
            </a>
          )}
        </div>

        {/* Pros / Cons */}
        {(place.pros.length > 0 || place.cons.length > 0) && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {place.pros.slice(0, 3).map((pro, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs">
                <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                <span className="text-foreground/80">{pro}</span>
              </div>
            ))}
            {place.cons.slice(0, 2).map((con, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs">
                <AlertCircle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{con}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-[hsl(var(--border))]">
          {place.url && (
            <a
              href={place.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open
            </a>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Share"
            >
              <Share2 className={cn("w-4 h-4", copied && "text-brand-500")} />
            </button>
            <button
              onClick={toggleFavorite}
              disabled={addFav.isPending || removeFav.isPending}
              className="p-1.5 rounded-lg transition-colors hover:bg-rose-500/10"
              aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                className={cn(
                  "w-4 h-4 transition-all",
                  isFav ? "fill-rose-500 stroke-rose-500" : "text-muted-foreground hover:text-rose-400"
                )}
              />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
