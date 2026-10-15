import { expect, test, type Page } from "@playwright/test";

const PROTOTYPE = "/experiments/home-hero-prototype";
const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 390, height: 844 };
const STAGE = "[data-singularity-stage]";

/** Scroll to a ScrollTrigger progress value using the trigger's start/end pixels. */
async function scrollToSingularityProgress(
  page: Page,
  target: number,
  tolerance = 0.04,
) {
  await page.waitForSelector("[data-singularity-scroll-end]");
  await page.evaluate((t) => {
    const root = document.querySelector(".sw-proto");
    if (!root) return;
    const start = parseFloat(
      root.getAttribute("data-singularity-scroll-start") ?? "0",
    );
    const end = parseFloat(
      root.getAttribute("data-singularity-scroll-end") ?? "0",
    );
    window.scrollTo(0, start + (end - start) * t);
  }, target);

  await page.waitForFunction(
    ({ t, tol }) => {
      const raw = document
        .querySelector(".sw-proto")
        ?.getAttribute("data-singularity-progress");
      const p = raw ? parseFloat(raw) : 0;
      return Math.abs(p - t) <= tol;
    },
    { t: target, tol: tolerance },
    { timeout: 15_000 },
  );
}

test.describe("Singularity Wake visual prototype", () => {
  test("desktop arms scroll choreography and keeps hero readable", async ({
    page,
  }) => {
    test.setTimeout(60_000);
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

    await scrollToSingularityProgress(page, 0.08);
    expect(await page.locator("[data-sw-scene-label]").innerText()).toMatch(
      /Scene I/i,
    );

    await scrollToSingularityProgress(page, 0.72);
    expect(await page.locator("[data-sw-scene-label]").innerText()).toMatch(
      /Scene II/i,
    );
  });

  test("desktop fixed scroll positions match visual baselines", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.setViewportSize(DESKTOP);
    await page.goto(PROTOTYPE);
    await page.waitForSelector(".sw-proto__canvas-host canvas", {
      timeout: 15_000,
    });

    async function expectStageScreenshot(name: string) {
      const clip = await page.locator(STAGE).boundingBox();
      if (!clip) throw new Error("stage bounding box missing");
      await expect(page).toHaveScreenshot(name, {
        clip,
        animations: "disabled",
        maxDiffPixelRatio: 0.06,
        timeout: 20_000,
      });
    }

    await scrollToSingularityProgress(page, 0.12);
    await expectStageScreenshot("singularity-proto-progress-0.12.png");

    await scrollToSingularityProgress(page, 0.55);
    await expectStageScreenshot("singularity-proto-progress-0.55.png");

    await scrollToSingularityProgress(page, 0.88);
    await expectStageScreenshot("singularity-proto-progress-0.88.png");
  });

  test("scrub back to the same progress reproduces the same stage pixels", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.setViewportSize(DESKTOP);
    await page.goto(PROTOTYPE);
    await page.waitForSelector(".sw-proto__canvas-host canvas", {
      timeout: 15_000,
    });

    const stage = page.locator(STAGE);
    await scrollToSingularityProgress(page, 0.62);
    const first = await stage.screenshot();

    await scrollToSingularityProgress(page, 0.18);
    await scrollToSingularityProgress(page, 0.62);
    const second = await stage.screenshot();

    expect(first.equals(second)).toBe(true);
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
