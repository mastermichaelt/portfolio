import { THEME_ATTRIBUTE, THEME_STORAGE_KEY } from "@/lib/theme";

/* Pre-paint theme bootstrap.

   Runs synchronously in <head>, before first paint, so the correct theme is on
   <html> for the first frame — no flash of the wrong theme, including for a
   visitor whose stored choice differs from their system setting. It mirrors
   resolveTheme(): an explicit stored choice wins, otherwise follow the system.

   There is no CSP on this app today, so this inline script needs no nonce or
   hash. If a Content-Security-Policy is ever added, this is the one script that
   must be allowed (via a nonce or hash) — everything else is external or
   React-managed. See docs/design-system.md § Theme system.

   Kept resilient: any failure (private-mode storage throw, etc.) falls through
   to the dark baseline that :root already paints, so it can never break paint. */
const script = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute(${JSON.stringify(
  THEME_ATTRIBUTE,
)},t);}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
