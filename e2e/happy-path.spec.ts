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

  test("articles index links out to DEV.to", async ({ page }) => {
    await page.goto("/articles");

    await expect(
      page.getByRole("heading", {
        name: "Writing that makes the system legible.",
      }),
    ).toBeVisible();

    const rows = page.locator("a.log-row");
    await expect(rows.first()).toBeVisible();
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(8);

    await expect(rows.first()).toHaveAttribute(
      "href",
      /dev\.to\/michaeltruong/,
    );
    await expect(rows.first()).toHaveAttribute("target", "_blank");
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

    // A figure scope never truncates — it renders wider than the 300px gutter.
    const scopeWidth = await page
      .locator(".qfigure .figure-scope")
      .first()
      .evaluate((node) => node.getBoundingClientRect().width);
    expect(scopeWidth).toBeGreaterThan(300);
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
    const renovateCanvas = page.getByTestId(
      "ecosystem-canvas-workflow-renovate",
    );
    await expect(renovateCanvas).toBeVisible();
    // SVG <g> edges are often "hidden" to Playwright; assert rendered paths instead.
    const edgePaths = renovateCanvas.locator(".react-flow__edge-path");
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

    const classifyNode = renovateCanvas
      .locator(".react-flow__node")
      .filter({ hasText: "Classify" });
    await classifyNode.click();

    await expect(
      panel.getByRole("heading", { name: "Classify" }),
    ).toBeVisible();
    await expect(panel.getByText(/Renovate governance ladder/i)).toBeVisible();
    await expect(
      panel.getByRole("link", { name: "Open project case study" }),
    ).toHaveAttribute("href", "/projects/renovate-governance");

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

    await selectNode("ecosystem-canvas-workflow-renovate", "Classify");
    await expect(
      page.getByTestId("ecosystem-detail-panel").getByRole("heading", {
        name: "Classify",
      }),
    ).toBeVisible();

    await selectNode("ecosystem-canvas-workflow-editorial", "Capture");
    await expect(
      page.getByTestId("ecosystem-detail-panel").getByRole("heading", {
        name: "Capture",
      }),
    ).toBeVisible();
    await expect(
      page.getByTestId("ecosystem-canvas-workflow-product-loop"),
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
    await page.goto("/ecosystem#workflow-renovate");

    const section = page.locator("#workflow-renovate");
    await expect(
      section.getByRole("heading", { name: "Renovate governance ladder" }),
    ).toBeVisible();
    await expect(section).toBeInViewport();
    await expect(
      page.getByTestId("ecosystem-talk-track-workflow-renovate"),
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

    const canvas = page.getByTestId("ecosystem-canvas-workflow-renovate");
    await canvas.scrollIntoViewIfNeeded();
    await canvas
      .locator(".react-flow__node")
      .filter({ hasText: "Classify" })
      .first()
      .click();

    const panel = page.getByTestId("ecosystem-detail-panel");
    await expect(
      panel.getByRole("heading", { name: "Classify" }),
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

    const renovateCanvas = page.getByTestId(
      "ecosystem-canvas-workflow-renovate",
    );
    await renovateCanvas.scrollIntoViewIfNeeded();

    const classifyNode = renovateCanvas
      .locator(".react-flow__node")
      .filter({ hasText: "Classify" });
    await classifyNode.click();

    const inlinePanel = page.getByTestId("ecosystem-detail-inline");
    const heading = inlinePanel.getByRole("heading", { name: "Classify" });
    await expect(heading).toBeVisible();
    await expect(heading).toBeInViewport();

    // Panel must sit under the interacted canvas, not after every workflow.
    const renovateSection = page.locator("#workflow-renovate");
    await expect(
      renovateSection.getByTestId("ecosystem-detail-inline"),
    ).toBeVisible();
    await expect(
      page
        .locator("#workflow-editorial")
        .getByTestId("ecosystem-detail-inline"),
    ).toHaveCount(0);
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
