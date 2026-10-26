import { expect, test, type Locator, type Page } from "@playwright/test";

import { CONNECT_HEADLINE, CONNECT_MANIFEST_PATH } from "../lib/connect";
import { getSitemapPaths } from "../lib/sitemap-paths";

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
  test("is listed in sitemap paths for axe coverage", () => {
    expect(getSitemapPaths()).toContain("/connect");
  });

  test("advertises the connect-only web app manifest", async ({ page }) => {
    await page.goto("/connect");
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      "href",
      CONNECT_MANIFEST_PATH,
    );
  });

  test("does not advertise the connect manifest on site home", async ({
    page,
  }) => {
    await page.goto("/");
    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveCount(1);
    await expect(manifest).not.toHaveAttribute("href", CONNECT_MANIFEST_PATH);
  });

  test("renders identity, QR, and links without primary site nav", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/connect");

    await expect(page.locator("main#content")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Michael Truong", level: 1 }),
    ).toBeVisible();
    await expect(page.getByText(CONNECT_HEADLINE)).toBeVisible();
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
    await expect(qrImage).toHaveAttribute("src", /connect-qr-art\.svg$/);

    const toggle = page.getByRole("button", {
      name: "Having trouble scanning? Show standard QR",
    });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");

    await toggle.click();
    await expect(qrImage).toHaveAttribute("src", /linkedin-connect-qr\.svg$/);
    await expect(
      page.getByRole("button", { name: "Show illustrated QR" }),
    ).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: "Show illustrated QR" }).click();
    await expect(qrImage).toHaveAttribute("src", /connect-qr-art\.svg$/);
  });

  test("toggles QR mode with the keyboard", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/connect");

    const toggle = page.getByRole("button", {
      name: "Having trouble scanning? Show standard QR",
    });
    await toggle.focus();
    await expect(toggle).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("img", { name: /QR code/i })).toHaveAttribute(
      "src",
      /linkedin-connect-qr\.svg$/,
    );
  });

  test("fits the QR in the viewport on a short phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 667 });
    await page.goto("/connect");

    const qrImage = page.getByRole("img", { name: /QR code/i });
    await expect(qrImage).toBeVisible();
    await expectFullyInViewport(page, qrImage);
  });

  test("keeps the QR in view at 375px width", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/connect");

    const qrImage = page.getByRole("img", { name: /QR code/i });
    await expect(qrImage).toBeVisible();
    await expectFullyInViewport(page, qrImage);
  });

  test("renders the networking card on desktop without site chrome", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/connect");

    await expect(page.locator("main#content")).toBeVisible();
    await expect(page.getByRole("img", { name: /QR code/i })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(
      0,
    );
    await expect(page.locator("footer.site-footer")).toHaveCount(0);
  });
});
