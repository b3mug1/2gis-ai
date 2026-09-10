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

  function applyThemeToDOM(active: "light" | "dark", isLowLight: boolean) {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const body = document.body;

    if (active === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      root.setAttribute("data-theme", "dark");
      root.style.colorScheme = "dark";
      if (body) {
        body.classList.add("dark");
        body.classList.remove("light");
        body.setAttribute("data-theme", "dark");
      }
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      root.setAttribute("data-theme", "light");
      root.style.colorScheme = "light";
      if (body) {
        body.classList.remove("dark");
        body.classList.add("light");
        body.setAttribute("data-theme", "light");
      }
    }

    if (active === "dark" && isLowLight) {
      root.classList.add("low-light");
      root.setAttribute("data-low-light", "true");
      if (body) {
        body.classList.add("low-light");
        body.setAttribute("data-low-light", "true");
      }
    } else {
      root.classList.remove("low-light");
      root.removeAttribute("data-low-light");
      if (body) {
        body.classList.remove("low-light");
        body.removeAttribute("data-low-light");
      }
    }
  }

  useEffect(() => {
    let active: "light" | "dark";
    if (theme === "system") {
      active = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      active = theme;
    }

    setResolvedTheme(active);
    applyThemeToDOM(active, lowLight);

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = (e: MediaQueryListEvent) => {
        const nextActive = e.matches ? "dark" : "light";
        setResolvedTheme(nextActive);
        applyThemeToDOM(nextActive, lowLight);
      };
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, [theme, lowLight]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);

    let active: "light" | "dark";
    if (newTheme === "system") {
      active = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      active = newTheme;
    }

    let nextLowLight = lowLight;
    if (active === "light") {
      nextLowLight = false;
      setLowLightState(false);
      localStorage.setItem(LOW_LIGHT_STORAGE_KEY, "0");
    }

    setResolvedTheme(active);
    applyThemeToDOM(active, nextLowLight);
  };

  const setLowLight = (enabled: boolean) => {
    setLowLightState(enabled);
    localStorage.setItem(LOW_LIGHT_STORAGE_KEY, enabled ? "1" : "0");
    if (enabled && resolvedTheme === "light") {
      setTheme("dark");
    } else {
      applyThemeToDOM(resolvedTheme, enabled);
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
