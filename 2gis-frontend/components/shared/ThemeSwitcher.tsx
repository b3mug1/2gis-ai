"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/utils/cn";
import { useLanguage } from "@/context/LanguageContext";

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { t } = useLanguage();
  const activeTheme = resolvedTheme ?? theme ?? "light";

  const themes = [
    { id: "light" as const, icon: Sun, label: t.theme.light },
    { id: "dark" as const, icon: Moon, label: t.theme.dark },
  ];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.9)] p-1 text-xs font-semibold shadow-[0_10px_30px_-24px_hsl(0_0%_0%/0.45)]",
        className
      )}
    >
      {themes.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => setTheme(id)}
          aria-label={`${label} theme`}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
            activeTheme === id
              ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
