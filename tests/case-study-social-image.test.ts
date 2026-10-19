import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import Image from "@/app/projects/[slug]/opengraph-image";
import TwitterImage from "@/app/projects/[slug]/twitter-image";
import { listCaseStudyParams } from "@/lib/case-study-entry";

const CARDS_DIR = join(process.cwd(), "app/projects/[slug]/_cards");

/** Width/height from the PNG IHDR chunk. */
function pngSize(bytes: Buffer) {
  expect(bytes.subarray(1, 4).toString("latin1")).toBe("PNG");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe("per-case-study social image route", () => {
  it("serves every prerendered slug's approved card byte-for-byte", async () => {
    const params = await listCaseStudyParams();
    expect(params).toHaveLength(4);

    for (const { slug } of params) {
      const source = readFileSync(join(CARDS_DIR, `${slug}.png`));
      for (const route of [Image, TwitterImage]) {
        const response = await route({ params: Promise.resolve({ slug }) });
        expect(response.status).toBe(200);
        expect(response.headers.get("content-type")).toBe("image/png");
        expect(Buffer.from(await response.arrayBuffer()).equals(source)).toBe(
          true,
        );
      }

      // Large-card aspect (1.91:1, the 1200×630 ratio) within 1%.
      const { width, height } = pngSize(source);
      expect(Math.abs(width / height / (1200 / 630) - 1)).toBeLessThan(0.01);
    }
  });

  it("404s an unknown slug before touching the filesystem", async () => {
    await expect(
      Image({ params: Promise.resolve({ slug: "../../package" }) }),
    ).rejects.toMatchObject({ digest: expect.stringContaining("404") });
  });
});
