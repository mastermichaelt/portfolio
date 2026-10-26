#!/usr/bin/env node
/**
 * Write public/connect.webmanifest from lib/connect.ts (single source of truth).
 */
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CONNECT_WEB_MANIFEST } from "../lib/connect.ts";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const outputPath = resolve(repoRoot, "public/connect.webmanifest");

await writeFile(
  outputPath,
  `${JSON.stringify(CONNECT_WEB_MANIFEST, null, 2)}\n`,
  "utf8",
);
console.log(`Wrote ${outputPath}`);
