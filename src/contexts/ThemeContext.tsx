import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { readStoredString, writeStoredString } from "../utils/storage";

export type Theme = "light" | "dark";
/** What the user picked: an explicit theme, or "system" to follow the OS. */
export type ThemeSetting = Theme | "system";

const THEME_STORAGE_KEY = "mynotion-theme";

interface ThemeContextValue {
  /** The theme actually applied (setting resolved against the OS preference). */
  theme: Theme;
  setting: ThemeSetting;
  /** Light → dark → system → light. */
  cycleTheme: () => void;
  /** Jump straight to the opposite of what's on screen (Quick Find action). */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readInitialSetting(): ThemeSetting {
  const stored = readStoredString(THEME_STORAGE_KEY);
  return stored === "dark" || stored === "light" ? stored : "system";
}

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [setting, setSetting] = useState<ThemeSetting>(readInitialSetting);
  const [osTheme, setOsTheme] = useState<Theme>(systemTheme);

  // Follow live OS theme changes while in "system" mode.
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setOsTheme(query.matches ? "dark" : "light");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const theme: Theme = setting === "system" ? osTheme : setting;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    writeStoredString(THEME_STORAGE_KEY, setting);
    // Keep the browser/PWA chrome color in step with the app background.
    document
      .getElementById("meta-theme-color")
      ?.setAttribute("content", theme === "dark" ? "#191919" : "#ffffff");
  }, [theme, setting]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setting,
      cycleTheme: () =>
        setSetting((current) =>
          current === "light" ? "dark" : current === "dark" ? "system" : "light",
        ),
      toggleTheme: () => setSetting(theme === "dark" ? "light" : "dark"),
    }),
    [theme, setting],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside <ThemeProvider>");
  return value;
}
