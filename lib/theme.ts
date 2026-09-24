/* Theme state model.

   Storage: localStorage["theme"] ∈ {"light","dark"}. Absence means "follow the
   system preference" — System is the implicit default and is never stored, so
   the UI needs no third state. The first explicit choice stops system-following
   and persists across sessions.

   The document theme is expressed as a concrete attribute on <html>:
   `data-theme="light"` | `data-theme="dark"`, which drives app/styles/theme.css.
   The pre-paint bootstrap (components/ThemeScript.tsx) and the React provider
   (components/ThemeProvider.tsx) both resolve through resolveTheme(). */

export type Theme = "light" | "dark";

/** localStorage key holding an explicit choice, or nothing when following system. */
export const THEME_STORAGE_KEY = "theme";

/** The attribute on <html> that app/styles/theme.css keys off. */
export const THEME_ATTRIBUTE = "data-theme";

/** A stored value is honoured only when it is a valid concrete theme. */
export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

/**
 * Resolve the theme to paint.
 * An explicit stored choice always wins; otherwise follow the system.
 */
export function resolveTheme(
  stored: string | null | undefined,
  systemPrefersDark: boolean,
): Theme {
  if (isTheme(stored)) return stored;
  return systemPrefersDark ? "dark" : "light";
}

/**
 * The theme to apply when the OS colour-scheme changes while the page is open,
 * or `null` when the change must be ignored. An explicit stored choice pins the
 * theme (returns `null`); with no stored choice the page follows the system.
 * This is the decision the provider's matchMedia listener makes, extracted so
 * both sides of the contract are unit-testable.
 */
export function themeOnSystemChange(
  stored: string | null | undefined,
  systemPrefersDark: boolean,
): Theme | null {
  if (isTheme(stored)) return null;
  return resolveTheme(null, systemPrefersDark);
}
