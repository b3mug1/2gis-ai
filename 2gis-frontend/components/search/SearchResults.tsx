"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SearchResponse } from "@/types/api";
import { PlaceCard } from "@/components/search/PlaceCard";

interface SearchResultsProps {
  data: SearchResponse;
}

export function SearchResults({ data }: SearchResultsProps) {
  const all = [data.recommendation, ...data.alternatives];

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full space-y-3">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Найдено мест: {all.length}
          </p>
          <span className="text-xs font-medium text-muted-foreground">{data.source}</span>
        </div>

        <div className="grid gap-3">
          {all.map((place, i) => (
            <PlaceCard key={place.place_id} place={place} isTop={i === 0} index={i} />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
