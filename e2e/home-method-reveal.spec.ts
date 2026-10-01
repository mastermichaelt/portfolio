import { expect, test, type Page } from "@playwright/test";

/**
 * The homepage "two systems, one method" reveal, on GSAP ScrollTrigger
 * (components/home/MethodReveal.tsx). This is the production successor to the
 * scroll-craft spike; the runtime migration and its a11y contract are recorded
 * in docs/experiments/scroll-craft-baseline.md.
 *
 * The behaviour asserted is unchanged from the engine version — the four
 * method-dimension rows reveal once on entry, staggered, in both responsive
 * projections, and degrade to the resolved document with no JS, under reduced
 * motion, for keyboard readers and in print. What is new, and asserted here, is
 * that the reveal re-arms on every visit: GSAP reverts on unmount and rebuilds
 * on remount, so a client-side return to `/` gets the full reveal rather than
 * the mount-once settled state the engine was forced into.
 *
 * Every reveal test loads the page at a short viewport so the method section
 * starts below the fold: the ScrollTrigger fires during load otherwise and the
 * reveal is already finished before the assertions run.
 */
const SHORT_VIEWPORT = { width: 1280, height: 460 };
const NARROW_VIEWPORT = { width: 390, height: 640 };

const WIDE_ROWS = ".home2-only-wide .home2-matrix > *";
const NARROW_ROWS = ".home2-only-narrow .home2-schema > *";

async function opacities(page: Page, selector: string) {
  return page.$$eval(selector, (els) =>
    els.map((el) => Number(getComputedStyle(el).opacity)),
  );
}

/** The shown projection carries `data-method-reveal="armed"` once GSAP has armed
 *  it; the hidden projection keeps the bare marker. */
async function waitForArmed(page: Page) {
  await page.waitForSelector('[data-method-reveal="armed"]');
}

/** Home → About → Home through the site's own links, i.e. client-side
 *  navigation, which unmounts MethodReveal and remounts it on return. */
async function roundTripThroughAbout(page: Page) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("link", { name: "About" })
    .click();
  await page.waitForURL("**/about");
  await page.getByRole("link", { name: "Michael Truong" }).click();
  await page.waitForURL((url) => new URL(url).pathname === "/");
}

test.describe("the method reveal boundary", () => {
  test("scroll-craft is gone: no engine global, script or attributes", async ({
    page,
  }) => {
    await page.goto("/");
    const trace = await page.evaluate(() => ({
      engine: typeof (window as unknown as { ScrollCraft?: unknown })
        .ScrollCraft,
      script: document.querySelectorAll('script[src*="scrollcraft"]').length,
      scAttrs: document.querySelectorAll(
        "[data-sc-act], [data-sc-in], [data-sc-stagger], [data-scrollcraft-scope]",
      ).length,
      groups: document.querySelectorAll("[data-method-reveal]").length,
    }));
    // Both projections carry the marker (one is display:none), the engine does
    // not exist, and none of its attributes survive the migration.
    expect(trace).toEqual({
      engine: "undefined",
      script: 0,
      scAttrs: 0,
      groups: 2,
    });
  });

  test("does not mount on other routes", async ({ page }) => {
    for (const route of ["/projects", "/articles", "/about", "/ecosystem"]) {
      await page.goto(route);
      const leaked = await page.evaluate(() => ({
        groups: document.querySelectorAll("[data-method-reveal]").length,
        armed: document.querySelectorAll('[data-method-reveal="armed"]').length,
      }));
      expect(leaked, route).toEqual({ groups: 0, armed: 0 });
    }
  });
});

test.describe("the method reveal", () => {
  test.use({ viewport: SHORT_VIEWPORT });

  test("starts hidden below the fold, then reveals in a stagger and holds", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForArmed(page);

    expect(
      await page.evaluate(
        () =>
          document.querySelector(".home2-matrix")!.getBoundingClientRect().top,
      ),
      "the matrix must start below the fold or there is no reveal to observe",
    ).toBeGreaterThan(SHORT_VIEWPORT.height);

    // Exactly 0, not merely low: the armed state is set instantly, so arming
    // must never animate settled content away.
    expect(
      await opacities(page, WIDE_ROWS),
      "every row armed at exactly 0 before entry, with no fade-out",
    ).toEqual([0, 0, 0, 0, 0, 0]);

    // Scroll it into view to fire the once-only ScrollTrigger, then catch the
    // cascade mid-flight: the stagger means the first row leads the last.
    await page.evaluate(() =>
      document
        .querySelector(".home2-matrix")!
        .scrollIntoView({ block: "center", behavior: "instant" }),
    );
    await page.waitForFunction(
      () =>
        Number(
          getComputedStyle(document.querySelector(".home2-matrix > *")!)
            .opacity,
        ) > 0,
    );
    await page.waitForTimeout(150);
    const mid = await opacities(page, WIDE_ROWS);
    expect(mid[0], "the first row leads the cascade").toBeGreaterThan(0);
    expect(mid.at(-1)!, "the last row still trails the first").toBeLessThan(
      mid[0],
    );

    // And it settles fully: a row that peaks below 1 is a mis-set reveal.
    await expect
      .poll(() => opacities(page, WIDE_ROWS), { timeout: 4000 })
      .toEqual([1, 1, 1, 1, 1, 1]);

    // Fires once. Content that re-hides on scroll-up is a defect, not an effect.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(700);
    expect(await opacities(page, WIDE_ROWS)).toEqual([1, 1, 1, 1, 1, 1]);
  });

  test("reveals the narrow projection on a phone viewport", async ({
    page,
  }) => {
    await page.setViewportSize(NARROW_VIEWPORT);
    await page.goto("/");
    await waitForArmed(page);

    await expect(page.locator(".home2-only-narrow")).toBeVisible();
    await expect(page.locator(".home2-only-wide")).toBeHidden();

    await page.evaluate(() =>
      document
        .querySelector(".home2-schema")!
        .scrollIntoView({ block: "center", behavior: "instant" }),
    );
    await expect
      .poll(() => opacities(page, NARROW_ROWS), { timeout: 4000 })
      .toEqual([1, 1, 1, 1]);
  });
});

test.describe("the reveal degrades to readable content", () => {
  test.use({ viewport: SHORT_VIEWPORT });

  test("with reduced motion: settled immediately, no translation", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: SHORT_VIEWPORT,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto("/");

    // The arming branch is gated on `no-preference`, so a reduced-motion visitor
    // is never armed: the rows are settled from first paint and never offset.
    // No "armed" marker is ever written, so the resolved document is the floor.
    await expect(page.locator('[data-method-reveal="armed"]')).toHaveCount(0);
    expect(await opacities(page, WIDE_ROWS)).toEqual([1, 1, 1, 1, 1, 1]);
    expect(
      await page.$$eval(WIDE_ROWS, (els) =>
        els.map(
          (el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).f,
        ),
      ),
    ).toEqual([0, 0, 0, 0, 0, 0]);

    await context.close();
  });

  test("with JavaScript disabled: the resolved composition still renders", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: SHORT_VIEWPORT,
      javaScriptEnabled: false,
    });
    const page = await context.newPage();
    await page.goto("/");

    // No runtime, so nothing is armed: the pre-runtime state is the settled
    // state. There is no CSS rule that hides anything, so content cannot be
    // stranded behind a runtime that never loaded.
    await expect(page.locator('[data-method-reveal="armed"]')).toHaveCount(0);
    expect(await opacities(page, WIDE_ROWS)).toEqual([1, 1, 1, 1, 1, 1]);
    await expect(
      page.getByRole("heading", { name: "Two systems, one method" }),
    ).toBeVisible();

    await context.close();
  });
});

test.describe("keyboard access into an armed section", () => {
  test.use({ viewport: SHORT_VIEWPORT });

  test("focus never lands on an invisible row", async ({ page }) => {
    await page.goto("/");
    await waitForArmed(page);
    expect(await opacities(page, WIDE_ROWS)).toEqual([0, 0, 0, 0, 0, 0]);

    // Tab out of the site chrome and into the method section. GSAP writes the
    // armed state as inline opacity 0; without the `:focus-within` rule in
    // home.css the focus ring lands on a row still at opacity 0.
    let landed = null;
    for (let i = 0; i < 20 && landed === null; i += 1) {
      await page.keyboard.press("Tab");
      landed = await page.evaluate(() => {
        const active = document.activeElement;
        const row = active?.closest(".home2-matrix > *");
        if (!row) return null;
        return {
          label: active?.textContent?.trim().slice(0, 40),
          rowOpacity: Number(getComputedStyle(row).opacity),
        };
      });
    }

    expect(landed, "tabbing should reach the method section").not.toBeNull();
    expect(
      landed!.rowOpacity,
      `focus landed on "${landed?.label}" while its row was invisible`,
    ).toBe(1);
  });
});

test.describe("print", () => {
  test.use({ viewport: SHORT_VIEWPORT });

  test("armed rows are fully visible on paper", async ({ page }) => {
    await page.goto("/");
    await waitForArmed(page);

    // Unscrolled and armed: exactly the state a print or save-to-PDF starts
    // from, and the one in which the method section used to print blank.
    expect(await opacities(page, WIDE_ROWS)).toEqual([0, 0, 0, 0, 0, 0]);

    await page.emulateMedia({ media: "print" });
    expect(await opacities(page, WIDE_ROWS)).toEqual([1, 1, 1, 1, 1, 1]);
    expect(
      await page.$$eval(WIDE_ROWS, (els) =>
        els.map(
          (el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).f,
        ),
      ),
    ).toEqual([0, 0, 0, 0, 0, 0]);

    await page.emulateMedia({ media: "screen" });
    expect(
      await opacities(page, WIDE_ROWS),
      "print must not permanently settle the on-screen reveal",
    ).toEqual([0, 0, 0, 0, 0, 0]);
  });

  test("the narrow projection prints too", async ({ page }) => {
    await page.setViewportSize(NARROW_VIEWPORT);
    await page.goto("/");
    await waitForArmed(page);

    await page.emulateMedia({ media: "print" });
    expect(await opacities(page, NARROW_ROWS)).toEqual([1, 1, 1, 1]);
  });
});

test.describe("reveal lifecycle across client-side navigation", () => {
  test.use({ viewport: SHORT_VIEWPORT });

  test("re-arms and re-reveals on every return home, with no console errors", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await page.goto("/");
    await waitForArmed(page);
    expect(await opacities(page, WIDE_ROWS)).toEqual([0, 0, 0, 0, 0, 0]);

    // Three cycles: the engine version leaked 1 → 2 → 3 → 4 instances here and
    // rendered the returned section settled. GSAP reverts on unmount and rebuilds
    // on remount, so each return arms the matrix fresh (below the fold, at 0) and
    // reveals it on scroll — the full experience every visit.
    for (let cycle = 1; cycle <= 3; cycle += 1) {
      await roundTripThroughAbout(page);
      await waitForArmed(page);
      expect(
        await opacities(page, WIDE_ROWS),
        `re-armed below the fold after ${cycle} round trip(s)`,
      ).toEqual([0, 0, 0, 0, 0, 0]);

      await page.evaluate(() =>
        document
          .querySelector(".home2-matrix")!
          .scrollIntoView({ block: "center", behavior: "instant" }),
      );
      await expect
        .poll(() => opacities(page, WIDE_ROWS), { timeout: 4000 })
        .toEqual([1, 1, 1, 1, 1, 1]);
    }

    expect(errors, "no runtime errors across the round trips").toEqual([]);
  });
});

test("the reveal preserves the method section's reading order", async ({
  page,
}) => {
  await page.goto("/");

  // GSAP never generates or reorders DOM. Guard the order the ARIA table depends
  // on: the ordinals of the four method dimensions, in sequence.
  expect(
    await page.$$eval(".home2-only-wide .home2-dim-ord", (els) =>
      els.map((el) => el.textContent?.trim()),
    ),
  ).toEqual(["01", "02", "03", "04"]);

  await expect(page.locator('.home2-matrix[role="table"]')).toHaveAttribute(
    "aria-labelledby",
    "home2-method-head",
  );
  await expect(page.locator('.home2-matrix [role="row"]')).toHaveCount(6);
});
