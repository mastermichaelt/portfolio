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
  test("home renders the wide method matrix, continuity and routes", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("link", { name: "Michael Truong" }),
    ).toHaveAttribute("href", "/");
    await expect(
      page.getByRole("heading", {
        name: "I follow the product requirement as deep as it needs to go.",
      }),
    ).toBeVisible();
    // The hero lead renders on its own when content omits the optional
    // `leadEmphasis`: no empty <strong> is emitted (guards the render branch).
    const heroLead = page.locator(".home2-hero-lead");
    await expect(heroLead).toBeVisible();
    await expect(heroLead).toContainText("Senior product engineer.");
    await expect(heroLead.locator("strong")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Michael Truong" }),
    ).toHaveCount(0);
    await expect(page.getByText("under construction")).toHaveCount(0);
    await expectPrimaryNav(page);

    // The retired homepage furniture is gone.
    await expect(page.locator("a.anchor")).toHaveCount(0);
    await expect(page.locator(".ledger-row")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Career ledger" }),
    ).toHaveCount(0);

    // The wide projection (matrix) is shown at desktop; the narrow one is hidden.
    const wide = page.locator(".home2-only-wide");
    await expect(wide).toBeVisible();
    await expect(page.locator(".home2-only-narrow")).toBeHidden();
    await expect(page.getByText("Two systems, one method")).toBeVisible();

    await expect(
      wide.getByRole("heading", { name: "Codenames AI" }),
    ).toBeVisible();
    await expect(
      wide.getByRole("heading", { name: "Experiment measurement" }),
    ).toBeVisible();
    // The contract is the heaviest line in each channel column.
    await expect(
      wide.getByText(/valid JSON is not a legal move/i),
    ).toBeVisible();
    await expect(
      wide.getByText(/Preserved statistical validity/i),
    ).toBeVisible();

    // One qualified figure per channel; 9%–41% keeps its finding scope.
    await expect(wide.getByText("175+", { exact: true })).toBeVisible();
    await expect(wide.getByText("9%–41%", { exact: true })).toBeVisible();
    await expect(wide.getByText(/live product telemetry/i)).toBeVisible();
    await expect(wide.getByText(/the range is the finding/i)).toBeVisible();

    // Named per-channel routes to the case studies (CH 02 → its own case study).
    await expect(
      wide.locator('a[href="/projects/codenames-ai"]'),
    ).toBeVisible();
    await expect(
      wide.locator('a[href="/projects/experiment-measurement"]'),
    ).toBeVisible();

    // Continuity: 8–10 is present, subordinate, routing to About not a ledger.
    await expect(page.getByText("8–10", { exact: true })).toBeVisible();
    await expect(page.getByText("One practice")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Practice record, era by era/i }),
    ).toHaveAttribute("href", "/about");

    // Routes into the four deeper surfaces.
    await expect(page.locator("a.home2-route")).toHaveCount(4);
    for (const href of ["/projects", "/articles", "/about", "/ecosystem"]) {
      await expect(page.locator(`a.home2-route[href="${href}"]`)).toBeVisible();
    }

    // Availability is stated on Home now (it was absent on the previous layout).
    await expect(
      page.getByText(/Open to senior engineering roles/i).first(),
    ).toBeVisible();
  });

  test("home projects into the repeated schema at 390px with qualified figures", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const overflowX = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflowX).toBe(false);

    // At narrow the repeated schema shows; the desktop matrix is hidden.
    const narrow = page.locator(".home2-only-narrow");
    await expect(narrow).toBeVisible();
    await expect(page.locator(".home2-only-wide")).toBeHidden();

    // The set is counted so the first channel is never mistaken for the only one.
    await expect(narrow.locator(".home2-system")).toHaveCount(2);
    await expect(narrow.getByText("System 01 of 02")).toBeVisible();
    await expect(narrow.getByText("System 02 of 02")).toBeVisible();

    // Each channel repeats the schema and carries its own 04 evidence figure.
    await expect(narrow.getByText("175+", { exact: true })).toBeVisible();
    await expect(narrow.getByText(/live product telemetry/i)).toBeVisible();
    await expect(narrow.getByText("9%–41%", { exact: true })).toBeVisible();
    await expect(narrow.getByText(/the range is the finding/i)).toBeVisible();
    await expect(page.getByText("game_started")).toHaveCount(0);

    // A figure scope never truncates — it renders wider than a desktop gutter.
    const scopeWidth = await narrow
      .locator(".qfigure .figure-scope")
      .first()
      .evaluate((node) => node.getBoundingClientRect().width);
    expect(scopeWidth).toBeGreaterThan(300);

    // The narrow hero states availability on its own line.
    await expect(
      page.getByText(/Open to senior engineering roles/i).first(),
    ).toBeVisible();

    // Per-channel case-study routes survive and meet the 44px tap target.
    await expect(
      narrow.locator('a[href="/projects/codenames-ai"]'),
    ).toBeVisible();
    await expect(
      narrow.locator('a[href="/projects/experiment-measurement"]'),
    ).toBeVisible();
    const linkHeights = await narrow
      .locator("a.home2-morelink")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getBoundingClientRect().height),
      );
    expect(linkHeights.length).toBeGreaterThan(0);
    for (const height of linkHeights) {
      expect(height).toBeGreaterThanOrEqual(44);
    }
  });

  test("home introduces no horizontal overflow at 320px", async ({ page }) => {
    // The kicker binds its separators (nbsp) rather than nowrapping whole
    // phrases, so the identity/availability lines must wrap instead of pushing
    // the page wider than a small phone. Guards the regression the whole-phrase
    // nowrap could have introduced; 390px reference coverage stays above.
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/");

    const overflowX = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflowX).toBe(false);

    // The identity kicker itself never overflows its own line box.
    const kickerFits = await page
      .locator(".home2-kicker")
      .evaluate((el) => el.scrollWidth <= Math.ceil(el.clientWidth) + 1);
    expect(kickerFits).toBe(true);
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
    await expect(
      page.getByText(/live product telemetry/i).first(),
    ).toBeVisible();

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

    // Provenance / fact-id review aids must not ship.
    await expect(page.locator("body")).not.toContainText(".yml");
  });

  test("codenames-ai scroll experience states identity, premise, figures and doors", async ({
    page,
  }) => {
    await page.goto("/projects/codenames-ai");

    // Addendum 01: identity is present at rest — the h1 states what it is.
    await expect(
      page.getByRole("heading", {
        name: /A real Codenames game, and the AI is a player/i,
        level: 1,
      }),
    ).toBeVisible();

    // The premise fills the right pane at rest rather than an empty surface.
    await expect(page.getByText("The premise")).toBeVisible();
    await expect(
      page.getByText(/Codenames is a word game of clues/i).first(),
    ).toBeVisible();

    // Qualified figure: value + scope shown together as one block.
    const playersFigure = page.locator(".qfigure").filter({ hasText: "175+" });
    await expect(playersFigure.locator(".figure-value")).toHaveText("175+");
    await expect(playersFigure.locator(".figure-scope")).toContainText(
      /live product telemetry/i,
    );

    // The four field-report doors resolve, including the persistence report.
    await expect(page.getByText("Four field reports")).toBeVisible();
    await expect(page.getByText(/The board came back/i)).toBeVisible();

    // Live product opens externally; the technical door states its absence.
    await expect(
      page.locator('a[href="https://codenames-ai.com/"]').first(),
    ).toHaveAttribute("target", "_blank");
    await expect(
      page.getByText("Private repository · no public URL"),
    ).toBeVisible();

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
      await expect(
        page.getByText(/live product telemetry/i).first(),
      ).toBeVisible();

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

    test("codenames-ai mobile opening card folds in identity and premise", async ({
      page,
    }) => {
      await page.goto("/projects/codenames-ai");

      // No card 00: card 01 is the opening card carrying identity + the premise
      // compressed to one sentence, above a full board.
      await expect(
        page.getByRole("heading", {
          name: /A real Codenames game, and the AI is a player/i,
          level: 1,
        }),
      ).toBeVisible();
      await expect(
        page.getByText(/Solo hands both sides to an AI/i),
      ).toBeVisible();
      await expect(page.locator(".cn-card--opening .cn-board")).toBeVisible();

      // Figure scope stays readable (not truncated) and the doors resolve.
      const playersFigure = page
        .locator(".qfigure")
        .filter({ hasText: "175+" });
      await expect(playersFigure.locator(".figure-scope")).toContainText(
        /live product telemetry/i,
      );
      const scopeWidth = await playersFigure
        .locator(".figure-scope")
        .evaluate((node) => node.getBoundingClientRect().width);
      expect(scopeWidth).toBeGreaterThan(240);
      await expect(page.getByText("Four field reports")).toBeVisible();

      // No horizontal overflow at mobile width.
      const overflowX = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      expect(overflowX).toBe(false);
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
        name: /Nobody could defend the number/i,
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

  test("removed resume-generator slug returns not found", async ({ page }) => {
    const response = await page.goto("/projects/resume-generator");
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

  test("about carries the identity rail, career record and qualified figures", async ({
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

    // Résumé-shaped sections: experience bullets, skills, and no continuity copy.
    await expect(page.locator(".about-role-bullets")).toHaveCount(8);
    await expect(page.locator(".about-ref-row")).toHaveCount(7);
    await expect(page.getByText(/one engineering practice/i)).toHaveCount(0);
    await expect(page.getByText(/carried forward/i)).toHaveCount(0);

    // Qualified figures attach to producing roles/projects with non-empty scopes.
    const figures = page.locator(".qfigure");
    await expect(figures).toHaveCount(8);
    const scopes = page.locator(".qfigure .figure-scope");
    await expect(scopes).toHaveCount(8);
    for (const text of await scopes.allInnerTexts()) {
      expect(text.trim().length).toBeGreaterThan(0);
    }

    // Apr 2015 Atlassian start and current independent project are present.
    await expect(page.getByText(/Apr 2015/i)).toBeVisible();
    await expect(page.getByText(/Codenames AI/i).first()).toBeVisible();

    // §01 points to LinkedIn for earlier roles omitted from the résumé record.
    await expect(
      page.getByRole("link", {
        name: /Full professional experience on LinkedIn/i,
      }),
    ).toHaveAttribute("href", /linkedin\.com\/in\/michael-truong-dev/);

    // Project and article entry links are present on independent blocks.
    await expect(
      page.locator('.about-doc a[href="/projects/codenames-ai"]').first(),
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

    // Entry links are standalone targets and meet the same 44px floor.
    const entryLinkHeights = await page
      .locator(".about-entry-links a")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getBoundingClientRect().height),
      );
    expect(entryLinkHeights.length).toBeGreaterThan(0);
    for (const height of entryLinkHeights) {
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

    // Contact is the last rail block; after scrolling the rail to the end it
    // must sit fully inside the rail's own viewport (i.e. it is reachable).
    const contactReachable = await rail.evaluate((node) => {
      node.scrollTop = node.scrollHeight;
      const contact = node.querySelector(".about-rail-block--contact");
      if (!contact) return false;
      const r = node.getBoundingClientRect();
      const c = contact.getBoundingClientRect();
      return c.top >= r.top - 1 && c.bottom <= r.bottom + 1;
    });
    expect(contactReachable).toBe(true);

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

  test("ecosystem 1b renders the fixed rack and the default Codenames lane", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => {
      pageErrors.push(String(error));
    });

    await page.goto("/ecosystem");

    await expect(
      page.getByRole("heading", {
        name: "Everything here ships down the same five stages.",
        level: 1,
      }),
    ).toBeVisible();

    // The rack is a list of exactly the five stages, in the locked order.
    const rack = page.getByRole("list", { name: "Production stages" });
    await expect(rack.locator(".line-stage-name")).toHaveText([
      "Intent",
      "Agent execution",
      "Verification",
      "Judgment",
      "Evidence",
    ]);

    // Exactly one lane, five cells, defaulting to Codenames AI.
    const lane = page.getByTestId("line-lane");
    await expect(lane).toHaveCount(1);
    await expect(lane).toHaveAttribute("data-system", "codenames");
    await expect(lane.locator(".line-cell")).toHaveCount(5);

    const group = page.getByRole("group", {
      name: "Run a system down the line",
    });
    await expect(group.getByRole("button")).toHaveCount(4);
    await expect(
      group.getByRole("button", { name: "Codenames AI" }),
    ).toHaveAttribute("aria-pressed", "true");
    for (const name of [
      "Renovate governance",
      "Editorial workflow",
      "This portfolio",
    ]) {
      await expect(group.getByRole("button", { name })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    }
    await expect(lane.getByText("Model migration as experiment")).toBeVisible();
    await expect(lane.getByText("Board-aware domain validators")).toBeVisible();

    // The retired explorer / canvas / entity-inventory presentation is gone.
    await expect(page.locator(".react-flow")).toHaveCount(0);
    await expect(page.getByTestId("ecosystem-detail-panel")).toHaveCount(0);
    await expect(page.getByTestId("ecosystem-inventory-panel")).toHaveCount(0);
    await expect(
      page.getByRole("tablist", { name: "Entity kinds" }),
    ).toHaveCount(0);

    // Implementer provenance strings never ship as visitor copy.
    await expect(page.locator("body")).not.toContainText("content/");
    await expect(page.locator("body")).not.toContainText(
      "openai integration entity",
    );

    // The rack and lane share column geometry: a stage column and a lane cell
    // are the same width, so the gate hairlines line up with the cell
    // separators beneath them rather than drifting apart.
    const stageWidth = await page
      .locator(".line-rack .line-stage")
      .first()
      .evaluate((el) => el.getBoundingClientRect().width);
    const cellWidth = await lane
      .locator(".line-cell")
      .first()
      .evaluate((el) => el.getBoundingClientRect().width);
    expect(Math.abs(stageWidth - cellWidth)).toBeLessThan(1);

    expect(pageErrors, pageErrors.join("\n")).toEqual([]);
  });

  test("ecosystem 1b selector swaps only the lane, leaving rack and under-the-line fixed", async ({
    page,
  }) => {
    await page.goto("/ecosystem");

    const rack = page.getByRole("list", { name: "Production stages" });
    const rackNames = await rack.locator(".line-stage-name").allInnerTexts();
    const rackPass = await rack.locator(".line-stage-pass").allInnerTexts();
    const underNames = await page.locator(".under-line-name").allInnerTexts();

    const group = page.getByRole("group", {
      name: "Run a system down the line",
    });
    const lane = page.getByTestId("line-lane");

    const cases: Array<{
      name: string;
      system: string;
      first: string;
      last: string;
    }> = [
      {
        name: "Renovate governance",
        system: "renovate",
        first: "Policy file, with stop causes",
        last: "Two reports, no outcomes claim",
      },
      {
        name: "Editorial workflow",
        system: "editorial",
        first: "One card reaches Drafting",
        last: "15 reports, published by hand",
      },
      {
        name: "This portfolio",
        system: "portfolio",
        first: "Plan with authority and topology",
        last: "This site",
      },
      {
        name: "Codenames AI",
        system: "codenames",
        first: "Model migration as experiment",
        last: "Live product and three reports",
      },
    ];

    for (const { name, system, first, last } of cases) {
      await group.getByRole("button", { name }).click();

      // Exactly one system is pressed, and it is this one.
      await expect(group.locator('button[aria-pressed="true"]')).toHaveCount(1);
      await expect(group.getByRole("button", { name })).toHaveAttribute(
        "aria-pressed",
        "true",
      );

      // The lane re-fills for that system, still five cells.
      await expect(lane).toHaveAttribute("data-system", system);
      await expect(lane.locator(".line-cell")).toHaveCount(5);
      await expect(lane.getByText(first)).toBeVisible();
      await expect(lane.getByText(last)).toBeVisible();

      // The rack and the under-the-line strip do not change with selection.
      await expect(rack.locator(".line-stage-name")).toHaveText(rackNames);
      await expect(rack.locator(".line-stage-pass")).toHaveText(rackPass);
      await expect(page.locator(".under-line-name")).toHaveText(underNames);
    }

    // Savepoints keeps its prototype flag, in the accent, across selections.
    const savepoints = page
      .locator(".under-line-item")
      .filter({ hasText: "Savepoints" });
    await expect(savepoints.locator(".under-line-meta")).toHaveText(
      "prototype · not a shipped surface",
    );
    await expect(
      savepoints.locator(".under-line-meta.is-prototype"),
    ).toHaveCount(1);
  });

  test("ecosystem 1b selector is a single-select group reachable by keyboard", async ({
    page,
  }) => {
    await page.goto("/ecosystem");

    const group = page.getByRole("group", {
      name: "Run a system down the line",
    });
    const codenames = group.getByRole("button", { name: "Codenames AI" });

    // The lane region announces changes politely.
    await expect(page.locator(".line-lane-region")).toHaveAttribute(
      "aria-live",
      "polite",
    );

    // Clicking the already-selected chip does not clear the selection.
    await codenames.click();
    await expect(codenames).toHaveAttribute("aria-pressed", "true");
    await expect(group.locator('button[aria-pressed="true"]')).toHaveCount(1);

    // A keyboard-focused chip shows a visible focus ring (>= 2px outline)...
    await codenames.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(codenames).toBeFocused();
    const ring = await codenames.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        style: style.outlineStyle,
        width: parseFloat(style.outlineWidth),
      };
    });
    expect(ring.style).not.toBe("none");
    expect(ring.width).toBeGreaterThanOrEqual(2);

    // ...and Tab advances through the chips in DOM order.
    await page.keyboard.press("Tab");
    await expect(
      group.getByRole("button", { name: "Renovate governance" }),
    ).toBeFocused();
  });

  test("ecosystem 1b restacks into per-stage rows at 920px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 900, height: 1000 });
    await page.goto("/ecosystem");

    // The horizontal rack is hidden; each cell restates its own stage header.
    await expect(page.locator(".line-rack")).toBeHidden();
    const firstCellStage = page.locator(".line-cell .line-cell-stage").first();
    await expect(firstCellStage).toBeVisible();
    await expect(firstCellStage.locator(".line-stage-name")).toHaveText(
      "Intent",
    );

    // The lane is a single column: all five cells share one left edge.
    const lefts = await page
      .locator(".line-cell")
      .evaluateAll((nodes) =>
        nodes.map((node) => Math.round(node.getBoundingClientRect().left)),
      );
    expect(lefts).toHaveLength(5);
    expect(new Set(lefts).size).toBe(1);

    // The selector chips meet the 44px hit-target floor across the whole
    // <=920px touch layout, not only at <=600px.
    const chipHeights = await page
      .locator(".line-chip")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getBoundingClientRect().height),
      );
    expect(chipHeights).toHaveLength(4);
    for (const height of chipHeights) {
      expect(height).toBeGreaterThanOrEqual(44);
    }

    // Selecting a system still swaps the lane; the stage header is unchanged.
    await page.getByRole("button", { name: "Editorial workflow" }).click();
    await expect(page.getByTestId("line-lane")).toHaveAttribute(
      "data-system",
      "editorial",
    );
    await expect(
      page.locator(".line-cell-stage .line-stage-name").first(),
    ).toHaveText("Intent");
  });

  test("ecosystem 1b at 375px scrolls chips, meets 44px targets, and never overflows", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/ecosystem");

    const overflowX = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflowX).toBe(false);

    // Chips meet the 44px tap-target floor.
    const chipHeights = await page
      .locator(".line-chip")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getBoundingClientRect().height),
      );
    expect(chipHeights).toHaveLength(4);
    for (const height of chipHeights) {
      expect(height).toBeGreaterThanOrEqual(44);
    }

    // The chip row is a horizontal scroll rail, not a wrap.
    const overflowStyle = await page
      .locator(".line-chips")
      .evaluate((node) => getComputedStyle(node).overflowX);
    expect(overflowStyle).toBe("auto");

    // Under the line collapses to a single column.
    const underLefts = await page
      .locator(".under-line-item")
      .evaluateAll((nodes) =>
        nodes.map((node) => Math.round(node.getBoundingClientRect().left)),
      );
    expect(underLefts).toHaveLength(4);
    expect(new Set(underLefts).size).toBe(1);

    // Selection still works and introduces no horizontal overflow.
    await page.getByRole("button", { name: "This portfolio" }).click();
    await expect(page.getByTestId("line-lane")).toHaveAttribute(
      "data-system",
      "portfolio",
    );
    const overflowAfter = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflowAfter).toBe(false);
  });

  test("ecosystem 1b animates the lane only after a selection change", async ({
    page,
  }) => {
    await page.goto("/ecosystem");

    const lane = page.getByTestId("line-lane");
    // The default lane is rendered without the swap-transition class...
    await expect(lane).not.toHaveClass(/\bis-swapping\b/);

    // ...selecting a different system puts the rendered lane into the swap
    // state...
    await page.getByRole("button", { name: "Renovate governance" }).click();
    await expect(lane).toHaveAttribute("data-system", "renovate");
    await expect(lane).toHaveClass(/\bis-swapping\b/);

    // ...and selecting another different system keeps triggering it.
    await page.getByRole("button", { name: "Editorial workflow" }).click();
    await expect(lane).toHaveAttribute("data-system", "editorial");
    await expect(lane).toHaveClass(/\bis-swapping\b/);
  });

  test("ecosystem 1b renders the complete default lane with JavaScript disabled", async ({
    browser,
    baseURL,
  }) => {
    // The default Codenames AI line must be server-rendered — a complete worked
    // example even when hydration never runs. Assert against the SSR HTML in a
    // JS-disabled context, behaviourally (rendered content, not internals).
    const context = await browser.newContext({
      javaScriptEnabled: false,
      baseURL,
    });
    const page = await context.newPage();
    try {
      await page.goto("/ecosystem");

      await expect(
        page.getByRole("heading", {
          name: "Everything here ships down the same five stages.",
          level: 1,
        }),
      ).toBeVisible();

      // The full five-stage rack is present without JS.
      await expect(
        page
          .getByRole("list", { name: "Production stages" })
          .locator(".line-stage-name"),
      ).toHaveText([
        "Intent",
        "Agent execution",
        "Verification",
        "Judgment",
        "Evidence",
      ]);

      // The default lane is Codenames AI, five cells, with its chip pressed.
      const lane = page.getByTestId("line-lane");
      await expect(lane).toHaveAttribute("data-system", "codenames");
      await expect(lane.locator(".line-cell")).toHaveCount(5);
      await expect(
        lane.getByText("Model migration as experiment"),
      ).toBeVisible();
      await expect(
        lane.getByText("Live product and three reports"),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Codenames AI" }),
      ).toHaveAttribute("aria-pressed", "true");

      // The constant Under-the-line strip is server-rendered too.
      await expect(page.getByText("Savepoints")).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test("supporting cases render the static architecture figure on desktop", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => {
      pageErrors.push(String(error));
    });

    await page.goto("/projects/editorial-workflow");

    // Supporting tier reads in --muted; amber CH stays reserved.
    await expect(page.getByText("Supporting", { exact: true })).toBeVisible();

    // The architecture block sits under an "Architecture" rail item.
    const rail = page.getByRole("navigation", { name: "Contents" });
    await expect(rail.getByText("Architecture")).toBeVisible();

    // The migrated figure carries the view title and talk track, and no canvas.
    await expect(
      page.getByText("Editorial field-report pipeline"),
    ).toBeVisible();
    await expect(
      page.getByTestId("architecture-talk-track-workflow-editorial"),
    ).toBeVisible();
    await expect(page.locator(".react-flow")).toHaveCount(0);

    // The interactive figure is a programmatically named group.
    await expect(
      page.getByRole("group", {
        name: "Editorial field-report pipeline — architecture figure",
      }),
    ).toBeVisible();

    // DOM order of the canvas node buttons is the keyboard tab order. It must
    // follow the ordinal reading order (01..09) — not the source-array order,
    // where Editorial's Refresh (04) is authored first. This is what makes a
    // keyboard user enter the figure at Capture, not Refresh.
    const editorialOrdinals = await page
      .locator(".pcase-arch-canvas [data-node] .pcase-arch-node-ord")
      .allInnerTexts();
    expect(editorialOrdinals).toEqual([
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "07",
      "08",
      "09",
    ]);

    // The strip defaults to the census, then resolves a selected node.
    const strip = page.getByTestId("architecture-detail-strip");
    await expect(strip).toContainText(
      "Eight operator skills and one public output",
    );
    await page.locator('.pcase-arch-canvas [data-node="node-capture"]').click();
    await expect(strip).toContainText("Capture");
    await expect(strip).toContainText("skill · node 01");

    // Refresh is authored first in the data but numbers as step 04.
    await page.locator('.pcase-arch-canvas [data-node="node-refresh"]').click();
    await expect(strip).toContainText("skill · node 04");

    // The output node is the only one with an evidence link.
    await page.locator('.pcase-arch-canvas [data-node="node-publish"]').click();
    await expect(
      strip.locator('a[href="https://dev.to/michaeltruong"]'),
    ).toBeVisible();

    await page.goto("/projects/renovate-governance");
    await expect(
      page.getByText("Renovate governance ladder").first(),
    ).toBeVisible();

    // Renovate's canvas node buttons are likewise emitted in ordinal order.
    const renovateOrdinals = await page
      .locator(".pcase-arch-canvas [data-node] .pcase-arch-node-ord")
      .allInnerTexts();
    expect(renovateOrdinals).toEqual(["01", "02", "03", "04", "05"]);

    const renovateStrip = page.getByTestId("architecture-detail-strip");
    await page
      .locator('.pcase-arch-canvas [data-node="node-classify"]')
      .click();
    await expect(renovateStrip).toContainText("Classify");
    // The governance node owns no evidence — no node evidence link appears.
    await page
      .locator('.pcase-arch-canvas [data-node="node-merge-gates"]')
      .click();
    await expect(renovateStrip.locator("a")).toHaveCount(0);

    expect(pageErrors, pageErrors.join("\n")).toEqual([]);
  });

  test("architecture figure replaces the artboard with the trace at 390px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/projects/editorial-workflow#b04");

    // Below the threshold the artboard is not rendered at all; the trace takes
    // over inside the same frame, and no detail strip is shown.
    await expect(page.locator(".pcase-arch-artboard")).toHaveCount(0);
    const trace = page.locator(".pcase-arch-trace");
    await expect(trace).toBeVisible();
    await expect(page.getByTestId("architecture-detail-strip")).toHaveCount(0);

    // All nine nodes render, and branch/loop topology survives as derived
    // connector text — the connector rows own the topology, not the nodes.
    await expect(trace.locator("[data-node]")).toHaveCount(9);
    await expect(trace).toContainText("↑ Revise — returns to 06 Draft");
    await expect(trace).toContainText(
      "↓ Skip bypasses 04 · rejoins at 05 Context",
    );

    // A collapsed node card carries only its ordinal and title — no partner
    // tags restating topology (e.g. Critique's old "↑ 06 revise").
    const critique = trace.locator('[data-node="node-critique"]');
    await expect(critique).toContainText("Critique");
    await expect(critique).not.toContainText("revise");

    // The one exceptional kind chip is kept (Publish is an output, not a skill);
    // ordinary skill nodes carry no kind metadata. (Chip text is uppercased by
    // CSS; the DOM text is the raw kind.)
    await expect(
      trace.locator('[data-node="node-publish"] .pcase-arch-trace-chip'),
    ).toHaveText("output");
    await expect(
      trace.locator('[data-node="node-capture"] .pcase-arch-trace-chip'),
    ).toHaveCount(0);
    await expect(
      trace.locator('[data-node="node-draft"] .pcase-arch-trace-chip'),
    ).toHaveCount(0);

    // Tapping a node expands it to only its explanatory summary and Close — no
    // kind line, no edge serialization. The summary lives in the controlled
    // panel (a sibling of the trigger) so aria-controls always has a target.
    await critique.click();
    await expect(critique).toHaveAttribute("aria-expanded", "true");
    await expect(critique).toContainText("Close");
    await expect(critique).not.toContainText("node 07");
    await expect(critique).not.toContainText("in: 06");
    const critiqueCard = trace.locator(
      '.pcase-arch-trace-card:has([data-node="node-critique"])',
    );
    await expect(critiqueCard).toContainText("Adversarial draft critique");
    // aria-controls resolves to a rendered panel.
    const panelId = await critique.getAttribute("aria-controls");
    await expect(trace.locator(`#${panelId}`)).toBeVisible();

    // A second press closes it; only one is open at a time.
    await critique.click();
    await expect(critique).toHaveAttribute("aria-expanded", "false");

    // The output node owns evidence; the link is a sibling of the button.
    const publish = trace.locator('[data-node="node-publish"]');
    await publish.click();
    await expect(
      trace.locator('a[href="https://dev.to/michaeltruong"]'),
    ).toBeVisible();

    // Escape closes the open node.
    await page.keyboard.press("Escape");
    await expect(publish).toHaveAttribute("aria-expanded", "false");

    const overflowX = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflowX).toBe(false);
  });

  test("architecture trace holds without horizontal overflow at 320px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/projects/renovate-governance#b02");

    await expect(page.locator(".pcase-arch-artboard")).toHaveCount(0);
    const trace = page.locator(".pcase-arch-trace");
    await expect(trace).toBeVisible();
    await expect(trace.locator("[data-node]")).toHaveCount(5);

    // The non-dominant kinds keep their chips (Route is a workflow, Merge gates
    // governance); the agent nodes — the dominant kind — carry none.
    await expect(
      trace.locator('[data-node="node-route"] .pcase-arch-trace-chip'),
    ).toHaveText("workflow");
    await expect(
      trace.locator('[data-node="node-merge-gates"] .pcase-arch-trace-chip'),
    ).toHaveText("governance");
    await expect(
      trace.locator('[data-node="node-classify"] .pcase-arch-trace-chip'),
    ).toHaveCount(0);

    const overflowX = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflowX).toBe(false);
  });

  // Behavioral read of the wide architecture figure: the rendered artboard width
  // (its bounding box, post-transform), the measured column, whether the frame
  // scrolls, and whether the last node's trailing edge is inside the frame.
  async function figureFit(page: Page) {
    return page.evaluate(() => {
      const frame = document.querySelector<HTMLElement>(".pcase-arch-canvas")!;
      const art = document.querySelector<HTMLElement>(".pcase-arch-artboard")!;
      const label = document.querySelector<HTMLElement>(
        ".pcase-arch-canvas .pcase-arch-node-label",
      )!;
      const frameRect = frame.getBoundingClientRect();
      let maxRight = -Infinity;
      for (const node of frame.querySelectorAll("[data-node]")) {
        maxRight = Math.max(maxRight, node.getBoundingClientRect().right);
      }
      const rendered = art.getBoundingClientRect().width;
      return {
        column: frame.clientWidth,
        rendered,
        authoredLabelPx: parseFloat(getComputedStyle(label).fontSize),
        headPx: parseFloat(
          getComputedStyle(document.querySelector(".pcase-arch-head span")!)
            .fontSize,
        ),
        hScroll: frame.scrollWidth > frame.clientWidth + 1,
        rightmostInside: maxRight <= frameRect.right + 1,
      };
    });
  }

  const INTRINSIC: Record<string, number> = {
    "editorial-workflow": 1104,
    "renovate-governance": 1064,
  };

  // Acceptance 05b — at representative desktop widths both figures are whole in
  // the frame at initial render, with no horizontal scrolling.
  test("architecture figures fit whole at 1440 and 1280 without horizontal scroll", async ({
    page,
  }) => {
    for (const slug of Object.keys(INTRINSIC)) {
      for (const width of [1440, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/projects/${slug}`);
        // Wait for the ResizeObserver-driven fit to settle.
        await expect
          .poll(
            async () => {
              const fit = await figureFit(page);
              return fit.hScroll === false && fit.rightmostInside === true;
            },
            { timeout: 5000, message: `${slug} @ ${width}` },
          )
          .toBe(true);

        const fit = await figureFit(page);
        const scale = fit.rendered / INTRINSIC[slug]!;
        // The whole topology is visible and nothing scrolls sideways.
        expect(fit.hScroll, `${slug} @ ${width} no scroll`).toBe(false);
        expect(fit.rightmostInside, `${slug} @ ${width} whole`).toBe(true);
        // Node label never renders below the 12px floor in wide mode.
        expect(fit.authoredLabelPx * scale).toBeGreaterThanOrEqual(11.99);
        // Page-scale UI outside the artboard is not scaled (head stays mono 11).
        expect(fit.headPx).toBeCloseTo(11, 1);
      }
    }
  });

  // Presentation-agnostic read: which presentation renders, the measured column
  // (the frame is present in both), whether the frame scrolls sideways, and the
  // rendered artboard width when the artboard is showing.
  async function figureState(page: Page) {
    return page.evaluate(() => {
      const frame = document.querySelector<HTMLElement>(".pcase-arch-canvas")!;
      const art = document.querySelector<HTMLElement>(".pcase-arch-artboard");
      const trace = document.querySelector<HTMLElement>(".pcase-arch-trace");
      return {
        column: frame.clientWidth,
        isArtboard: art !== null,
        isTrace: trace !== null,
        renderedArtboard: art ? art.getBoundingClientRect().width : 0,
        hScroll: frame.scrollWidth > frame.clientWidth + 1,
      };
    });
  }

  // Derived per-figure thresholds: round(intrinsic × 0.80).
  const THRESHOLD: Record<string, number> = {
    "editorial-workflow": Math.round(1104 * 0.8), // 883
    "renovate-governance": Math.round(1064 * 0.8), // 851
  };

  // Acceptance 09 — the presentation is chosen by the figure's own container
  // width (frameWidth < intrinsic × 0.80), not a viewport breakpoint, and above
  // the threshold the artboard fits by clamp(0.80, column/intrinsic, 1). Widths
  // span the §09 table; assertions are self-consistent against the measured
  // column (robust to the host's scrollbar) and never assume presentation is
  // monotonic in viewport — the 921→920 rail-unstick flips renovate back.
  test("architecture presentation and fit follow the container rule across widths", async ({
    page,
  }) => {
    const widths = [1440, 1280, 1194, 1152, 1024, 921, 920, 768, 741];
    for (const slug of Object.keys(INTRINSIC)) {
      const intrinsic = INTRINSIC[slug]!;
      const threshold = THRESHOLD[slug]!;
      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/projects/${slug}`);

        // Settle: poll until the presentation matches the measured column and
        // the fit has converged (the artboard starts at scale 1 and scrolls for
        // a frame before the ResizeObserver measures — wait that transient out).
        await expect
          .poll(
            async () => {
              const s = await figureState(page);
              return s.isTrace === s.column < threshold && !s.hScroll;
            },
            { timeout: 5000, message: `${slug} @ ${width} presentation` },
          )
          .toBe(true);

        const s = await figureState(page);
        // Presentation is the container rule, evaluated on the measured column.
        expect(s.isTrace, `${slug} @ ${width} trace?`).toBe(
          s.column < threshold,
        );
        expect(s.isArtboard, `${slug} @ ${width} artboard?`).toBe(
          s.column >= threshold,
        );
        // The figure frame never scrolls sideways in either presentation.
        expect(s.hScroll, `${slug} @ ${width} no scroll`).toBe(false);

        // Where the artboard shows, it fits by the locked clamp.
        if (s.isArtboard) {
          const scale = s.renderedArtboard / intrinsic;
          const expected = Math.min(1, Math.max(0.8, s.column / intrinsic));
          expect(scale, `${slug} @ ${width} scale`).toBeCloseTo(expected, 2);
          expect(scale, `${slug} @ ${width} floor`).toBeGreaterThanOrEqual(
            0.7999,
          );
          expect(scale, `${slug} @ ${width} ceil`).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  // The non-monotonic boundary (§09): at viewport 921 the rail is sticky and
  // both figures are trace; at 920 the rail unsticks, handing width back so
  // renovate's artboard becomes viable again while editorial stays trace.
  test("architecture 921→920 rail-unstick flips only renovate back to the artboard", async ({
    page,
  }) => {
    for (const [width, editorialTrace, renovateTrace] of [
      [921, true, true],
      [920, true, false],
    ] as const) {
      await page.setViewportSize({ width, height: 900 });

      await page.goto("/projects/editorial-workflow");
      await expect
        .poll(
          async () => {
            const s = await figureState(page);
            return s.isTrace === editorialTrace && !s.hScroll;
          },
          { timeout: 5000, message: `editorial @ ${width}` },
        )
        .toBe(true);

      await page.goto("/projects/renovate-governance");
      await expect
        .poll(
          async () => {
            const s = await figureState(page);
            return s.isTrace === renovateTrace && !s.hScroll;
          },
          { timeout: 5000, message: `renovate @ ${width}` },
        )
        .toBe(true);
    }
  });

  // Acceptance — one selection state is shared by both presentations and must
  // survive a resize that crosses the threshold (no remount drops it).
  test("architecture selection survives crossing the presentation threshold", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/projects/editorial-workflow");
    await expect
      .poll(async () => (await figureState(page)).isArtboard, {
        timeout: 5000,
        message: "settle to artboard",
      })
      .toBe(true);

    // Select a node on the artboard; the strip resolves it.
    await page
      .locator('.pcase-arch-canvas [data-node="node-critique"]')
      .click();
    const strip = page.getByTestId("architecture-detail-strip");
    await expect(strip).toContainText("skill · node 07");

    // Shrink below the editorial threshold: the trace takes over and the same
    // node is still the open one (selection preserved across the switch).
    await page.setViewportSize({ width: 390, height: 900 });
    await expect
      .poll(async () => (await figureState(page)).isTrace, {
        timeout: 5000,
        message: "settle to trace",
      })
      .toBe(true);
    const critique = page.locator(
      '.pcase-arch-trace [data-node="node-critique"]',
    );
    await expect(critique).toHaveAttribute("aria-expanded", "true");
    await expect(
      page.locator('.pcase-arch-trace-card:has([data-node="node-critique"])'),
    ).toContainText("Adversarial draft critique");
    // The strip is not rendered in the trace presentation.
    await expect(strip).toHaveCount(0);

    // Grow back above the threshold: the artboard returns with the selection
    // still driving the strip.
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect
      .poll(async () => (await figureState(page)).isArtboard, {
        timeout: 5000,
        message: "settle back to artboard",
      })
      .toBe(true);
    await expect(page.getByTestId("architecture-detail-strip")).toContainText(
      "skill · node 07",
    );
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
