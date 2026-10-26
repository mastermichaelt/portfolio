import { expect, test, type Locator, type Page } from "@playwright/test";

async function expectFullyInViewport(page: Page, locator: Locator) {
  const box = await locator.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  if (!box || !viewport) {
    return;
  }

  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 0.5);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 0.5);
}

test.describe("connect networking card", () => {
  test("renders identity, QR, and links without primary site nav", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/connect");

    await expect(page.locator("main#content")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Michael Truong", level: 1 }),
    ).toBeVisible();
    const qrImage = page.getByRole("img", { name: /QR code/i });
    await expect(qrImage).toBeVisible();
    await expectFullyInViewport(page, qrImage);
    await expect(
      page.getByRole("link", { name: "LinkedIn profile" }),
    ).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/michael-truong-dev/",
    );
    await expect(page.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/mastermichaelt",
    );
    await expect(
      page.getByRole("link", { name: "Portfolio home" }),
    ).toHaveAttribute("href", "/");

    await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(
      0,
    );
    await expect(page.locator("footer.site-footer")).toHaveCount(0);
    await expect(page.locator('img[src$=".jpg"]')).toHaveCount(1);
    await expect(qrImage).toHaveAttribute("src", /linkedin-connect-qr\.svg$/);
  });

  test("fits the QR in the viewport on a short phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 667 });
    await page.goto("/connect");

    const qrImage = page.getByRole("img", { name: /QR code/i });
    await expect(qrImage).toBeVisible();
    await expectFullyInViewport(page, qrImage);
  });
});
