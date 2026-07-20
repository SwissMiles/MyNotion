import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { readStoredString, writeStoredString } from "../utils/storage";

export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "mynotion-theme";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readInitialTheme(): Theme {
  return readStoredString(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    writeStoredString(THEME_STORAGE_KEY, theme);
    // Keep the browser/PWA chrome color in step with the app background.
    document
      .getElementById("meta-theme-color")
      ?.setAttribute("content", theme === "dark" ? "#191919" : "#ffffff");
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside <ThemeProvider>");
  return value;
}
