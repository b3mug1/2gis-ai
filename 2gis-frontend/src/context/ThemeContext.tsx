import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

export interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  lowLight: boolean;
  setTheme: (theme: Theme) => void;
  setLowLight: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  resolvedTheme: "light",
  lowLight: false,
  setTheme: () => {},
  setLowLight: () => {},
});

const THEME_STORAGE_KEY = "cg_theme";
const LOW_LIGHT_STORAGE_KEY = "cg_low_light";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || "system";
  });

  const [lowLight, setLowLightState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(LOW_LIGHT_STORAGE_KEY) === "1";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "dark") return "dark";
    if (saved === "light") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;

    function applyTheme() {
      let active: "light" | "dark";
      if (theme === "system") {
        active = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      } else {
        active = theme;
      }

      setResolvedTheme(active);
      if (active === "dark") {
        root.classList.add("dark");
        root.classList.remove("light");
        root.setAttribute("data-theme", "dark");
        root.style.colorScheme = "dark";
      } else {
        root.classList.remove("dark");
        root.classList.add("light");
        root.setAttribute("data-theme", "light");
        root.style.colorScheme = "light";
      }
    }

    applyTheme();

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => applyTheme();
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (lowLight) {
      root.classList.add("low-light");
      root.setAttribute("data-low-light", "true");
    } else {
      root.classList.remove("low-light");
      root.removeAttribute("data-low-light");
    }
    localStorage.setItem(LOW_LIGHT_STORAGE_KEY, lowLight ? "1" : "0");
  }, [lowLight]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  const setLowLight = (enabled: boolean) => {
    setLowLightState(enabled);
    if (enabled && resolvedTheme === "light") {
      setTheme("dark");
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, lowLight, setTheme, setLowLight }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
