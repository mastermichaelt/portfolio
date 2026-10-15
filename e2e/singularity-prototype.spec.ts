import { expect, test } from "@playwright/test";

const PROTOTYPE = "/experiments/home-hero-prototype";
const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 390, height: 844 };

test.describe("Singularity Wake visual prototype", () => {
  test("desktop arms scroll choreography and keeps hero readable", async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto(PROTOTYPE);

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /follow the product requirement/i,
      }),
    ).toBeVisible();

    await page.waitForSelector('[data-singularity-proto="armed"]');
    await page.waitForSelector(".sw-proto__canvas-host canvas", {
      timeout: 15_000,
    });

    const before = await page.locator("[data-sw-scene-label]").innerText();
    expect(before).toMatch(/Scene I/i);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForFunction(() => {
      const label = document.querySelector("[data-sw-scene-label]");
      return label?.textContent?.includes("Scene II");
    });

    const after = await page.locator("[data-sw-scene-label]").innerText();
    expect(after).toMatch(/Scene II/i);
  });

  test("mobile shows static plates without canvas", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(PROTOTYPE);

    await expect(page.locator(".sw-proto__desktop")).toBeHidden();
    await expect(
      page.locator(".sw-proto__mobile .sw-proto__title"),
    ).toBeVisible();
    await expect(page.locator(".sw-proto__plate")).toHaveCount(2);
    await expect(page.locator("canvas")).toHaveCount(0);
  });

  test("reduced motion settles without canvas on desktop", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize(DESKTOP);
    await page.goto(PROTOTYPE);

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /follow the product requirement/i,
      }),
    ).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.locator('[data-singularity-proto="armed"]')).toHaveCount(
      0,
    );
  });
});
