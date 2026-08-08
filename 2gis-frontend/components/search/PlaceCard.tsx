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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.2 }}
        className={cn(
          "group relative rounded-md border bg-card p-4 transition-all duration-200 hover:border-[hsl(var(--primary))]",
          isTop
            ? "border-[hsl(var(--primary))]"
            : "border-[hsl(var(--border))]"
        )}
      >
        {isTop && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-[11px] font-semibold px-2.5 py-0.5 rounded-md shadow-xs">
            <Sparkles className="w-3 h-3" />
            {t.placeCard.topPickBadge}
          </div>
        )}

        {photos.length > 0 && <PhotoCarousel photos={photos} name={place.name} />}

        <div className={cn("flex items-start justify-between gap-4 mb-2.5", isTop && photos.length === 0 ? "pr-24" : "")}>
          <div>
            <h3
              className={cn(
                "font-bold tracking-tight leading-snug mb-1 text-foreground group-hover:text-[hsl(var(--primary))] transition-colors",
                isTop ? "text-base" : "text-sm sm:text-base"
              )}
            >
              {place.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Rating value={place.rating} />
              <PriceBadge level={place.price_category} />
              {place.categories[0] && (
                <span className="text-[11px] font-medium text-muted-foreground bg-[hsl(var(--secondary))] px-2 py-0.5 rounded">
                  {place.categories[0]}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-md bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-xs text-muted-foreground leading-relaxed mb-3">
          <p className="line-clamp-2">{place.reason}</p>
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground mb-3">
          {place.distance_m != null && (
            <span className="inline-flex items-center gap-1 font-medium text-foreground bg-[hsl(var(--secondary))] px-2 py-0.5 rounded">
              <Navigation className="w-3 h-3 text-[hsl(var(--primary))]" />
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
              className="inline-flex items-center gap-1 hover:text-[hsl(var(--primary))] transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              {place.phone}
            </a>
          )}
        </div>

        {(place.pros.length > 0 || place.cons.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3 pt-2 border-t border-[hsl(var(--border))]">
            {place.pros.slice(0, 2).map((pro, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                <Check className="w-3.5 h-3.5 text-[hsl(var(--primary))] mt-0.5 shrink-0" />
                <span className="line-clamp-1">{pro}</span>
              </div>
            ))}
            {place.cons.slice(0, 1).map((con, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Info className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <span className="line-clamp-1">{con}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[hsl(var(--border))]">
          <div className="flex flex-wrap items-center gap-2">
            {place.url && (
              <a
                href={place.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-foreground bg-[hsl(var(--secondary))] hover:border-[hsl(var(--primary))] border border-[hsl(var(--border))] transition-colors px-2.5 py-1 rounded-md"
              >
                <ExternalLink className="w-3 h-3 text-[hsl(var(--primary))]" />
                2GIS
              </a>
            )}
            {hasMap && (
              <>
                <button
                  onClick={() => handleOpenMap(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[hsl(var(--primary-foreground))] bg-[hsl(var(--primary))] hover:opacity-90 transition-opacity px-2.5 py-1 rounded-md"
                >
                  <Navigation className="w-3 h-3" />
                  Маршрут
                </button>
                <button
                  onClick={() => handleOpenMap(false)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-foreground bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--muted))] border border-[hsl(var(--border))] transition-colors px-2.5 py-1 rounded-md"
                >
                  <Map className="w-3 h-3 text-[hsl(var(--primary))]" />
                  {t.placeCard.showOnMap}
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground bg-[hsl(var(--secondary))] px-2 py-0.5 rounded-md border border-[hsl(var(--border))]">
              {confidencePct}% {t.placeCard.match}
            </span>

            <button
              onClick={handleShare}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--muted))] transition-colors"
              aria-label={t.placeCard.share}
            >
              <Share2 className={cn("w-3.5 h-3.5", copied && "text-[hsl(var(--primary))]")} />
            </button>
            <button
              onClick={toggleFavorite}
              disabled={addFav.isPending || removeFav.isPending}
              className="p-1.5 rounded-md transition-colors hover:bg-[hsl(var(--muted))]"
              aria-label={isFav ? t.placeCard.favRemoved : t.placeCard.favAdded}
            >
              <Heart
                className={cn(
                  "w-3.5 h-3.5 transition-all",
                  isFav ? "fill-destructive stroke-destructive" : "text-muted-foreground hover:text-destructive"
                )}
              />
            </button>
          </div>
        </div>
      </motion.div>

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
