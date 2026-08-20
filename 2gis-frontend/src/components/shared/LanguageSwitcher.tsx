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
    <div className="inline-flex items-center p-1 rounded-md bg-card border border-[hsl(var(--border))] text-xs font-semibold">
      <Globe className="w-3.5 h-3.5 ml-1.5 mr-1 text-[hsl(var(--primary))] shrink-0" />
      {options.map((opt) => (
        <button
          key={opt.code}
          onClick={() => setLanguage(opt.code)}
          className={`px-2 py-1 rounded-md text-xs transition-colors ${
            language === opt.code
              ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
