"use client";

import { motion } from "framer-motion";
import { Sparkles, Utensils, Coffee, Heart, Users, Compass, Salad } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

const CATEGORY_TAGS = [
  { label: "Суши и роллы", prompt: "Лучшие суши и роллы в Астане", icon: Utensils },
  { label: "Кофе и Wi-Fi", prompt: "Тихая кофейня с хорошим Wi-Fi для работы", icon: Coffee },
  { label: "Романтика", prompt: "Романтический ресторан для свидания", icon: Heart },
  { label: "Для компании", prompt: "Ресторан для большой компании друзей", icon: Users },
  { label: "С панорамным видом", prompt: "Панорамный ресторан с красивым видом на город", icon: Compass },
  { label: "Здоровая еда", prompt: "Здоровая еда и полезные обеды", icon: Salad },
];

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  const { t } = useLanguage();

  return (
    <div className="w-full max-w-2xl space-y-4 px-2">
      <div className="flex flex-wrap justify-center gap-2">
        {CATEGORY_TAGS.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              onClick={() => onSelect(item.prompt)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.8)] px-3.5 py-1.5 text-xs font-medium text-foreground backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--card))] hover:text-[hsl(var(--primary))]"
            >
              <Icon className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
              <span>{item.label}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="pt-2">
        <p className="mb-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {t.chat.tryAsking}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {t.chat.prompts.map((promptText, i) => (
            <motion.button
              key={promptText}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.04, duration: 0.2 }}
              onClick={() => onSelect(promptText)}
              className="group flex items-center justify-between rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.7)] p-3 text-left text-xs text-foreground backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--card))] hover:shadow-md"
            >
              <span className="line-clamp-2 pr-2 leading-relaxed text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))]">
                {promptText}
              </span>
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-40 transition-opacity group-hover:text-[hsl(var(--primary))] group-hover:opacity-100" />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
