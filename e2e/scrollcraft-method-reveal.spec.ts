import { expect, test, type Page } from "@playwright/test";

/**
 * The scroll-craft integration spike. Boundary and findings:
 * docs/experiments/scroll-craft-baseline.md
 *
 * The upstream verification harness (`scripts/shoot.mjs`) walks a page and
 * reports dead scroll, cue opacity and contrast over media. It runs clean
 * against this page but reports `cues=0`, because a `data-sc-in` reveal is not
 * a cue: none of its three findings can see the device this slice actually
 * uses. So the behaviour is asserted here instead.
 *
 * Every reveal test loads the page at a short viewport so the method section
 * starts below the fold. Emulating the viewport after load is not equivalent:
 * the engine's IntersectionObserver fires during load and the reveal is already
 * finished by the time the assertions run.
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

/** The armed state is gated on the scope element's own attribute, written by
 *  the mount that drives it, not on the document-wide `html.sc-ready`. */
async function waitForLiveMount(page: Page) {
  await page.waitForSelector(
    '[data-scrollcraft-scope][data-scrollcraft-mounted="true"]',
  );
}

/** Home → About → Home through the site's own links, i.e. client-side
 *  navigation, which destroys and rebuilds the home tree's DOM. */
async function roundTripThroughAbout(page: Page) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("link", { name: "About" })
    .click();
  await page.waitForURL("**/about");
  await page.getByRole("link", { name: "Michael Truong" }).click();
  await page.waitForURL((url) => new URL(url).pathname === "/");
}

async function engineState(page: Page) {
  return page.evaluate(() => ({
    instances: window.ScrollCraft?.instances.length ?? 0,
    detachedActs: (window.ScrollCraft?.instances ?? []).reduce(
      (total, instance) =>
        total +
        instance.acts.filter((act) => !document.contains(act.el)).length,
      0,
    ),
  }));
}

test.describe("scroll-craft engine boundary", () => {
  test("mounts once, scoped to the method section and nothing else", async ({
    page,
  }) => {
    await page.goto("/");
    await expect
      .poll(() => page.evaluate(() => window.ScrollCraft?.instances.length))
      .toBe(1);

    const scope = await page.evaluate(() => {
      const el = document.querySelector("[data-scrollcraft-scope]");
      return {
        count: document.querySelectorAll("[data-scrollcraft-scope]").length,
        className: el?.className,
        // The engine collects acts with root.querySelectorAll, which never
        // matches the root itself, so the act has to be a strict descendant.
        actsReachable: el?.querySelectorAll("[data-sc-act]").length,
        actsOnPage: document.querySelectorAll("[data-sc-act]").length,
      };
    });

    expect(scope.count).toBe(1);
    expect(scope.className).toBe("home2-method");
    expect(scope.actsReachable).toBe(1);
    expect(scope.actsOnPage).toBe(1);
  });

  test("the flow act publishes advancing --sc-p and changes no layout", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForLiveMount(page);

    const geometry = await page.evaluate(() => {
      const act = document.querySelector<HTMLElement>("[data-sc-act]")!;
      return {
        // A pinned act (scrub / pin / pan) would carry an inline `height` in vh
        // and a sticky stage. A flow act must do neither.
        inlineHeight: act.style.height,
        position: getComputedStyle(act).position,
      };
    });
    expect(geometry.inlineHeight).toBe("");
    expect(geometry.position).toBe("static");

    const samples: number[] = [];
    for (const fraction of [0, 0.25, 0.5, 0.75, 1]) {
      await page.evaluate((f) => {
        const max = document.documentElement.scrollHeight - innerHeight;
        window.scrollTo(0, Math.round(max * f));
        window.ScrollCraft?.instances[0].read();
      }, fraction);
      samples.push(
        await page.evaluate(() =>
          Number(
            document
              .querySelector<HTMLElement>("[data-sc-act]")!
              .style.getPropertyValue("--sc-p"),
          ),
        ),
      );
    }

    for (let i = 1; i < samples.length; i += 1) {
      expect(samples[i]).toBeGreaterThan(samples[i - 1]);
    }
    expect(samples.at(-1)).toBe(1);
  });

  test("does not leak the device or its styling to other routes", async ({
    page,
  }) => {
    for (const route of ["/projects", "/articles", "/about", "/ecosystem"]) {
      await page.goto(route);
      const leaked = await page.evaluate(() => ({
        scope: document.querySelectorAll("[data-scrollcraft-scope]").length,
        attrs: document.querySelectorAll(
          "[data-sc-act], [data-sc-in], [data-sc-stagger]",
        ).length,
        engine: typeof window.ScrollCraft,
        script: document.querySelectorAll('script[src*="scrollcraft"]').length,
      }));
      expect(leaked, route).toEqual({
        scope: 0,
        attrs: 0,
        engine: "undefined",
        script: 0,
      });
    }
  });
});

test.describe("the method reveal", () => {
  test.use({ viewport: SHORT_VIEWPORT });

  test("starts hidden below the fold, then reveals in a stagger and holds", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForLiveMount(page);

    expect(
      await page.evaluate(
        () =>
          document.querySelector(".home2-matrix")!.getBoundingClientRect().top,
      ),
      "the matrix must start below the fold or there is no reveal to observe",
    ).toBeGreaterThan(SHORT_VIEWPORT.height);

    // Exactly 0, not merely low: the armed state carries no transition, so
    // mounting the engine must never animate settled content away. A value
    // between 0 and 1 here means the transition moved back onto the hidden rule.
    expect(
      await opacities(page, WIDE_ROWS),
      "every row armed at exactly 0 before entry, with no fade-out",
    ).toEqual([0, 0, 0, 0, 0, 0]);

    // Intermediate state, not just the end state: the engine writes the stagger
    // as an inline transition-delay, so partway through the cascade the earlier
    // rows are further along than the later ones.
    await page.evaluate(() =>
      document
        .querySelector(".home2-matrix")!
        .scrollIntoView({ block: "center", behavior: "instant" }),
    );
    await page.waitForFunction(() =>
      document.querySelector(".home2-matrix")!.classList.contains("sc-in"),
    );

    expect(
      await page.$$eval(WIDE_ROWS, (els) =>
        els.map((el) => (el as HTMLElement).style.transitionDelay),
      ),
    ).toEqual(["0ms", "90ms", "180ms", "270ms", "360ms", "450ms"]);

    await page.waitForTimeout(220);
    const mid = await opacities(page, WIDE_ROWS);
    expect(mid[0], "the first row leads the cascade").toBeGreaterThan(0);
    expect(mid.at(-1)!, "the last row still trails it").toBeLessThan(mid[0]);

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
    await waitForLiveMount(page);

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
    await waitForLiveMount(page);

    await page.evaluate(() =>
      document
        .querySelector(".home2-matrix")!
        .scrollIntoView({ block: "center", behavior: "instant" }),
    );
    // base.css collapses every duration to 0.01ms under reduced motion, which
    // is stricter than the engine's own 220ms. The rows must arrive settled and
    // never be offset, not merely arrive eventually.
    await expect
      .poll(() => opacities(page, WIDE_ROWS), { timeout: 1500 })
      .toEqual([1, 1, 1, 1, 1, 1]);
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

    // No engine, so nothing is armed: the pre-engine state is the settled
    // state. This is the one thing the upstream stylesheet does not give you,
    // and the reason its `[data-sc-in] { opacity: 0 }` is not adopted verbatim.
    await expect(page.locator("html")).not.toHaveClass(/sc-ready/);
    await expect(
      page.locator('[data-scrollcraft-scope][data-scrollcraft-mounted="true"]'),
    ).toHaveCount(0);
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
    await waitForLiveMount(page);
    expect(await opacities(page, WIDE_ROWS)).toEqual([0, 0, 0, 0, 0, 0]);

    // Tab out of the site chrome and into the method section. Nothing upstream
    // stops focus reaching an armed `data-sc-in` element: the engine's focusin
    // rescue only covers `[data-sc-cue]`. Without the `:focus-within` rule in
    // scrollcraft.css the focus ring lands on a row still at opacity 0.
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

test.describe("engine lifecycle across client-side navigation", () => {
  test("never accumulates instances, acts, loops or listeners", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForLiveMount(page);
    expect(await engineState(page)).toEqual({
      instances: 1,
      detachedActs: 0,
    });

    // Client-side navigation, not page.goto: App Router destroys the home tree
    // and rebuilds its DOM on return, so an element-held mount guard is gone by
    // the time next/script fires onReady again. Before the module-scoped guard
    // this produced 1 → 2 → 3 → 4 instances over these three round trips. Every
    // rAF loop and window listener the engine registers is registered inside
    // mount(), exactly once per call, so a constant instance count is the
    // proxy for a constant listener and loop count. Three cycles, because one
    // cannot tell a fixed guard from one that merely fails on the second pass.
    //
    // detachedActs settles at exactly 1 and stays there: the single legitimate
    // instance is left pointing at the act element React removed on the first
    // navigation away. The engine exposes no unmount, so that cannot be
    // released without editing it, which scroll-craft forbids. Bounded and
    // constant is the fix; growing was the bug. Asserted as exact equality
    // rather than an upper bound so any regrowth fails here.
    for (let cycle = 1; cycle <= 3; cycle += 1) {
      await roundTripThroughAbout(page);
      expect(
        await engineState(page),
        `after ${cycle} client-side round trip(s)`,
      ).toEqual({ instances: 1, detachedActs: 1 });
    }
  });

  test("leaves the method section readable after returning home", async ({
    page,
  }) => {
    // The other half of the guard. `html.sc-ready` survives client-side
    // navigation while the section's DOM does not, so gating the armed state on
    // it while refusing to re-mount would render the rebuilt rows invisible for
    // good. Gating on the scope element's own attribute means the rebuilt
    // section simply arrives settled: no animation, no hidden content.
    await page.goto("/");
    await waitForLiveMount(page);
    await roundTripThroughAbout(page);

    await expect(page.locator("html")).toHaveClass(/sc-ready/);
    await expect(
      page.locator('[data-scrollcraft-scope][data-scrollcraft-mounted="true"]'),
    ).toHaveCount(0);
    expect(await opacities(page, WIDE_ROWS)).toEqual([1, 1, 1, 1, 1, 1]);
    await expect(
      page.getByRole("heading", { name: "Two systems, one method" }),
    ).toBeVisible();
  });
});

test.describe("print", () => {
  test.use({ viewport: SHORT_VIEWPORT });

  test("armed rows are fully visible on paper", async ({ page }) => {
    await page.goto("/");
    await waitForLiveMount(page);

    // Unscrolled and armed: exactly the state a print or save-to-PDF starts
    // from, and the one in which the method comparison used to print blank.
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
    await waitForLiveMount(page);

    await page.emulateMedia({ media: "print" });
    expect(await opacities(page, NARROW_ROWS)).toEqual([1, 1, 1, 1]);
  });
});

test("the reveal preserves the method section's reading order", async ({
  page,
}) => {
  await page.goto("/");

  // The engine never generates or reorders DOM. Guard the order the ARIA table
  // depends on: the ordinals of the four method dimensions, in sequence.
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
