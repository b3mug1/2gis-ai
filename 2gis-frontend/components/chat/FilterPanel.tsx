"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { useLanguage } from "@/context/LanguageContext";

export interface SearchFilters {
  open_now: boolean;
  min_rating: number;
  price_category: string | null;
}

interface FilterPanelProps {
  visible: boolean;
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  onClose: () => void;
}

const PRICE_OPTIONS = [
  { value: null, labelKey: "any" as const },
  { value: "budget", labelKey: "budget" as const },
  { value: "mid", labelKey: "mid" as const },
  { value: "premium", labelKey: "premium" as const },
];

export function FilterPanel({ visible, filters, onChange, onClose }: FilterPanelProps) {
  const { t } = useLanguage();

  function handleReset() {
    onChange({ open_now: false, min_rating: 0, price_category: null });
  }

  const activeCount = (filters.open_now ? 1 : 0) + (filters.min_rating > 0 ? 1 : 0) + (filters.price_category ? 1 : 0);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <div className="mx-4 mb-2 rounded-2xl border border-[hsl(var(--border))] bg-card/95 backdrop-blur-md p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                {t.filters.title}
                {activeCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-500 text-white text-[10px] font-bold">
                    {activeCount}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {activeCount > 0 && (
                  <button
                    onClick={handleReset}
                    className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t.filters.reset}
                  </button>
                )}
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Open Now Toggle */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/50 border border-[hsl(var(--border)/0.5)]">
                <span className="text-xs font-medium text-foreground">{t.filters.openNow}</span>
                <button
                  onClick={() => onChange({ ...filters, open_now: !filters.open_now })}
                  className={cn(
                    "relative w-10 h-5.5 rounded-full transition-colors shrink-0",
                    filters.open_now ? "bg-brand-500" : "bg-muted-foreground/30"
                  )}
                  style={{ height: "22px", width: "40px" }}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform",
                      filters.open_now ? "translate-x-[18px]" : "translate-x-0"
                    )}
                    style={{ width: "18px", height: "18px" }}
                  />
                </button>
              </div>

              {/* Min Rating */}
              <div className="p-3 rounded-xl bg-muted/50 border border-[hsl(var(--border)/0.5)]">
                <p className="text-xs font-medium text-foreground mb-2">{t.filters.minRating}</p>
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => onChange({ ...filters, min_rating: rating === filters.min_rating ? 0 : rating })}
                      className={cn(
                        "flex-1 text-[10px] font-semibold py-1 rounded-lg transition-all",
                        filters.min_rating === rating && rating > 0
                          ? "bg-brand-500 text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      {rating === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="flex items-center justify-center gap-0.5">
                          {rating}
                          <Star className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="p-3 rounded-xl bg-muted/50 border border-[hsl(var(--border)/0.5)]">
                <p className="text-xs font-medium text-foreground mb-2">{t.filters.priceRange}</p>
                <div className="flex flex-wrap gap-1.5">
                  {PRICE_OPTIONS.map(({ value, labelKey }) => (
                    <button
                      key={String(value)}
                      onClick={() => onChange({ ...filters, price_category: value === filters.price_category ? null : value })}
                      className={cn(
                        "text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all",
                        filters.price_category === value && value !== null
                          ? "bg-brand-500 text-white shadow-sm"
                          : "text-muted-foreground bg-muted hover:text-foreground hover:bg-muted/80"
                      )}
                    >
                      {t.filters[labelKey]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
