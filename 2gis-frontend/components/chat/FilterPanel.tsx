"use client";

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
          initial={{ opacity: 0, y: -6, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -6, height: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <div className="mx-4 mb-2 rounded-md border border-[hsl(var(--border))] bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                {t.filters.title}
                {activeCount > 0 && (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-[10px] font-bold">
                    {activeCount}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {activeCount > 0 && (
                  <button
                    onClick={handleReset}
                    className="text-[11px] text-muted-foreground hover:text-foreground transition-colors font-medium"
                  >
                    {t.filters.reset}
                  </button>
                )}
                <button onClick={onClose} className="p-1 rounded-md hover:bg-[hsl(var(--muted))] transition-colors text-muted-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center justify-between gap-3 p-2.5 rounded-md bg-[hsl(var(--secondary))] border border-[hsl(var(--border))]">
                <span className="text-xs font-medium text-foreground">{t.filters.openNow}</span>
                <button
                  onClick={() => onChange({ ...filters, open_now: !filters.open_now })}
                  className={cn(
                    "relative w-9 h-5 rounded-full transition-colors shrink-0",
                    filters.open_now ? "bg-[hsl(var(--primary))]" : "bg-muted-foreground/30"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-xs transition-transform",
                      filters.open_now ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              <div className="p-2.5 rounded-md bg-[hsl(var(--secondary))] border border-[hsl(var(--border))]">
                <p className="text-xs font-medium text-foreground mb-1.5">{t.filters.minRating}</p>
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => onChange({ ...filters, min_rating: rating })}
                      className={cn(
                        "px-1.5 py-0.5 rounded text-xs font-medium transition-colors flex items-center gap-0.5",
                        filters.min_rating === rating
                          ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                          : "text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--muted))]"
                      )}
                    >
                      {rating === 0 ? t.filters.any : `${rating}+`}
                      {rating > 0 && <Star className="w-2.5 h-2.5 fill-current" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-2.5 rounded-md bg-[hsl(var(--secondary))] border border-[hsl(var(--border))]">
                <p className="text-xs font-medium text-foreground mb-1.5">{t.filters.priceRange}</p>
                <div className="flex items-center gap-1">
                  {PRICE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value ?? "any"}
                      onClick={() => onChange({ ...filters, price_category: opt.value })}
                      className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium transition-colors",
                        filters.price_category === opt.value
                          ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                          : "text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--muted))]"
                      )}
                    >
                      {t.filters[opt.labelKey]}
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
