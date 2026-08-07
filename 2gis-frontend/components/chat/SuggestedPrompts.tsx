"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  const { t } = useLanguage();

  return (
    <div className="px-4 py-2">
      <p className="text-[11px] text-muted-foreground mb-2.5 font-semibold uppercase tracking-wider">{t.chat.tryAsking}</p>
      <div className="flex flex-wrap gap-1.5 justify-center max-w-lg">
        {t.chat.prompts.map((promptText, i) => (
          <motion.button
            key={promptText}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => onSelect(promptText)}
            className="text-xs px-3 py-1.5 rounded-md border border-[hsl(var(--border))] bg-card hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))] transition-colors font-medium text-foreground text-left"
          >
            {promptText}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
