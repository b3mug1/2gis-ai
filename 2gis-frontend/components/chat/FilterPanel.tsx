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
          <div className="mx-4 mb-3 rounded-[1.5rem] border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.92)] p-4 shadow-[0_18px_50px_-36px_hsl(0_0%_0%/0.45)] backdrop-blur-xl sm:mx-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground">
                {t.filters.title}
                {activeCount > 0 && (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[10px] font-bold text-[hsl(var(--primary-foreground))]">
                    {activeCount}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {activeCount > 0 && (
                  <button
                    onClick={handleReset}
                    className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t.filters.reset}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="rounded-full border border-[hsl(var(--border))] p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex items-center justify-between gap-3 rounded-[1.1rem] border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 py-3">
                <span className="text-xs font-medium text-foreground">{t.filters.openNow}</span>
                <button
                  onClick={() => onChange({ ...filters, open_now: !filters.open_now })}
                  className={cn(
                    "relative h-5 w-10 shrink-0 rounded-full transition-colors",
                    filters.open_now ? "bg-[hsl(var(--primary))]" : "bg-muted-foreground/30"
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                      filters.open_now ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              <div className="rounded-[1.1rem] border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 py-3">
                <p className="mb-2 text-xs font-medium text-foreground">{t.filters.minRating}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[0, 1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => onChange({ ...filters, min_rating: rating })}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                        filters.min_rating === rating
                          ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                          : "border-[hsl(var(--border))] bg-[hsl(var(--card))] text-muted-foreground hover:border-[hsl(var(--primary))] hover:text-foreground"
                      )}
                    >
                      {rating === 0 ? t.filters.any : `${rating}+`}
                      {rating > 0 && <Star className="w-2.5 h-2.5 fill-current" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.1rem] border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 py-3">
                <p className="mb-2 text-xs font-medium text-foreground">{t.filters.priceRange}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {PRICE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value ?? "any"}
                      onClick={() => onChange({ ...filters, price_category: opt.value })}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                        filters.price_category === opt.value
                          ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                          : "border-[hsl(var(--border))] bg-[hsl(var(--card))] text-muted-foreground hover:border-[hsl(var(--primary))] hover:text-foreground"
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
