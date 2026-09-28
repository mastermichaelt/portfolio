import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    // Upstream Impeccable skill payload (vendor; not project source)
    ".cursor/skills/impeccable/**",
    // Vendored scroll-craft engine, served verbatim and hash-pinned
    // (vendor/scrollcraft/PROVENANCE.md). Linting it would invite an autofix.
    "public/vendor/scrollcraft/**",
  ]),
]);

export default eslintConfig;
