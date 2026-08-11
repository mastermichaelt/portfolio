import { expect, test, type Page } from "@playwright/test";

const PROJECT_SLUGS = [
  "codenames-ai",
  "editorial-workflow",
  "resume-generator",
  "renovate-governance",
] as const;

async function expectPrimaryNav(page: Page) {
  const nav = page.getByRole("navigation", { name: "Primary" });
  await expect(nav.getByRole("link", { name: "Home" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Projects" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Articles" })).toBeVisible();
  await expect(
    nav.getByRole("link", { name: "Ecosystem", exact: true }),
  ).toBeVisible();
  await expect(nav.getByRole("link", { name: "About" })).toBeVisible();
  await expect(
    nav.getByRole("link", { name: "System", exact: true }),
  ).toHaveCount(0);
}

test.describe("portfolio happy path", () => {
  test("home is live with flagships and featured writing", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Michael Truong" }),
    ).toBeVisible();
    await expect(page.getByText("under construction")).toHaveCount(0);
    await expectPrimaryNav(page);

    await expect(
      page.getByRole("link", { name: /Codenames AI/i }).first(),
    ).toBeVisible();
    await expect(
      page
        .getByRole("link", { name: /AI-assisted editorial workflow/i })
        .first(),
    ).toBeVisible();

    const featuredWriting = page.locator("a.log-row");
    await expect(featuredWriting).toHaveCount(3);
    await expect(featuredWriting.first()).toHaveAttribute(
      "href",
      /dev\.to\/michaeltruong/,
    );
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

    await selectNode("ecosystem-canvas-workflow-editorial", "Inbox");
    await expect(
      page.getByTestId("ecosystem-detail-panel").getByRole("heading", {
        name: "Inbox",
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

  test("mobile nav opens Contact and navigates", async ({ page }) => {
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
    await expect(mobile.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(mobile.getByRole("link", { name: "Projects" })).toBeVisible();
    await expect(mobile.getByRole("link", { name: "Articles" })).toBeVisible();
    await expect(mobile.getByRole("link", { name: "Ecosystem" })).toBeVisible();
    await expect(mobile.getByRole("link", { name: "About" })).toHaveCount(0);

    await mobile.getByRole("link", { name: "Contact" }).click();
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
