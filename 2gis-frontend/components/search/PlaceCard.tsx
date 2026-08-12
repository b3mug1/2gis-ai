"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Check,
  Clock,
  ExternalLink,
  Heart,
  Info,
  Map,
  MapPin,
  Navigation,
  Phone,
  Share2,
  Sparkles,
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

interface PlaceCardProps {
  place: PlaceRecommendation;
  isTop?: boolean;
  index?: number;
  isCompared?: boolean;
  onToggleCompare?: () => void;
}

export function PlaceCard({ place, isTop = false, index = 0, isCompared = false, onToggleCompare }: PlaceCardProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { data: favorites } = useFavorites();
  const addFav = useAddFavorite();
  const removeFav = useRemoveFavorite();
  const [copied, setCopied] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [initialBuildRoute, setInitialBuildRoute] = useState(false);
  const { t } = useLanguage();

  const existingFav = favorites?.find((f) => f.place_id === place.place_id);
  const isFav = !!existingFav;
  const photos: string[] = (place as PlaceRecommendation & { photos?: string[] }).photos ?? [];
  const hasMap = !!(place.latitude && place.longitude);
  const confidencePct = Math.round(place.confidence * 100);

  function handleOpenMap(buildRoute = false) {
    setInitialBuildRoute(buildRoute);
    setMapOpen(true);
  }

  async function toggleFavorite() {
    if (!isAuthenticated) {
      toast.info(t.login?.sub || "Войдите в аккаунт, чтобы сохранить место");
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
        : `https://2gis.kz/astana/search/${encodeURIComponent(`${place.name} ${place.address || ""}`)}`);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.info(t.placeCard.shareLinkCopied);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Не удалось скопировать ссылку");
    }
  }

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.2 }}
        className={cn(
          "group overflow-hidden rounded-[1.5rem] border bg-[hsl(var(--card))] shadow-[0_18px_50px_-34px_hsl(0_0%_0%/0.45)] transition-all duration-200 hover:-translate-y-0.5",
          isTop ? "border-[hsl(var(--primary))]" : "border-[hsl(var(--border))]"
        )}
      >
        {isTop && (
          <div className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-[hsl(var(--primary))] px-2.5 py-1 text-[11px] font-semibold text-[hsl(var(--primary-foreground))] shadow-sm">
            <Sparkles className="h-3 w-3" />
            {t.placeCard.topPickBadge}
          </div>
        )}

        {photos.length > 0 && <PhotoCarousel photos={photos} name={place.name} />}

        <div className="space-y-4 p-4">
          <div className={cn("flex items-start justify-between gap-4", isTop && photos.length === 0 ? "pr-24" : "")}>
            <div className="min-w-0">
              <h3
                className={cn(
                  "mb-1 line-clamp-2 text-sm font-semibold tracking-tight text-foreground transition-colors group-hover:text-[hsl(var(--primary))]",
                  isTop && "text-base"
                )}
              >
                {place.name}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Rating value={place.rating} />
                <PriceBadge level={place.price_category} />
                {place.categories[0] && (
                  <span className="rounded-full bg-[hsl(var(--secondary))] px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {place.categories[0]}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[1.1rem] border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] p-3 text-xs leading-relaxed text-muted-foreground">
            <p className="line-clamp-2">{place.reason}</p>
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
            {place.distance_m != null && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--secondary))] px-2.5 py-1 font-medium text-foreground">
                <Navigation className="h-3 w-3 text-[hsl(var(--primary))]" />
                {formatDistance(place.distance_m)}
                {place.walking_time && (
                  <span className="text-muted-foreground">
                    • 🚶 {place.walking_time} {t.placeCard.walk}
                  </span>
                )}
                {place.driving_time && (
                  <span className="text-muted-foreground">
                    • 🚗 {place.driving_time} {t.placeCard.drive}
                  </span>
                )}
              </span>
            )}
            {place.address && (
              <span className="inline-flex max-w-[260px] items-center gap-1 truncate">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {place.address}
              </span>
            )}
            {place.opening_hours && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {place.opening_hours}
              </span>
            )}
            {place.phone && (
              <a href={`tel:${place.phone}`} className="inline-flex items-center gap-1 transition-colors hover:text-[hsl(var(--primary))]">
                <Phone className="h-3.5 w-3.5" />
                {place.phone}
              </a>
            )}
          </div>

          {(place.pros.length > 0 || place.cons.length > 0) && (
            <div className="grid gap-2 border-t border-[hsl(var(--border))] pt-3 sm:grid-cols-2">
              {place.pros.slice(0, 2).map((pro, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(var(--primary))]" />
                  <span className="line-clamp-1">{pro}</span>
                </div>
              ))}
              {place.cons.slice(0, 1).map((con, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="line-clamp-1">{con}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[hsl(var(--border))] pt-3">
            <div className="flex flex-wrap items-center gap-2">
              {onToggleCompare && (
                <button
                  onClick={onToggleCompare}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
                    isCompared
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                      : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-foreground hover:border-[hsl(var(--primary))]"
                  )}
                >
                  <Sparkles className="h-3 w-3" />
                  {isCompared ? t.placeCard.selectedForCompare : t.placeCard.compare}
                </button>
              )}
              {place.url && (
                <a
                  href={place.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-[hsl(var(--primary))]"
                >
                  <ExternalLink className="h-3 w-3 text-[hsl(var(--primary))]" />
                  2GIS
                </a>
              )}
              {hasMap && (
                <>
                  <button
                    onClick={() => handleOpenMap(true)}
                    className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--primary))] px-2.5 py-1 text-xs font-semibold text-[hsl(var(--primary-foreground))] transition-opacity hover:opacity-90"
                  >
                    <Navigation className="h-3 w-3" />
                    Маршрут
                  </button>
                  <button
                    onClick={() => handleOpenMap(false)}
                    className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-[hsl(var(--muted))]"
                  >
                    <Map className="h-3 w-3 text-[hsl(var(--primary))]" />
                    {t.placeCard.showOnMap}
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {confidencePct}% {t.placeCard.match}
              </span>

              <button
                onClick={handleShare}
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-[hsl(var(--muted))] hover:text-foreground"
                aria-label={t.placeCard.share}
              >
                <Share2 className={cn("h-3.5 w-3.5", copied && "text-[hsl(var(--primary))]")} />
              </button>

              <button
                onClick={toggleFavorite}
                disabled={addFav.isPending || removeFav.isPending}
                className="rounded-full p-1.5 transition-colors hover:bg-[hsl(var(--muted))]"
                aria-label={isFav ? t.placeCard.favRemoved : t.placeCard.favAdded}
              >
                <Heart
                  className={cn(
                    "h-3.5 w-3.5 transition-all",
                    isFav ? "fill-destructive stroke-destructive" : "text-muted-foreground hover:text-destructive"
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      </motion.article>

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
