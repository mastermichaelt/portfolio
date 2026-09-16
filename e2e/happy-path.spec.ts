import { expect, test, type Page } from "@playwright/test";

async function expectPrimaryNav(page: Page) {
  const nav = page.getByRole("navigation", { name: "Primary" });
  await expect(nav.getByRole("link", { name: "Projects" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Articles" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "About" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Home" })).toHaveCount(0);
  await expect(
    nav.getByRole("link", { name: "Ecosystem", exact: true }),
  ).toHaveCount(0);
  await expect(
    nav.getByRole("link", { name: "System", exact: true }),
  ).toHaveCount(0);
}

test.describe("portfolio happy path", () => {
  test("home is live with first-class systems, ledger, and selected writing", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("link", { name: "Michael Truong" }),
    ).toHaveAttribute("href", "/");
    await expect(
      page.getByRole("heading", {
        name: "Making uncertain systems dependable.",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Michael Truong" }),
    ).toHaveCount(0);
    await expect(page.getByText("under construction")).toHaveCount(0);
    await expectPrimaryNav(page);
    await expect(
      page.getByRole("link", { name: "Explore the systems ecosystem" }),
    ).toHaveCount(0);

    const anchors = page.locator("a.anchor");
    await expect(anchors).toHaveCount(2);
    await expect(
      page.locator('a.anchor[href="/projects/codenames-ai"]'),
    ).toBeVisible();
    await expect(
      page.locator('a.anchor[href="#experiment-measurement"]'),
    ).toBeVisible();
    await expect(
      page.locator('a.anchor[href="/projects/editorial-workflow"]'),
    ).toHaveCount(0);

    await expect(page.locator("article.case-panel")).toHaveCount(2);
    await expect(page.locator("#experiment-measurement")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /valid JSON is not a legal move/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /attribution is checkable/i,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Career ledger" }),
    ).toBeVisible();
    await expect(page.locator(".ledger-row")).toHaveCount(7);

    const featuredWriting = page.locator("a.list-row[href*='dev.to']");
    await expect(featuredWriting).toHaveCount(3);
    await expect(featuredWriting.first()).toHaveAttribute(
      "href",
      /dev\.to\/michaeltruong/,
    );
    await expect(
      page.getByRole("link", {
        name: /Active players looked real until we asked which sessions counted/i,
      }),
    ).toBeVisible();

    await expect(
      page.locator('a.list-row[href="/projects/editorial-workflow"]'),
    ).toBeVisible();
    await expect(
      page.locator('a.list-row[href="/projects/resume-generator"]'),
    ).toHaveCount(0);

    await expect(
      page.getByRole("link", { name: /ecosystem walkthrough/i }),
    ).toHaveAttribute("href", "/ecosystem");
  });

  test("home 1b layout stacks at 375px with qualified figures", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByText("175+", { exact: true })).toBeVisible();
    await expect(page.getByText(/durable floor/i)).toBeVisible();
    await expect(page.getByText("game_started")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Career ledger" }),
    ).toBeVisible();
    await expect(
      page.getByText("open to senior engineering roles"),
    ).toHaveCount(0);

    const desktopAnchors = page.locator("a.anchor");
    for (const box of await desktopAnchors.evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().height),
    )) {
      expect(box).toBeGreaterThanOrEqual(44);
    }

    const desktopPanels = page.locator("article.case-panel");
    const desktopTops = await desktopPanels.evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().top),
    );
    expect(desktopTops).toHaveLength(2);
    expect(Math.abs(desktopTops[0]! - desktopTops[1]!)).toBeLessThan(48);

    await page.setViewportSize({ width: 375, height: 812 });

    const mobileAnchors = page.locator("a.anchor");
    const mobileHeights = await mobileAnchors.evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().height),
    );
    for (const height of mobileHeights) {
      expect(height).toBeGreaterThanOrEqual(44);
    }

    const mobileBoxes = await desktopPanels.evaluateAll((nodes) =>
      nodes.map((node) => {
        const box = node.getBoundingClientRect();
        return { top: box.top, bottom: box.bottom };
      }),
    );
    expect(mobileBoxes[1]!.top).toBeGreaterThan(mobileBoxes[0]!.bottom - 1);
  });

  test("projects index tiers co-primary, supporting and infrastructure rows", async ({
    page,
  }) => {
    await page.goto("/projects");

    await expect(
      page.getByRole("heading", {
        name: "Every system, and what it is allowed to claim.",
      }),
    ).toBeVisible();

    // Two co-primary rows, Atlassian first, each with an Open → link.
    await expect(
      page.locator('a.pindex-open[href="/projects/experiment-measurement"]'),
    ).toBeVisible();
    await expect(
      page.locator('a.pindex-open[href="/projects/codenames-ai"]'),
    ).toBeVisible();

    // Two index figures per co-primary — value + name + scope together.
    for (const value of ["175+", "350", ">10%", "9%–41%"]) {
      await expect(
        page.getByText(value, { exact: true }).first(),
      ).toBeVisible();
    }
    await expect(page.getByText(/durable floor/i).first()).toBeVisible();

    // Supporting rows link to a proof surface.
    await expect(
      page.locator(
        'a.pindex-row--support[href="/projects/editorial-workflow"]',
      ),
    ).toBeVisible();
    await expect(
      page.locator(
        'a.pindex-row--support[href="/projects/renovate-governance"]',
      ),
    ).toBeVisible();
    await expect(
      page.locator('a.pindex-row--support[href="/ecosystem"]'),
    ).toBeVisible();

    // Infrastructure row is not a link.
    await expect(page.getByText("Resume generator")).toBeVisible();
    await expect(
      page.locator('a[href="/projects/resume-generator"]'),
    ).toHaveCount(0);

    // Provenance / fact-id review aids must not ship.
    await expect(page.locator("body")).not.toContainText(".yml");
  });

  test("co-primary case study renders blocks, figures, rail and artifacts", async ({
    page,
  }) => {
    await page.goto("/projects/codenames-ai");

    await expect(
      page.getByRole("heading", {
        name: /Valid JSON is not a legal move/i,
        level: 1,
      }),
    ).toBeVisible();

    // Sticky contents rail with per-block items.
    const rail = page.getByRole("navigation", { name: "Contents" });
    await expect(rail).toBeVisible();
    await expect(rail.getByText("Legal-move validation")).toBeVisible();
    await expect(rail.getByText("Domain coverage")).toBeVisible();

    // Figure-absent block keeps its stated note rather than a placeholder.
    await expect(
      page.getByText(/No figure is claimed for this block/i),
    ).toBeVisible();

    // Qualified figure: value + scope shown together as one block.
    const playersFigure = page.locator(".qfigure").filter({ hasText: "175+" });
    await expect(playersFigure.locator(".figure-value")).toHaveText("175+");
    await expect(playersFigure.locator(".figure-scope")).toContainText(
      /durable floor/i,
    );

    // Every block ends on a contract line.
    await expect(page.getByText(/^Contract:/).first()).toBeVisible();

    // Live product opens externally.
    await expect(
      page.locator('a[href="https://codenames-ai.com/"]'),
    ).toHaveAttribute("target", "_blank");

    // Provenance / fact-id review aids must not ship.
    await expect(page.locator("body")).not.toContainText(".yml");
    await expect(page.locator("body")).not.toContainText(
      "branded-search-position",
    );
  });

  test.describe("projects 1C at 375px", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
    });

    test("index stacks with accessible columns, figures and tap targets", async ({
      page,
    }) => {
      await page.goto("/projects");

      await expect(
        page.getByRole("columnheader", { name: "System / era" }),
      ).toBeAttached();
      await expect(
        page.getByRole("columnheader", { name: "Qualified evidence" }),
      ).toBeAttached();

      const overflowX = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      expect(overflowX).toBe(false);

      for (const value of ["175+", "350", ">10%", "9%–41%"]) {
        await expect(
          page.getByText(value, { exact: true }).first(),
        ).toBeVisible();
      }
      await expect(page.getByText(/durable floor/i).first()).toBeVisible();

      const openHeights = await page
        .locator("a.pindex-open")
        .evaluateAll((nodes) =>
          nodes.map((node) => node.getBoundingClientRect().height),
        );
      for (const height of openHeights) {
        expect(height).toBeGreaterThanOrEqual(44);
      }

      await expect(
        page.locator('a.pindex-row--support[href="/ecosystem"]'),
      ).toBeVisible();
    });

    test("codenames-ai rail wraps, scroll-spy and figure states hold", async ({
      page,
    }) => {
      await page.goto("/projects/codenames-ai");

      await expect(page.locator(".pcase-rail")).toHaveCSS("position", "static");

      const railHeights = await page
        .locator(".pcase-rail-item")
        .evaluateAll((nodes) =>
          nodes.map((node) => node.getBoundingClientRect().height),
        );
      for (const height of railHeights) {
        expect(height).toBeGreaterThanOrEqual(44);
      }

      await expect(
        page.getByText(/No figure is claimed for this block/i),
      ).toBeVisible();

      const playersFigure = page
        .locator(".qfigure")
        .filter({ hasText: "175+" });
      await expect(playersFigure.locator(".figure-scope")).toContainText(
        /durable floor/i,
      );
      const scopeWidth = await playersFigure
        .locator(".figure-scope")
        .evaluate((node) => node.getBoundingClientRect().width);
      expect(scopeWidth).toBeGreaterThan(300);

      await page.locator("#b03").scrollIntoViewIfNeeded();
      await expect(page.locator(".pcase-rail-item.is-active")).toContainText(
        "Telemetry quality",
      );

      await page.locator('a.pcase-rail-item[href="#artifacts"]').click();
      await expect(page).toHaveURL(/#artifacts$/);
      const artifactsTop = await page
        .locator("#artifacts")
        .evaluate((node) => node.getBoundingClientRect().top);
      expect(artifactsTop).toBeGreaterThanOrEqual(90);
      expect(artifactsTop).toBeLessThanOrEqual(102);
      await expect(page.locator(".pcase-rail-item.is-active")).toContainText(
        "Artifacts",
      );
    });

    test("experiment-measurement keeps qualified figures readable", async ({
      page,
    }) => {
      await page.goto("/projects/experiment-measurement");

      await expect(
        page.getByRole("navigation", { name: "Contents" }),
      ).toBeVisible();

      const windowFigure = page
        .locator(".qfigure")
        .filter({ hasText: "9%–41%" });
      await expect(windowFigure.locator(".figure-scope")).toContainText(
        /Statsig/i,
      );

      const overflowX = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      expect(overflowX).toBe(false);
    });
  });

  test("experiment-measurement case study is the Atlassian route", async ({
    page,
  }) => {
    await page.goto("/projects/experiment-measurement");

    await expect(
      page.getByRole("heading", {
        name: /attribution is checkable/i,
        level: 1,
      }),
    ).toBeVisible();

    // Role spine carries the EM period; it is not a figure or headline.
    await expect(page.getByText("Role spine")).toBeVisible();
    await expect(page.getByText(/Engineering Manager, Growth/)).toBeVisible();

    // Both stated absences are present; no fabricated field report.
    await expect(page.getByText("No public case-study artifact")).toBeVisible();
    await expect(
      page.getByText("No field report is tagged to this work"),
    ).toBeVisible();
    await expect(page.getByText("Private", { exact: true })).toBeVisible();
    await expect(page.getByText("Adjacent", { exact: true })).toBeVisible();
  });

  test("unknown project slug returns not found", async ({ page }) => {
    const response = await page.goto("/projects/does-not-exist");
    expect(response?.status()).toBe(404);
  });

  test("articles index leads five reasoning lines out to DEV.to", async ({
    page,
  }) => {
    await page.goto("/articles");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "The writing returns to five problems.",
      }),
    ).toBeVisible();

    // Five line-index cells and five bands, one claim and one head per band.
    await expect(page.locator("nav.aline-index a.aline-cell")).toHaveCount(5);
    await expect(page.locator("section.aline-band")).toHaveCount(5);
    await expect(page.locator(".aline-band .aline-head h2")).toHaveCount(5);
    await expect(page.locator(".aline-band .aline-claim")).toHaveCount(5);

    // Line 05 shows no implementation and never substitutes /ecosystem.
    const line05 = page.locator("#line-05");
    await expect(line05.getByText("no implementation attached")).toBeVisible();
    await expect(line05.locator('a[href="/ecosystem"]')).toHaveCount(0);

    // Every outbound report / archive row opens on DEV in a new tab.
    const devLinks = page.locator("a.aline-report, a.aline-row");
    await expect(devLinks.first()).toHaveAttribute(
      "href",
      /dev\.to\/michaeltruong/,
    );
    const targets = await devLinks.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("target")),
    );
    expect(targets.length).toBeGreaterThanOrEqual(8);
    for (const target of targets) {
      expect(target).toBe("_blank");
    }

    // Lead implementation cross-links are internal (next/link), not DEV exits.
    await expect(
      page.locator('#line-01 a.aline-impl[href="/projects/codenames-ai"]'),
    ).toBeVisible();
  });

  test("articles 2a collapses to the 390px single-column line index", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/articles");

    // No horizontal overflow at the narrow width.
    const overflowX = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflowX).toBe(false);

    // Line index collapses to a single column (one grid track).
    const cells = page.locator("nav.aline-index a.aline-cell");
    await expect(cells).toHaveCount(5);
    const trackCount = await page
      .locator("nav.aline-index")
      .evaluate(
        (node) =>
          getComputedStyle(node).gridTemplateColumns.trim().split(/\s+/).length,
      );
    expect(trackCount).toBe(1);
    const cellLefts = await cells.evaluateAll((nodes) =>
      nodes.map((node) => Math.round(node.getBoundingClientRect().left)),
    );
    expect(new Set(cellLefts).size).toBe(1);

    // Each index target meets the 46px mobile row height (tap target).
    const cellHeights = await cells.evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().height),
    );
    expect(cellHeights).toHaveLength(5);
    for (const height of cellHeights) {
      expect(height).toBeGreaterThanOrEqual(46);
    }

    // Band head stacks id / label / pairing (each fully below the previous).
    const headGeom = await page
      .locator("#line-01 .aline-head")
      .evaluate((head) => {
        const rect = (selector: string) =>
          head.querySelector(selector)!.getBoundingClientRect();
        return {
          id: rect(".aline-line-id"),
          label: rect("h2"),
          pairing: rect(".aline-pairing"),
        };
      });
    expect(headGeom.label.top).toBeGreaterThanOrEqual(headGeom.id.bottom - 1);
    expect(headGeom.pairing.top).toBeGreaterThanOrEqual(
      headGeom.label.bottom - 1,
    );

    // Line 05 still states its no-implementation absence, never linking /ecosystem.
    const line05 = page.locator("#line-05");
    await expect(line05.getByText("no implementation attached")).toBeVisible();
    await expect(line05.locator('a[href="/ecosystem"]')).toHaveCount(0);
  });

  test("articles 2a hardening: tap targets, index filler, and anchor clearance", async ({
    page,
  }) => {
    // 1) Implementation cross-links reach the 44px tap target on the stacked
    //    (<=920) layout, and the no-implementation state stays non-interactive.
    await page.setViewportSize({ width: 744, height: 1000 });
    await page.goto("/articles");

    const impls = page.locator(".aline-band a.aline-impl");
    expect(await impls.count()).toBeGreaterThan(0);
    const implHeights = await impls.evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().height),
    );
    for (const height of implHeights) {
      expect(height).toBeGreaterThanOrEqual(44);
    }
    // "no implementation attached" is text, never a link.
    await expect(page.locator("#line-05 .aline-impl-none")).toHaveText(
      "no implementation attached",
    );
    await expect(page.locator("#line-05 a.aline-impl")).toHaveCount(0);

    // Archive-row accessible names carry the paired system when one exists, and
    // stay natural (title only, no dangling separator) when none does.
    await expect(
      page.locator("#line-01 a.aline-row").first(),
    ).toHaveAccessibleName(/ — Codenames AI \(opens in new tab\)$/);
    await expect(
      page.locator("#line-05 a.aline-row").first(),
    ).toHaveAccessibleName(
      /^I expected pair programming .*\(opens in new tab\)$/,
    );
    await expect(
      page.locator("#line-05 a.aline-row").first(),
    ).not.toHaveAccessibleName(/—/);

    // 2) In the 3-column index the leftover grid track must not expose a filled,
    //    lighter sixth cell: the filler recedes it to the page ground (--bg),
    //    which equals the body background. Checked by resolved color, not pixels.
    await page.setViewportSize({ width: 900, height: 900 });
    const fillerAt900 = await page
      .locator("nav.aline-index")
      .evaluate((node) => {
        const after = getComputedStyle(node, "::after");
        return {
          content: after.content,
          background: after.backgroundColor,
          bodyBackground: getComputedStyle(document.body).backgroundColor,
          columns: getComputedStyle(node)
            .gridTemplateColumns.trim()
            .split(/\s+/).length,
          cells: node.querySelectorAll("a.aline-cell").length,
        };
      });
    expect(fillerAt900.columns).toBe(3);
    // Invariant made explicit: a single filler completes the 3-column grid only
    // while exactly one track is orphaned (cells % 3 === 2). This is the real
    // precondition the filler relies on — not "exactly five lines" — so a
    // corpus-size change that breaks it fails here rather than silently.
    expect(fillerAt900.cells % 3).toBe(2);
    // The filler box is generated and recedes to the page ground, not --border.
    expect(fillerAt900.content).not.toBe("none");
    expect(fillerAt900.background).toBe(fillerAt900.bodyBackground);

    // The filler is generated only in the 3-column range — no box (content:
    // none) at 5 columns, where the cells fill their rows exactly…
    await page.setViewportSize({ width: 1280, height: 900 });
    const contentWide = await page
      .locator("nav.aline-index")
      .evaluate((node) => getComputedStyle(node, "::after").content);
    expect(contentWide).toBe("none");
    // …nor in the single-column layout, where a box would add an empty sixth row.
    await page.setViewportSize({ width: 390, height: 844 });
    const contentNarrow = await page
      .locator("nav.aline-index")
      .evaluate((node) => getComputedStyle(node, "::after").content);
    expect(contentNarrow).toBe("none");

    // 3) Behavioral contract for the <=920 anchor offset: after the fragment
    //    scroll settles, the target band clears the sticky nav by at least the
    //    required breathing room and lands snug beneath it (not still below the
    //    fold). Asserted against the nav's measured position, never the CSS
    //    literal — an offset change fails as a readable assertion, not a timeout.
    const MIN_CLEARANCE = 8; // px of deliberate breathing room below the nav
    const MAX_CLEARANCE = 48; // snug: proves the anchor scrolled to just under it
    await page.setViewportSize({ width: 744, height: 1000 });
    await page.goto("/articles#line-03");
    // Gate only on "the fragment scroll happened" (page moved), independent of
    // the offset value, so a regressed offset still reaches the assertions.
    await page.waitForFunction(() => window.scrollY > 0);
    const clearance = await page.evaluate(() => {
      const nav = document.querySelector(".topnav")!.getBoundingClientRect();
      const band = document.querySelector("#line-03")!.getBoundingClientRect();
      return band.top - nav.bottom;
    });
    expect(clearance).toBeGreaterThanOrEqual(MIN_CLEARANCE);
    expect(clearance).toBeLessThanOrEqual(MAX_CLEARANCE);
  });

  test("about carries the identity rail, arc and evidence boundary", async ({
    page,
  }) => {
    await page.goto("/about");

    // Identity + contact live in the sticky rail (the CTA repeats the email, so
    // these assertions are scoped to the rail to stay unambiguous).
    const rail = page.locator(".about-rail");
    await expect(
      rail.getByRole("heading", { level: 1, name: "Michael Truong" }),
    ).toBeVisible();
    await expect(
      rail.getByRole("link", { name: "michael@multipliers.dev" }),
    ).toHaveAttribute("href", "mailto:michael@multipliers.dev");
    await expect(rail.getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
      "href",
      /linkedin\.com/,
    );
    await expect(rail.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      /github\.com/,
    );
    await expect(rail.getByRole("link", { name: "DEV blog" })).toHaveAttribute(
      "href",
      /dev\.to\/michaeltruong/,
    );

    // Every era but the 2014 origin ends on a carry-forward clause.
    await expect(page.locator(".about-carry")).toHaveCount(4);

    // Exactly four qualified figures, each keeping a non-empty scope line.
    const figures = page.locator(".qfigure");
    await expect(figures).toHaveCount(4);
    const scopes = page.locator(".qfigure .figure-scope");
    await expect(scopes).toHaveCount(4);
    for (const text of await scopes.allInnerTexts()) {
      expect(text.trim().length).toBeGreaterThan(0);
    }

    // The §04 then/now mapping and §05 surface boundary have fixed shapes.
    await expect(page.locator(".about-map .about-map-row")).toHaveCount(3);
    await expect(
      page.locator(".about-surfaces .about-surface-row"),
    ).toHaveCount(5);

    // Orientation links to the other evidence surfaces are present.
    await expect(
      page.locator('.about-doc a[href="/projects"]').first(),
    ).toBeVisible();
    await expect(
      page.locator('.about-doc a[href="/articles"]').first(),
    ).toBeVisible();
  });

  test("about stacks at 375px with a static rail and untruncated scope", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/about");

    const overflowX = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflowX).toBe(false);

    // The rail unsticks and becomes a header block.
    await expect(page.locator(".about-rail")).toHaveCSS("position", "static");

    // Every rail link and the mailto CTA meets the 44px hit-target floor.
    const railLinkHeights = await page
      .locator(".about-rail a")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getBoundingClientRect().height),
      );
    expect(railLinkHeights.length).toBeGreaterThan(0);
    for (const height of railLinkHeights) {
      expect(height).toBeGreaterThanOrEqual(44);
    }
    const ctaHeight = await page
      .locator(".about-close-cta")
      .evaluate((node) => node.getBoundingClientRect().height);
    expect(ctaHeight).toBeGreaterThanOrEqual(44);

    // §04 gutter links are standalone targets and meet the same 44px floor.
    const gutterLinkHeights = await page
      .locator(".about-links a")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getBoundingClientRect().height),
      );
    expect(gutterLinkHeights.length).toBeGreaterThan(0);
    for (const height of gutterLinkHeights) {
      expect(height).toBeGreaterThanOrEqual(44);
    }

    // A figure scope never truncates — it renders wider than the 300px gutter.
    const scopeWidth = await page
      .locator(".qfigure .figure-scope")
      .first()
      .evaluate((node) => node.getBoundingClientRect().width);
    expect(scopeWidth).toBeGreaterThan(300);
  });

  test("about sticky rail stays capped and reachable on a short desktop", async ({
    page,
  }) => {
    // Desktop width (rail is sticky), height too short for the full rail — the
    // rail must cap to the viewport and scroll internally, not clip content.
    await page.setViewportSize({ width: 1200, height: 700 });
    await page.goto("/about");
    // Scroll the document so the rail is actually pinned at its sticky offset.
    await page.evaluate(() => window.scrollTo(0, 1200));

    const rail = page.locator(".about-rail");
    await expect(rail).toHaveCSS("position", "sticky");

    const geom = await rail.evaluate((node) => {
      const style = getComputedStyle(node);
      const stickyTop = parseFloat(style.top);
      return {
        clientHeight: node.clientHeight,
        scrollHeight: node.scrollHeight,
        available: window.innerHeight - stickyTop,
        overflowY: style.overflowY,
      };
    });
    // The rail is capped to (roughly) the space below its sticky offset...
    expect(geom.clientHeight).toBeLessThanOrEqual(geom.available);
    // ...and only because its content genuinely exceeds that cap here.
    expect(geom.scrollHeight).toBeGreaterThan(geom.clientHeight);
    expect(geom.overflowY).toBe("auto");

    // Focus areas is the last rail block; after scrolling the rail to the end it
    // must sit fully inside the rail's own viewport (i.e. it is reachable).
    const focusReachable = await rail.evaluate((node) => {
      node.scrollTop = node.scrollHeight;
      const focus = node.querySelector(".about-rail-block--focus");
      if (!focus) return false;
      const r = node.getBoundingClientRect();
      const f = focus.getBoundingClientRect();
      return f.top >= r.top - 1 && f.bottom <= r.bottom + 1;
    });
    expect(focusReachable).toBe(true);

    // No horizontal scrollbar is introduced — on the page or inside the rail.
    const pageOverflowX = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(pageOverflowX).toBe(false);
    const railOverflowX = await rail.evaluate(
      (node) => node.scrollWidth > node.clientWidth + 1,
    );
    expect(railOverflowX).toBe(false);

    // A focused rail link's visible focus treatment (2px outline, 3px offset =
    // 5px reach) is not clipped by the scroll container on EITHER axis. Check
    // the first and last focusable rail links, each pushed toward its edge
    // before focusing so the block-axis (focus-scroll) path is exercised.
    const clearances = await rail.evaluate((node) => {
      const links = Array.from(node.querySelectorAll<HTMLAnchorElement>("a"));
      const first = links[0];
      const last = links[links.length - 1];
      const clearance = (link: HTMLAnchorElement, presetScrollTop: number) => {
        node.scrollTop = presetScrollTop;
        link.focus();
        const r = node.getBoundingClientRect();
        const l = link.getBoundingClientRect();
        return {
          left: l.left - r.left,
          right: r.right - l.right,
          top: l.top - r.top,
          bottom: r.bottom - l.bottom,
        };
      };
      return [
        // First link pushed above the fold → focus scrolls up toward the top.
        clearance(first, node.scrollHeight),
        // Last link pushed below the fold → focus scrolls down toward the bottom.
        clearance(last, 0),
      ];
    });
    expect(clearances.length).toBe(2);
    const outlineReach = 5;
    for (const c of clearances) {
      expect(c.left).toBeGreaterThanOrEqual(outlineReach);
      expect(c.right).toBeGreaterThanOrEqual(outlineReach);
      expect(c.top).toBeGreaterThanOrEqual(outlineReach);
      expect(c.bottom).toBeGreaterThanOrEqual(outlineReach);
    }
  });

  test("ecosystem canvases open detail panel on node select", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => {
      pageErrors.push(String(error));
    });

    await page.goto("/ecosystem");

    await expect(
      page.getByRole("heading", { name: "How the systems connect." }),
    ).toBeVisible();
    await expect(
      page.getByTestId("ecosystem-canvas-system-overview"),
    ).toBeVisible();
    await expect(
      page.getByTestId("ecosystem-canvas-workflow-renovate"),
    ).toHaveCount(0);
    await expect(
      page.getByTestId("ecosystem-canvas-workflow-editorial"),
    ).toHaveCount(0);

    const productCanvas = page.getByTestId(
      "ecosystem-canvas-workflow-product-loop",
    );
    await expect(productCanvas).toBeVisible();
    const edgePaths = productCanvas.locator(".react-flow__edge-path");
    await expect(edgePaths).toHaveCount(5);
    await expect
      .poll(async () => {
        const boxes = await edgePaths.evaluateAll((paths) =>
          paths.map((path) => {
            const box = path.getBoundingClientRect();
            return box.width + box.height;
          }),
        );
        return boxes.filter((size) => size > 0).length;
      })
      .toBeGreaterThan(0);

    const panel = page.getByTestId("ecosystem-detail-panel");
    await expect(
      panel.getByRole("heading", { name: "Select a node" }),
    ).toBeVisible();

    const productNode = productCanvas
      .locator(".react-flow__node")
      .filter({ hasText: "Codenames AI" });
    await productNode.click();

    await expect(
      panel.getByRole("heading", { name: "Codenames AI" }),
    ).toBeVisible();
    await expect(panel.getByText(/Product improvement loop/i)).toBeVisible();
    await expect(
      panel.getByRole("link", { name: "Open project case study" }),
    ).toHaveAttribute("href", "/projects/codenames-ai");

    // Evidence outbound links use ExternalLink (new tab + analytics hookup).
    const overviewCanvas = page.getByTestId("ecosystem-canvas-system-overview");
    await overviewCanvas.scrollIntoViewIfNeeded();
    await overviewCanvas
      .locator(".react-flow__node")
      .filter({ hasText: "Evidence & outputs" })
      .first()
      .click();
    const evidenceLink = panel.getByRole("link", {
      name: /DEV\.to/i,
    });
    await expect(evidenceLink).toBeVisible();
    await expect(evidenceLink).toHaveAttribute("target", "_blank");
    await expect(evidenceLink).toHaveAttribute("rel", /noopener/);

    expect(pageErrors, pageErrors.join("\n")).toEqual([]);
  });

  test("ecosystem entity inventory filters by kind", async ({ page }) => {
    await page.goto("/ecosystem");

    const inventory = page.getByTestId("ecosystem-inventory-panel");
    await inventory.scrollIntoViewIfNeeded();

    const tabs = page.getByRole("tablist", { name: "Entity kinds" });
    await expect(tabs.getByRole("tab", { name: /Projects/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(inventory.getByText("Codenames AI")).toBeVisible();
    await expect(inventory.getByText("Renovate classifier")).toHaveCount(0);

    await tabs.getByRole("tab", { name: /Agents/i }).click();
    await expect(tabs.getByRole("tab", { name: /Agents/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(inventory.getByText("Renovate classifier")).toBeVisible();
    await expect(inventory.getByText("Codenames AI")).toHaveCount(0);
  });

  test("ecosystem selection survives switching between canvases", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => {
      pageErrors.push(String(error));
    });

    await page.goto("/ecosystem");

    async function selectNode(canvasTestId: string, label: string) {
      const canvas = page.getByTestId(canvasTestId);
      await canvas.scrollIntoViewIfNeeded();
      await canvas
        .locator(".react-flow__node")
        .filter({ hasText: label })
        .first()
        .click();
    }

    await selectNode("ecosystem-canvas-system-overview", "Projects");
    await expect(
      page.getByTestId("ecosystem-detail-panel").getByRole("heading", {
        name: "Projects",
      }),
    ).toBeVisible();

    await selectNode("ecosystem-canvas-workflow-product-loop", "PostHog");
    await expect(
      page.getByTestId("ecosystem-detail-panel").getByRole("heading", {
        name: "PostHog",
      }),
    ).toBeVisible();

    await selectNode("ecosystem-canvas-workflow-product-loop", "Codenames AI");
    await expect(
      page.getByTestId("ecosystem-detail-panel").getByRole("heading", {
        name: "Codenames AI",
      }),
    ).toBeVisible();
    await expect(
      page.getByTestId("ecosystem-detail-panel").getByRole("link", {
        name: "Open project case study",
      }),
    ).toHaveAttribute("href", "/projects/codenames-ai");

    expect(pageErrors).toEqual([]);
  });

  test("ecosystem hash deep link scrolls to a workflow section", async ({
    page,
  }) => {
    await page.goto("/ecosystem#workflow-product-loop");

    const section = page.locator("#workflow-product-loop");
    await expect(
      section.getByRole("heading", { name: "Product improvement loop" }),
    ).toBeVisible();
    await expect(section).toBeInViewport();
    await expect(
      page.getByTestId("ecosystem-talk-track-workflow-product-loop"),
    ).toBeVisible();
    await expect(section).toBeFocused();

    await page.evaluate(() => {
      window.location.hash = "system-overview";
    });
    const overview = page.locator("#system-overview");
    await expect(
      overview.getByRole("heading", { name: "System overview" }),
    ).toBeVisible();
    await expect(overview).toBeInViewport();
    await expect(overview).toBeFocused();
  });

  test("ecosystem Escape clears the detail selection", async ({ page }) => {
    await page.goto("/ecosystem");

    const canvas = page.getByTestId("ecosystem-canvas-workflow-product-loop");
    await canvas.scrollIntoViewIfNeeded();
    await canvas
      .locator(".react-flow__node")
      .filter({ hasText: "Codenames AI" })
      .first()
      .click();

    const panel = page.getByTestId("ecosystem-detail-panel");
    await expect(
      panel.getByRole("heading", { name: "Codenames AI" }),
    ).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(
      panel.getByRole("heading", { name: "Select a node" }),
    ).toBeVisible();
  });

  test("mobile ecosystem detail appears beside the selected canvas", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/ecosystem");

    const productCanvas = page.getByTestId(
      "ecosystem-canvas-workflow-product-loop",
    );
    await productCanvas.scrollIntoViewIfNeeded();

    const productNode = productCanvas
      .locator(".react-flow__node")
      .filter({ hasText: "Codenames AI" });
    await productNode.click();

    const inlinePanel = page.getByTestId("ecosystem-detail-inline");
    const heading = inlinePanel.getByRole("heading", { name: "Codenames AI" });
    await expect(heading).toBeVisible();
    await expect(heading).toBeInViewport();

    const productSection = page.locator("#workflow-product-loop");
    await expect(
      productSection.getByTestId("ecosystem-detail-inline"),
    ).toBeVisible();
    await expect(
      page.locator("#system-overview").getByTestId("ecosystem-detail-inline"),
    ).toHaveCount(0);
  });

  test("project pages render migrated workflow diagrams on desktop", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => {
      pageErrors.push(String(error));
    });

    await page.goto("/projects/editorial-workflow");
    await expect(page.locator("#operational-workflow")).toBeVisible();
    await expect(
      page
        .locator("#operational-workflow")
        .getByRole("heading", { name: "Editorial field-report pipeline" }),
    ).toBeVisible();
    await expect(
      page.getByTestId("ecosystem-talk-track-workflow-editorial"),
    ).toBeVisible();
    const editorialCanvas = page.getByTestId(
      "ecosystem-canvas-workflow-editorial",
    );
    await editorialCanvas
      .locator(".react-flow__node")
      .filter({ hasText: "Capture" })
      .click();
    const editorialPanel = page.getByTestId("ecosystem-detail-panel");
    await expect(
      editorialPanel.getByRole("heading", { name: "Capture" }),
    ).toBeVisible();
    await expect(
      editorialPanel.getByRole("link", { name: "Open project case study" }),
    ).toHaveCount(0);

    await page.goto("/projects/renovate-governance");
    await expect(page.locator("#operational-workflow")).toBeVisible();
    await expect(
      page
        .locator("#operational-workflow")
        .getByRole("heading", { name: "Renovate governance ladder" }),
    ).toBeVisible();
    const renovateCanvas = page.getByTestId(
      "ecosystem-canvas-workflow-renovate",
    );
    await renovateCanvas
      .locator(".react-flow__node")
      .filter({ hasText: "Classify" })
      .click();
    const renovatePanel = page.getByTestId("ecosystem-detail-panel");
    await expect(
      renovatePanel.getByRole("heading", { name: "Classify" }),
    ).toBeVisible();
    await expect(
      renovatePanel.getByRole("link", { name: "Open project case study" }),
    ).toHaveCount(0);

    const toc = page.getByRole("navigation", { name: "On this page" });
    await expect(
      toc.getByRole("link", { name: "Operational workflow" }),
    ).toBeVisible();

    expect(pageErrors, pageErrors.join("\n")).toEqual([]);
  });

  test("project workflow diagrams stack inline detail at 375px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/projects/editorial-workflow#operational-workflow");

    const canvas = page.getByTestId("ecosystem-canvas-workflow-editorial");
    await canvas.scrollIntoViewIfNeeded();
    await canvas.getByTestId("rf__node-node-capture").click({ force: true });

    const inlinePanel = page.getByTestId("ecosystem-detail-inline");
    await expect(
      inlinePanel.getByRole("heading", { name: "Capture" }),
    ).toBeVisible();
    await expect(page.locator(".ecosystem-panel-side")).toHaveCount(0);

    const overflowX = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflowX).toBe(false);
  });

  test("mobile nav opens About and navigates", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    const toggle = page.getByRole("button", { name: "Open menu" });
    await expect(toggle).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Primary" }),
    ).toBeHidden();

    await toggle.click();
    const mobile = page.locator("#mobile-nav");
    await expect(mobile).toBeVisible();
    await expect(mobile.getByRole("link", { name: "Home" })).toHaveCount(0);
    await expect(mobile.getByRole("link", { name: "Projects" })).toBeVisible();
    await expect(mobile.getByRole("link", { name: "Articles" })).toBeVisible();
    await expect(mobile.getByRole("link", { name: "About" })).toBeVisible();
    await expect(mobile.getByRole("link", { name: "Ecosystem" })).toHaveCount(
      0,
    );
    await expect(
      mobile.getByRole("link", { name: "michael@multipliers.dev" }),
    ).toHaveAttribute("href", "mailto:michael@multipliers.dev");

    await mobile.getByRole("link", { name: "About" }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(
      page.getByRole("heading", { name: "Michael Truong" }),
    ).toBeVisible();
    await expect(mobile).toBeHidden();
  });

  test("mobile nav closes on browser back", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/projects");
    await page.goto("/");

    await page.getByRole("button", { name: "Open menu" }).click();
    const mobile = page.locator("#mobile-nav");
    await expect(mobile).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(mobile).toBeHidden();
  });
});
