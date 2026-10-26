import { expect, test } from "@playwright/test";

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
    await expect(page.getByRole("img", { name: /QR code/i })).toBeVisible();
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
    await expect(page.getByRole("img", { name: /QR code/i })).toHaveAttribute(
      "src",
      /linkedin-connect-qr\.svg$/,
    );
  });
});
