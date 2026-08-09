"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  const { t } = useLanguage();

  return (
    <div className="w-full max-w-2xl rounded-[1.5rem] border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.9)] px-4 py-4 shadow-[0_18px_50px_-36px_hsl(0_0%_0%/0.45)] backdrop-blur-xl">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {t.chat.tryAsking}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {t.chat.prompts.map((promptText, i) => (
          <motion.button
            key={promptText}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => onSelect(promptText)}
            className="premium-chip text-left transition-transform hover:-translate-y-0.5 hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]"
          >
            {promptText}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
