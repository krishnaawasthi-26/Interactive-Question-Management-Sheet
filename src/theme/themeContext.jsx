import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export const THEME_NAMES = {
  SUPERMAN: "superman-light",
  BATMAN: "batman-dark",
  JOKER: "joker-blue",
};

const THEME_STORAGE_KEY = "iqms-cinematic-theme";
const SWITCH_COUNT_STORAGE_KEY = "iqms-cinematic-theme-switch-count";
const JOKER_TRIGGER_COUNT = 5;

const VALID_THEMES = new Set(Object.values(THEME_NAMES));

const ThemeContext = createContext(null);

function readInitialThemeState() {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  const storedCountRaw = window.localStorage.getItem(SWITCH_COUNT_STORAGE_KEY);
  const storedCount = Number.parseInt(storedCountRaw || "0", 10);

  return {
    theme: VALID_THEMES.has(storedTheme) ? storedTheme : THEME_NAMES.SUPERMAN,
    switchCount: Number.isFinite(storedCount) && storedCount >= 0 ? storedCount : 0,
  };
}

function nextPreviewTheme(theme, switchCount) {
  if (theme === THEME_NAMES.JOKER) return THEME_NAMES.SUPERMAN;

  const projectedCount = switchCount + 1;
  if (projectedCount % JOKER_TRIGGER_COUNT === 0) return THEME_NAMES.JOKER;

  return theme === THEME_NAMES.SUPERMAN ? THEME_NAMES.BATMAN : THEME_NAMES.SUPERMAN;
}

export function ThemeProvider({ children }) {
  const [themeState, setThemeState] = useState(readInitialThemeState);
  const [animationTheme, setAnimationTheme] = useState(themeState.theme);

  useEffect(() => {
    document.documentElement.dataset.theme = themeState.theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, themeState.theme);
    window.localStorage.setItem(SWITCH_COUNT_STORAGE_KEY, String(themeState.switchCount));
  }, [themeState]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.themeAnimation = animationTheme;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timeout = window.setTimeout(() => {
      if (root.dataset.themeAnimation === animationTheme) {
        root.removeAttribute("data-theme-animation");
      }
    }, prefersReducedMotion ? 20 : 760);

    return () => window.clearTimeout(timeout);
  }, [animationTheme]);

  const cycleTheme = useCallback(() => {
    setThemeState((current) => {
      if (current.theme === THEME_NAMES.JOKER) {
        const next = { theme: THEME_NAMES.SUPERMAN, switchCount: 0 };
        setAnimationTheme(next.theme);
        return next;
      }

      const nextCount = current.switchCount + 1;
      const nextTheme = nextCount % JOKER_TRIGGER_COUNT === 0
        ? THEME_NAMES.JOKER
        : current.theme === THEME_NAMES.SUPERMAN
          ? THEME_NAMES.BATMAN
          : THEME_NAMES.SUPERMAN;

      const next = { theme: nextTheme, switchCount: nextCount };
      setAnimationTheme(nextTheme);
      return next;
    });
  }, []);

  const value = useMemo(() => ({
    theme: themeState.theme,
    switchCount: themeState.switchCount,
    cycleTheme,
    nextTheme: nextPreviewTheme(themeState.theme, themeState.switchCount),
    jokerTriggerCount: JOKER_TRIGGER_COUNT,
  }), [cycleTheme, themeState]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return context;
}
