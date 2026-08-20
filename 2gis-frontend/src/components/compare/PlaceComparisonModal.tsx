"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Info, Sparkles, Trophy, X } from "lucide-react";
import { Rating } from "@/components/shared/Rating";
import { PriceBadge } from "@/components/shared/PriceBadge";
import type { ComparePlacesResponse, PlaceRecommendation } from "@/types/api";

interface PlaceComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  places: PlaceRecommendation[];
  comparisonData: ComparePlacesResponse | null;
  isLoading: boolean;
}

export function PlaceComparisonModal({
  isOpen,
  onClose,
  places,
  comparisonData,
  isLoading,
}: PlaceComparisonModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1, y: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-foreground">
                  AI Сравнение заведений
                </h2>
                <p className="text-xs text-muted-foreground">
                  Сравниваем {places.length} заведений 2GIS по отзывам и критериям
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-[hsl(var(--border))] p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="min-h-0 flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]"
                >
                  <Sparkles className="h-6 w-6" />
                </motion.div>
                <p className="text-sm font-semibold text-foreground">Анализируем места с помощью ИИ...</p>
                <p className="mt-1 text-xs text-muted-foreground">Изучаем отзывы, атмосферу и критерии выбора</p>
              </div>
            ) : comparisonData ? (
              <>
                {/* AI Verdict Box */}
                <div className="rounded-[1.5rem] border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.08)] p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-5 w-5 text-[hsl(var(--primary))]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--primary))]">
                      ИИ Вердикт и рекомендации
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-foreground">
                    {comparisonData.verdict}
                  </p>
                </div>

                {/* Key Differences */}
                {comparisonData.key_differences.length > 0 && (
                  <div className="rounded-[1.2rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Ключевые отличия
                    </h4>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {comparisonData.key_differences.map((diff, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                          <span className="mt-1 flex h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--primary))]" />
                          <span>{diff}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Side-by-side comparison cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {places.map((place) => {
                    const compItem = comparisonData.comparisons.find(
                      (c) => c.place_id === place.place_id
                    );
                    const isWinner = comparisonData.winner_place_id === place.place_id;

                    return (
                      <div
                        key={place.place_id}
                        className={`relative flex flex-col justify-between rounded-[1.5rem] border p-4 shadow-sm transition-all ${
                          isWinner
                            ? "border-[hsl(var(--primary))] bg-[hsl(var(--card))]"
                            : "border-[hsl(var(--border))] bg-[hsl(var(--card)/0.6)]"
                        }`}
                      >
                        {isWinner && (
                          <div className="absolute -top-3 right-4 inline-flex items-center gap-1 rounded-full bg-[hsl(var(--primary))] px-3 py-0.5 text-[11px] font-bold text-[hsl(var(--primary-foreground))] shadow-md">
                            <Trophy className="h-3 w-3" />
                            Победитель
                          </div>
                        )}

                        <div>
                          <h3 className="text-sm font-bold text-foreground mb-1">{place.name}</h3>
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <Rating value={place.rating} />
                            <PriceBadge level={place.price_category} />
                          </div>

                          {compItem?.best_for && (
                            <div className="mb-3 rounded-full bg-[hsl(var(--secondary))] px-3 py-1 text-[11px] font-semibold text-[hsl(var(--primary))]">
                              {compItem.best_for}
                            </div>
                          )}

                          {/* Pros */}
                          <div className="space-y-1.5 mb-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Плюсы:</p>
                            {(compItem?.pros || place.pros).map((pro, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(var(--primary))]" />
                                <span>{pro}</span>
                              </div>
                            ))}
                          </div>

                          {/* Cons */}
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Минусы:</p>
                            {(compItem?.cons || place.cons).map((con, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span>{con}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {place.address && (
                          <p className="mt-4 border-t border-[hsl(var(--border))] pt-2 text-[11px] text-muted-foreground truncate">
                            {place.address}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
