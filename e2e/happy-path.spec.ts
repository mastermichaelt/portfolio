import { expect, test, type Page } from "@playwright/test";

const PROJECT_SLUGS = [
  "codenames-ai",
  "editorial-workflow",
  "resume-generator",
  "renovate-governance",
] as const;

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
  test("home is live with flagships and featured writing", async ({ page }) => {
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
      page.locator('a.anchor[href="/projects/editorial-workflow"]'),
    ).toBeVisible();

    await expect(page.locator("article.case-panel")).toHaveCount(2);
    await expect(
      page.getByRole("link", { name: /Codenames AI/i }).first(),
    ).toBeVisible();
    await expect(
      page
        .getByRole("link", { name: /AI-assisted editorial workflow/i })
        .first(),
    ).toBeVisible();

    const featuredWriting = page.locator("a.list-row[href*='dev.to']");
    await expect(featuredWriting).toHaveCount(3);
    await expect(featuredWriting.first()).toHaveAttribute(
      "href",
      /dev\.to\/michaeltruong/,
    );

    await expect(
      page.getByRole("link", { name: /ecosystem walkthrough/i }),
    ).toHaveAttribute("href", "/ecosystem");
  });

  test("home 1b layout stacks at 375px without invented metrics", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByText("175+")).toHaveCount(0);
    await expect(page.getByText("Career ledger")).toHaveCount(0);
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

  test("projects index lists four case studies", async ({ page }) => {
    await page.goto("/projects");

    await expect(
      page.getByRole("heading", {
        name: "Work arranged as systems, not a résumé dump.",
      }),
    ).toBeVisible();

    for (const slug of PROJECT_SLUGS) {
      await expect(
        page.locator(`a.work-card[href="/projects/${slug}"]`),
      ).toBeVisible();
    }
  });

  test("case study page renders sections and links", async ({ page }) => {
    await page.goto("/projects/codenames-ai");

    await expect(
      page.getByRole("heading", { name: "Codenames AI", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Problem" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Evidence" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Links" })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "On this page" }),
    ).toBeVisible();

    const liveLink = page
      .locator("a.evidence-item")
      .filter({ hasText: "codenames-ai.com" });
    await expect(liveLink).toHaveAttribute("href", /codenames-ai\.com/);
    await expect(liveLink).toHaveAttribute("target", "_blank");
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

  test("about stays thin with contact channels", async ({ page }) => {
    await page.goto("/about");

    const content = page.locator("#content");
    await expect(
      content.getByRole("heading", { name: "Michael Truong" }),
    ).toBeVisible();
    await expect(
      content.getByRole("link", { name: "michael@multipliers.dev" }),
    ).toHaveAttribute("href", "mailto:michael@multipliers.dev");
    await expect(
      content.getByRole("link", { name: "LinkedIn" }),
    ).toHaveAttribute("href", /linkedin\.com/);
    await expect(content.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      /github\.com/,
    );
    await expect(
      content.getByRole("link", { name: "DEV blog" }),
    ).toHaveAttribute("href", /dev\.to\/michaeltruong/);
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
