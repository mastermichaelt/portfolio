import fs from "node:fs";
import path from "node:path";

/** @type {boolean} */
let envFilesLoaded = false;

/**
 * Load `.env.local` then `.env` from the repo root without overriding existing
 * process environment variables (matches generate-image / generate-video).
 *
 * @param {{ force?: boolean }} [options]
 */
export function loadEnvFiles(options = {}) {
  if (envFilesLoaded && !options.force) {
    return;
  }

  for (const file of [".env.local", ".env"]) {
    const full = path.resolve(process.cwd(), file);
    if (!fs.existsSync(full)) continue;
    const contents = fs.readFileSync(full, "utf8");
    for (const rawLine of contents.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }

  envFilesLoaded = true;
}

/**
 * Test helper — reset loader state between cases.
 */
export function resetEnvFileLoader() {
  envFilesLoaded = false;
}
