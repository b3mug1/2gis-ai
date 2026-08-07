"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import { useLanguage } from "@/context/LanguageContext";

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const themes = [
    { id: "light" as const, icon: Sun, label: t.theme.light },
    { id: "dark" as const, icon: Moon, label: t.theme.dark },
  ];

  return (
    <div className={cn("inline-flex items-center gap-1 p-1 rounded-md bg-card border border-[hsl(var(--border))] text-xs font-semibold", className)}>
      {themes.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => setTheme(id)}
          aria-label={`${label} theme`}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
            theme === id
              ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
