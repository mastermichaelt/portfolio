"use client";

import { useTheme } from "@/components/ThemeProvider";

/* Treatment 04: a binary, icon-led switch that names the DESTINATION, not the
   current state. In dark it offers Light; in light it offers Dark. The glyph is
   the site's one drawn mark and follows the architecture figure's stroke
   discipline (no fill, no radius, currentColor). Styling lives in
   app/styles/theme-control.css.

   Both destination states are rendered; CSS keyed on html[data-theme] shows the
   right one. That attribute is set pre-paint (components/ThemeScript.tsx), so
   the correct label is visible on the first frame with no flash and no
   hydration reconciliation — the server and client render identical markup, and
   the hidden state is display:none, so it is absent from the accessible name. */

// Single-path glyphs so each shares one stable DOM node.
const SUN_PATH =
  "M4.9 8a3.1 3.1 0 1 0 6.2 0 3.1 3.1 0 1 0-6.2 0M8 1v1.7M8 13.3V15M1 8h1.7M13.3 8H15M3.05 3.05l1.2 1.2M11.75 11.75l1.2 1.2M12.95 3.05l-1.2 1.2M4.25 11.75l-1.2 1.2";
const MOON_PATH = "M13.2 10.3A5.6 5.6 0 0 1 5.7 2.8 5.9 5.9 0 1 0 13.2 10.3Z";

function Glyph({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

export function ThemeSwitch({
  variant = "desktop",
}: {
  variant?: "desktop" | "mobile";
}) {
  const { toggle } = useTheme();
  const labelClass = variant === "desktop" ? "theme-switch-label" : undefined;

  return (
    <button
      className={
        variant === "desktop" ? "theme-switch theme-hit" : "theme-switch-row"
      }
      type="button"
      onClick={toggle}
    >
      {/* Shown in dark: the destination is Light. */}
      <span className="theme-state theme-when-dark">
        <Glyph path={SUN_PATH} />
        <span className={labelClass}>Light mode</span>
      </span>
      {/* Shown in light: the destination is Dark. */}
      <span className="theme-state theme-when-light">
        <Glyph path={MOON_PATH} />
        <span className={labelClass}>Dark mode</span>
      </span>
    </button>
  );
}
