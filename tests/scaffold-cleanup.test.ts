import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const REMOVED_SCAFFOLD_SVGS = [
  "file.svg",
  "globe.svg",
  "next.svg",
  "vercel.svg",
  "window.svg",
] as const;

const SCAN_DIRS = [
  "app",
  "components",
  "content",
  "lib",
  "repositories",
  "tests",
] as const;

const SCAN_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".css",
  ".md",
  ".html",
  ".json",
]);

function collectFiles(dir: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absolutePath = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") {
        continue;
      }
      files.push(...collectFiles(absolutePath));
      continue;
    }

    if (SCAN_EXTENSIONS.has(extname(entry.name))) {
      files.push(absolutePath);
    }
  }

  return files;
}

describe("scaffold cleanup", () => {
  it("removed unused Next.js starter SVGs from public/", () => {
    for (const filename of REMOVED_SCAFFOLD_SVGS) {
      expect(existsSync(resolve(root, "public", filename))).toBe(false);
    }
  });

  it("does not ship any SVG assets in public/", () => {
    const publicSvgs = readdirSync(resolve(root, "public")).filter((name) =>
      name.endsWith(".svg"),
    );

    expect(publicSvgs).toEqual([]);
  });

  it("does not reference removed scaffold SVGs in product or test code", () => {
    const references: string[] = [];

    for (const dir of SCAN_DIRS) {
      const absoluteDir = resolve(root, dir);
      if (!existsSync(absoluteDir)) {
        continue;
      }

      for (const filePath of collectFiles(absoluteDir)) {
        if (filePath.endsWith("scaffold-cleanup.test.ts")) {
          continue;
        }

        const content = readFileSync(filePath, "utf8");
        for (const filename of REMOVED_SCAFFOLD_SVGS) {
          if (content.includes(filename)) {
            references.push(`${filePath}: ${filename}`);
          }
        }
      }
    }

    expect(references).toEqual([]);
  });

  it("keeps portrait JPEG assets in public/", () => {
    expect(existsSync(resolve(root, "public/portrait-michael.jpg"))).toBe(true);
    expect(existsSync(resolve(root, "public/portrait-michael-1200.jpg"))).toBe(
      true,
    );
  });
});
