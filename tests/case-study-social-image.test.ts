import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  CASE_STUDY_CARDS,
  CASE_STUDY_CARDS_DIR,
  caseStudyCard,
  caseStudyCardVersion,
  caseStudySocialImages,
  readCaseStudyCardPng,
} from "@/app/projects/[slug]/_cards/cards";
import Image from "@/app/projects/[slug]/opengraph-image";
import { listCaseStudyParams } from "@/lib/case-study-entry";

/** Width/height from the PNG IHDR chunk. */
function pngSize(bytes: Buffer) {
  expect(bytes.subarray(1, 4).toString("latin1")).toBe("PNG");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe("per-case-study social cards", () => {
  afterEach(() => {
    delete CASE_STUDY_CARDS["no-png-yet"];
  });

  it("has exactly one card entry and PNG per prerendered slug", async () => {
    const slugs = (await listCaseStudyParams()).map((p) => p.slug).sort();
    expect(Object.keys(CASE_STUDY_CARDS).sort()).toEqual(slugs);
    expect(
      readdirSync(CASE_STUDY_CARDS_DIR)
        .filter((file) => file.endsWith(".png"))
        .sort(),
    ).toEqual(slugs.map((slug) => `${slug}.png`));
  });

  it("declares each card's real size, a 1.91:1 aspect, and its own alt text", () => {
    const alts = new Set<string>();
    for (const [slug, card] of Object.entries(CASE_STUDY_CARDS)) {
      const size = pngSize(
        readFileSync(join(CASE_STUDY_CARDS_DIR, `${slug}.png`)),
      );
      expect(size).toEqual({ width: card.width, height: card.height });
      expect(
        Math.abs(card.width / card.height / (1200 / 630) - 1),
      ).toBeLessThan(0.01);
      expect(card.alt.length).toBeGreaterThan(40);
      alts.add(card.alt);
    }
    expect(alts.size).toBe(Object.keys(CASE_STUDY_CARDS).length);
  });

  it("serves every prerendered slug's approved card byte-for-byte", async () => {
    for (const { slug } of await listCaseStudyParams()) {
      const source = readFileSync(join(CASE_STUDY_CARDS_DIR, `${slug}.png`));
      const response = await Image({ params: Promise.resolve({ slug }) });
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("image/png");
      expect(Buffer.from(await response.arrayBuffer()).equals(source)).toBe(
        true,
      );
    }
  });

  it("versions the shared og/twitter image URL by the PNG's bytes", async () => {
    for (const slug of Object.keys(CASE_STUDY_CARDS)) {
      const source = readFileSync(join(CASE_STUDY_CARDS_DIR, `${slug}.png`));
      const version = caseStudyCardVersion(source);
      expect(version).toMatch(/^[0-9a-f]{12}$/);

      const images = await caseStudySocialImages(slug);
      expect(images.openGraph).toEqual([
        expect.objectContaining({
          url: `/projects/${slug}/opengraph-image?v=${version}`,
        }),
      ]);
      // One canonical endpoint: Twitter reuses the Open Graph image entry.
      expect(images.twitter).toEqual(images.openGraph);
    }
  });

  it("keeps the version stable for the same bytes and changes it for any byte change", () => {
    const source = readFileSync(join(CASE_STUDY_CARDS_DIR, "codenames-ai.png"));
    const edited = Buffer.from(source);
    edited[edited.length - 100] ^= 0xff;

    expect(caseStudyCardVersion(Buffer.from(source))).toBe(
      caseStudyCardVersion(source),
    );
    expect(caseStudyCardVersion(edited)).not.toBe(caseStudyCardVersion(source));
  });

  it("404s an unknown slug before touching the filesystem", async () => {
    await expect(
      Image({ params: Promise.resolve({ slug: "../../package" }) }),
    ).rejects.toMatchObject({ digest: expect.stringContaining("404") });
  });

  it("fails with an actionable error when a card entry or PNG is missing", async () => {
    await expect(readCaseStudyCardPng("unlisted")).rejects.toThrow(
      /Missing social card for \/projects\/unlisted: no CASE_STUDY_CARDS entry.*_cards\/unlisted\.png/,
    );

    // Inherited Object.prototype keys are not card entries.
    expect(() => caseStudyCard("constructor")).toThrow(
      /no CASE_STUDY_CARDS entry/,
    );
    await expect(readCaseStudyCardPng("toString")).rejects.toThrow(
      /no CASE_STUDY_CARDS entry/,
    );

    CASE_STUDY_CARDS["no-png-yet"] = { alt: "x", width: 1200, height: 630 };
    await expect(readCaseStudyCardPng("no-png-yet")).rejects.toThrow(
      /Missing social card for \/projects\/no-png-yet: no-png-yet\.png not found/,
    );
  });
});
