"use client";

import { motion } from "framer-motion";

const PROMPTS = [
  "Лучшие суши возле Astana IT University до 10 000 ₸",
  "Тихая кофейня с хорошим Wi-Fi для работы",
  "Романтический ужин для двоих",
  "Ресторан для большой компании",
  "Панорамный бар с видом на город",
  "Здоровая еда и полезные обеды",
];

import { useLanguage } from "@/context/LanguageContext";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  const { t } = useLanguage();

  return (
    <div className="px-4 py-3">
      <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">{t.chat.tryAsking}</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {t.chat.prompts.map((promptText, i) => (
          <motion.button
            key={promptText}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onSelect(promptText)}
            className="text-xs px-3.5 py-2 rounded-xl border border-[hsl(var(--border))] bg-card/60 hover:bg-card hover:border-brand-500/40 hover:text-brand-500 transition-all shadow-sm"
          >
            {promptText}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

