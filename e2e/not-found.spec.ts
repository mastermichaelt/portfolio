import { expect, test } from "@playwright/test";

test.describe("global not found", () => {
  test("unknown route returns 404 with site chrome and skip-link target", async ({
    page,
  }) => {
    const response = await page.goto(
      "/portfolio-route-does-not-exist-404-regression",
    );
    expect(response?.status()).toBe(404);

    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(nav.getByRole("link", { name: "Projects" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Articles" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "About" })).toBeVisible();

    await expect(page.locator("footer.site-footer")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Page not found" }),
    ).toBeVisible();
    await expect(page.locator("main#content")).toBeVisible();

    await expect(
      page.getByRole("link", { name: "Skip to content" }),
    ).toHaveAttribute("href", "#content");
  });
});
