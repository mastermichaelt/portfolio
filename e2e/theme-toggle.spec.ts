import { expect, test, type Page } from "@playwright/test";

function themeAttr(page: Page) {
  return page.evaluate(() =>
    document.documentElement.getAttribute("data-theme"),
  );
}

test.describe("theme toggle", () => {
  test("follows the system preference when no choice is stored", async ({
    page,
  }) => {
    // Each load resolves against the current system preference (bootstrap +
    // provider). Live OS-theme changes while the page is open follow the same
    // resolveTheme() path (unit-tested in tests/theme.test.ts); Playwright's
    // emulateMedia does not emit a matchMedia "change" event, so that leg is
    // covered there and verified manually, not driven here.
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    expect(await themeAttr(page)).toBe("light");

    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    expect(await themeAttr(page)).toBe("dark");
  });

  test("an explicit choice flips the theme and persists across reload", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    expect(await themeAttr(page)).toBe("dark");

    // In dark the switch offers Light. Its label is its accessible name.
    await page.getByRole("button", { name: "Light mode" }).click();
    expect(await themeAttr(page)).toBe("light");
    await expect(page.getByRole("button", { name: "Dark mode" })).toBeVisible();

    await page.reload();
    expect(await themeAttr(page)).toBe("light");

    // The explicit choice now overrides a conflicting system preference.
    await page.emulateMedia({ colorScheme: "dark" });
    await page.reload();
    expect(await themeAttr(page)).toBe("light");
  });

  test("paints the stored theme on first frame with no wrong-theme flash", async ({
    page,
  }) => {
    // Stored choice conflicts with the system preference — the classic flash case.
    await page.emulateMedia({ colorScheme: "light" });
    await page.addInitScript(() => {
      try {
        localStorage.setItem("theme", "dark");
      } catch {}
    });
    await page.goto("/", { waitUntil: "commit" });
    // The pre-paint bootstrap has already resolved the attribute.
    await expect.poll(() => themeAttr(page)).toBe("dark");
  });

  test("the switch is keyboard operable", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    const button = page.getByRole("button", { name: "Light mode" });
    await button.focus();
    await expect(button).toBeFocused();
    await page.keyboard.press("Enter");
    expect(await themeAttr(page)).toBe("light");
  });

  test("the switch appears as a sheet row on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");

    // Desktop switch is hidden with the rest of the collapsed chrome.
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
    await page.getByRole("button", { name: "Open menu" }).click();

    const row = page.getByRole("button", { name: "Light mode" });
    await expect(row).toBeVisible();
    await row.click();
    expect(await themeAttr(page)).toBe("light");
  });
});
