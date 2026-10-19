import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { getSitemapPaths } from "../lib/sitemap-paths";

/* Automated axe gate: WCAG 2.2 A/AA over every sitemap route, in both themes,
   at 1280 and 390 px, plus the mobile nav sheet open. Violations fail; they are
   fixed, not suppressed — no rules are disabled and no regions excluded.
   See docs/design-system.md § Accessibility expectations.

   Scope: each scan is the hydrated document after React has committed the tree
   containing <main id="content">, under prefers-reduced-motion: reduce and at
   scroll position 0. This is not a general "all passive effects settled"
   signal: the current mount effects either subscribe without changing the
   scanned DOM or recompute the same initial state. Intermediate animation and
   scroll states (e.g. a Codenames stage beat parked mid-fade) are not scanned,
   nor are widths other than 1280 and 390 px.

   axe "incomplete" nodes (contrast it could not decide) never pass silently:
   each scan records a count annotation, and the full JSON is attached when the
   scan fails or when AXE_REPORT_INCOMPLETE=1 is set for a baseline review. */

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const THEMES = ["light", "dark"] as const;

const VIEWPORTS = {
  desktop: { width: 1280, height: 720 },
  mobile: { width: 390, height: 844 },
} as const;

const REPORT_INCOMPLETE = process.env.AXE_REPORT_INCOMPLETE === "1";

type AxeResults = Awaited<ReturnType<AxeBuilder["analyze"]>>;

function formatViolations(label: string, violations: AxeResults["violations"]) {
  const lines = [`axe: ${violations.length} violation(s) on ${label}`];
  for (const violation of violations) {
    lines.push(
      `[${violation.impact}] ${violation.id}: ${violation.help} — ${violation.helpUrl}`,
    );
    for (const node of violation.nodes) {
      // failureSummary opens with "Fix any/all of the following:"; the first real check is the useful line.
      const summary = node.failureSummary
        ?.split("\n")
        .map((line) => line.trim())
        .find((line) => line && !line.endsWith("following:"));
      lines.push(`  - ${node.target.join(" ")}: ${summary ?? ""}`);
    }
  }
  return lines.join("\n");
}

/* React calls the DevTools global hook's onCommitFiberRoot after every commit,
   once that commit's layout effects have run. Marking the commit whose tree
   contains <main id="content"> proves React has claimed the page; Playwright
   observes the marker in a later animation frame, after synchronous layout-
   effect updates such as ArchitectureFigure's narrow trace swap. It does not
   claim that arbitrary passive effects have settled; the scope audit above is
   what makes this boundary sufficient for the current pages. */
function installHydrationSignal() {
  type Fiber = {
    stateNode: unknown;
    child: Fiber | null;
    sibling: Fiber | null;
  };
  const w = window as unknown as Record<string, unknown>;
  w.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true,
    inject: () => 1,
    onCommitFiberRoot: (_id: number, root: { current: Fiber }) => {
      const content = document.getElementById("content");
      if (w.__axeContentHydrated || !content) return;
      const stack: Fiber[] = [root.current];
      while (stack.length > 0) {
        const fiber = stack.pop()!;
        if (fiber.stateNode === content) {
          w.__axeContentHydrated = true;
          return;
        }
        if (fiber.sibling) stack.push(fiber.sibling);
        if (fiber.child) stack.push(fiber.child);
      }
    },
  };
}

async function gotoHydrated(page: Page, path: string, theme: string) {
  await page.addInitScript(installHydrationSignal);
  await page.goto(path);
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  await page.waitForFunction(
    () =>
      (window as unknown as Record<string, unknown>).__axeContentHydrated ===
      true,
  );
}

function summarizeIncomplete(incomplete: AxeResults["incomplete"]) {
  const nodes = incomplete.reduce((sum, rule) => sum + rule.nodes.length, 0);
  const rules = incomplete.map((rule) => `${rule.id} ×${rule.nodes.length}`);
  return `${nodes} node(s) need manual review: ${rules.join(", ")}`;
}

async function scan(page: Page, testInfo: TestInfo, label: string) {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const failed = results.violations.length > 0;

  // Undecidable nodes don't fail the scan, but they are never dropped: the
  // count is always annotated; the full JSON on failure or baseline review.
  if (results.incomplete.length > 0) {
    testInfo.annotations.push({
      type: "axe-incomplete",
      description: summarizeIncomplete(results.incomplete),
    });
    if (failed || REPORT_INCOMPLETE) {
      await testInfo.attach("axe-incomplete", {
        body: JSON.stringify(results.incomplete, null, 2),
        contentType: "application/json",
      });
    }
  }
  if (failed) {
    await testInfo.attach("axe-violations", {
      body: JSON.stringify(results.violations, null, 2),
      contentType: "application/json",
    });
  }

  expect(
    results.violations,
    formatViolations(label, results.violations),
  ).toEqual([]);
}

// A deterministic gate shouldn't retry; keep a trace since on-first-retry never fires.
test.describe.configure({ retries: 0 });
test.use({
  contextOptions: { reducedMotion: "reduce" },
  trace: "retain-on-failure",
});

for (const theme of THEMES) {
  for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
    test.describe(`axe ${theme} / ${viewportName}`, () => {
      test.use({ colorScheme: theme, viewport });

      for (const path of getSitemapPaths()) {
        test(path, async ({ page }, testInfo) => {
          await gotoHydrated(page, path, theme);
          await scan(
            page,
            testInfo,
            `${path} [${theme}, ${viewportName}, default]`,
          );
        });
      }
    });
  }

  test.describe(`axe ${theme} / mobile / nav-open`, () => {
    test.use({ colorScheme: theme, viewport: VIEWPORTS.mobile });

    test("/projects", async ({ page }, testInfo) => {
      await gotoHydrated(page, "/projects", theme);

      // The toggle's aria-label flips on open, so find it by what it controls.
      const toggle = page.locator('[aria-controls="mobile-nav"]');
      // Hydration is awaited above; the retry stays as a guard against a lost click.
      await expect(async () => {
        if ((await toggle.getAttribute("aria-expanded")) !== "true") {
          await toggle.click();
        }
        await expect(toggle).toHaveAttribute("aria-expanded", "true", {
          timeout: 1_000,
        });
      }).toPass();
      await expect(page.locator("#mobile-nav")).toBeVisible();

      await scan(page, testInfo, `/projects [${theme}, mobile, nav-open]`);
    });
  });
}
