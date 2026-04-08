/**
 * useTheme — Persistent dark/light theme hook
 *
 * Strategy:
 *  • Reads the initial value from localStorage (set by the FOUC-prevention
 *    script in index.html before React hydrates, so there is zero flash).
 *  • Keeps a React state in sync with the <html data-theme="..."> attribute
 *    so all CSS variable overrides cascade automatically.
 *  • Writes back to localStorage on every toggle.
 */

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "rms-theme";
const DARK  = "dark";
const LIGHT = "light";

/**
 * Read the theme that was already applied by the inline script.
 * Falls back to the OS preference if localStorage is empty.
 */
function getInitialTheme() {
  if (typeof window === "undefined") return DARK;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === DARK || stored === LIGHT) return stored;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? LIGHT : DARK;
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  /* Keep the <html> attribute and localStorage in sync. */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === DARK ? LIGHT : DARK));
  }, []);

  const isDark  = theme === DARK;
  const isLight = theme === LIGHT;

  return { theme, isDark, isLight, toggleTheme };
}
