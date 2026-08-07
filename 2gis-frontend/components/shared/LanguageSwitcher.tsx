"use client";

import { useLanguage, type Language } from "@/context/LanguageContext";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const options: { code: Language; label: string }[] = [
    { code: "ru", label: "RU" },
    { code: "kz", label: "KZ" },
    { code: "en", label: "EN" },
  ];

  return (
    <div className="inline-flex items-center p-1 rounded-full bg-card border border-[hsl(var(--border))] shadow-sm text-xs font-bold">
      <Globe className="w-3.5 h-3.5 ml-2 mr-1 text-brand-400 shrink-0" />
      {options.map((opt) => (
        <button
          key={opt.code}
          onClick={() => setLanguage(opt.code)}
          className={`px-2.5 py-1 rounded-full transition-all ${
            language === opt.code
              ? "bg-brand-400 text-black font-extrabold shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
