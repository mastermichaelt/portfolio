"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  themeOnSystemChange,
  THEME_ATTRIBUTE,
  THEME_STORAGE_KEY,
  type Theme,
} from "@/lib/theme";

type ThemeContextValue = {
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const DARK_QUERY = "(prefers-color-scheme: dark)";

/** The theme currently on <html> (set pre-paint by ThemeScript). This is the
 *  source of truth for what is painted; the switch display is CSS-driven from
 *  the same attribute, so no React theme state is needed for rendering. */
function currentTheme(): Theme {
  return document.documentElement.getAttribute(THEME_ATTRIBUTE) === "light"
    ? "light"
    : "dark";
}

function apply(theme: Theme) {
  document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
}

function readStored(): string | null {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Only used to announce the change to assistive tech; empty until a choice is
  // made, so no announcement fires on load.
  const [message, setMessage] = useState("");

  const setTheme = useCallback((next: Theme) => {
    apply(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private mode / storage disabled: the choice holds for this page.
    }
    setMessage(`Theme: ${next === "dark" ? "Dark" : "Light"}`);
  }, []);

  const toggle = useCallback(() => {
    setTheme(currentTheme() === "dark" ? "light" : "dark");
  }, [setTheme]);

  // While no explicit choice is stored, follow live OS-theme changes.
  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);
    const onChange = () => {
      const next = themeOnSystemChange(readStored(), media.matches);
      if (next) apply(next);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return (
    <ThemeContext.Provider value={{ toggle }}>
      {children}
      <p role="status" aria-live="polite" className="sr-only">
        {message}
      </p>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return value;
}
