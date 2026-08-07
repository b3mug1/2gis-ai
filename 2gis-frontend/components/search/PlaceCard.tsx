"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  MapPin,
  Clock,
  Phone,
  ExternalLink,
  Heart,
  Share2,
  Check,
  Info,
  Sparkles,
  Navigation,
  Map,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { formatDistance } from "@/utils/format";
import { Rating } from "@/components/shared/Rating";
import { PriceBadge } from "@/components/shared/PriceBadge";
import type { PlaceRecommendation } from "@/types/api";
import { useAddFavorite, useFavorites, useRemoveFavorite } from "@/hooks/useFavorites";
import { toast } from "@/components/ui/toaster";
import { useLanguage } from "@/context/LanguageContext";
import { PhotoCarousel } from "@/components/search/PhotoCarousel";
import { MapModal } from "@/components/map/MapModal";

import { useAuth } from "@/features/auth/AuthContext";
import { useRouter } from "next/navigation";

interface PlaceCardProps {
  place: PlaceRecommendation;
  isTop?: boolean;
  index?: number;
}

export function PlaceCard({ place, isTop = false, index = 0 }: PlaceCardProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { data: favorites } = useFavorites();
  const addFav = useAddFavorite();
  const removeFav = useRemoveFavorite();
  const [copied, setCopied] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [initialBuildRoute, setInitialBuildRoute] = useState(false);
  const { t } = useLanguage();

  function handleOpenMap(buildRoute = false) {
    setInitialBuildRoute(buildRoute);
    setMapOpen(true);
  }

  const existingFav = favorites?.find((f) => f.place_id === place.place_id);
  const isFav = !!existingFav;

  // Extract photos from payload if available
  const photos: string[] = (place as PlaceRecommendation & { photos?: string[] }).photos ?? [];

  async function toggleFavorite() {
    if (!isAuthenticated) {
      toast.info(t.login?.sub || "Войдите в аккаунт для добавления в избранное");
      router.push("/login");
      return;
    }
    try {
      if (isFav && existingFav) {
        await removeFav.mutateAsync(existingFav.id);
        toast.info(t.placeCard.favRemoved);
      } else {
        await addFav.mutateAsync({
          place_id: place.place_id,
          place_name: place.name,
          payload: place as unknown as Record<string, unknown>,
        });
        toast.success(t.placeCard.favAdded);
      }
    } catch {
      toast.error("Ошибка при сохранении");
    }
  }

  async function handleShare() {
    const shareUrl =
      place.url ||
      (place.place_id
        ? `https://2gis.kz/firm/${place.place_id}`
        : `https://2gis.kz/astana/search/${encodeURIComponent(place.name + " " + (place.address || ""))}`);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.info(t.placeCard.shareLinkCopied);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Error");
    }
  }

  const confidencePct = Math.round(place.confidence * 100);
  const hasMap = !!(place.latitude && place.longitude);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        className={cn(
          "group relative rounded-2xl border bg-card p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5",
          isTop
            ? "border-brand-500/40 bg-gradient-to-b from-brand-500/5 to-transparent shadow-lg shadow-brand-500/5"
            : "border-[hsl(var(--border))] hover:border-brand-500/30"
        )}
      >
        {/* Top Best Match Badge */}
        {isTop && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-gradient-to-r from-brand-500 to-indigo-600 text-white text-[11px] font-semibold px-3 py-1 rounded-full shadow-md shadow-brand-500/20">
            <Sparkles className="w-3 h-3" />
            {t.placeCard.topPickBadge}
          </div>
        )}

        {/* Photo Carousel */}
        {photos.length > 0 && <PhotoCarousel photos={photos} name={place.name} />}

        {/* Main Header Info */}
        <div className={cn("flex items-start justify-between gap-4 mb-3", isTop && photos.length === 0 ? "pr-20" : "")}>
          <div>
            <h3
              className={cn(
                "font-bold tracking-tight leading-snug mb-1 text-foreground group-hover:text-brand-500 transition-colors",
                isTop ? "text-lg" : "text-base"
              )}
            >
              {place.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Rating value={place.rating} />
              <PriceBadge level={place.price_category} />
              {place.categories[0] && (
                <span className="text-[11px] font-medium text-muted-foreground/80 bg-muted/60 px-2 py-0.5 rounded-md">
                  {place.categories[0]}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* AI Reasoning Pill */}
        <div className="p-3 rounded-xl bg-muted/40 border border-muted-foreground/10 text-xs text-muted-foreground leading-relaxed mb-3.5">
          <p className="line-clamp-2">{place.reason}</p>
        </div>

        {/* Meta Specs (Distance, Address, Hours, Phone) */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground mb-4">
          {place.distance_m != null && (
            <span className="inline-flex items-center gap-1 font-medium text-foreground/90 bg-muted/50 px-2 py-0.5 rounded-md">
              <Navigation className="w-3 h-3 text-brand-500" />
              {formatDistance(place.distance_m)}
              {place.walking_time && (
                <span className="text-muted-foreground">
                  · {place.walking_time} {t.placeCard.walk}
                </span>
              )}
            </span>
          )}
          {place.address && (
            <span className="inline-flex items-center gap-1 truncate max-w-[240px]">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
              {place.address}
            </span>
          )}
          {place.opening_hours && (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              {place.opening_hours}
            </span>
          )}
          {place.phone && (
            <a
              href={`tel:${place.phone}`}
              className="inline-flex items-center gap-1 hover:text-brand-500 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              {place.phone}
            </a>
          )}
        </div>

        {/* Highlights (Pros / Cons) */}
        {(place.pros.length > 0 || place.cons.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 pt-2 border-t border-[hsl(var(--border)/0.6)]">
            {place.pros.slice(0, 2).map((pro, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-foreground/80">
                <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                <span className="line-clamp-1">{pro}</span>
              </div>
            ))}
            {place.cons.slice(0, 1).map((con, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Info className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                <span className="line-clamp-1">{con}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[hsl(var(--border))]">
          <div className="flex flex-wrap items-center gap-2">
            {place.url && (
              <a
                href={place.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors bg-brand-500/10 hover:bg-brand-500/15 px-3 py-1.5 rounded-lg"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                2GIS
              </a>
            )}
            {hasMap && (
              <>
                <button
                  onClick={() => handleOpenMap(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 transition-all px-3 py-1.5 rounded-lg shadow-sm hover:scale-[1.02]"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Маршрут
                </button>
                <button
                  onClick={() => handleOpenMap(false)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-500 hover:text-indigo-600 transition-colors bg-indigo-500/10 hover:bg-indigo-500/15 px-3 py-1.5 rounded-lg"
                >
                  <Map className="w-3.5 h-3.5" />
                  {t.placeCard.showOnMap}
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* AI Match score badge */}
            <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              {confidencePct}% {t.placeCard.match}
            </span>

            <button
              onClick={handleShare}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label={t.placeCard.share}
            >
              <Share2 className={cn("w-4 h-4", copied && "text-brand-500")} />
            </button>
            <button
              onClick={toggleFavorite}
              disabled={addFav.isPending || removeFav.isPending}
              className="p-2 rounded-xl transition-colors hover:bg-rose-500/10"
              aria-label={isFav ? t.placeCard.favRemoved : t.placeCard.favAdded}
            >
              <Heart
                className={cn(
                  "w-4 h-4 transition-all",
                  isFav ? "fill-rose-500 stroke-rose-500" : "text-muted-foreground hover:text-rose-500"
                )}
              />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Map Modal */}
      {hasMap && (
        <MapModal
          open={mapOpen}
          onClose={() => setMapOpen(false)}
          name={place.name}
          address={place.address}
          latitude={place.latitude}
          longitude={place.longitude}
          initialBuildRoute={initialBuildRoute}
        />
      )}
    </>
  );
}
