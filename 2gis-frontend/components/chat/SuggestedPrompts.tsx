"use client";

import { motion } from "framer-motion";

const PROMPTS = [
  "🍣 Best sushi near Astana IT University under 10,000 ₸",
  "☕ Quiet coffee shop to work from",
  "🍽️ Romantic dinner for two",
  "👨‍👩‍👧 Restaurant for a group of 8 people",
  "🌃 Rooftop bar with a view",
  "🥗 Healthy lunch spots nearby",
];

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  return (
    <div className="px-4 py-3">
      <p className="text-xs text-muted-foreground mb-2.5 font-medium">Try asking…</p>
      <div className="flex flex-wrap gap-2">
        {PROMPTS.map((p, i) => (
          <motion.button
            key={p}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelect(p)}
            className="text-xs px-3 py-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted))] hover:border-brand-400 hover:bg-brand-500/5 hover:text-brand-600 dark:hover:text-brand-400 transition-all"
          >
            {p}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
