import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PROJECT_SITEMAP_SLUGS,
  STATIC_SITEMAP_PATHS,
  getSitemapPaths,
} from "@/lib/sitemap-paths";

describe("getSitemapPaths", () => {
  it("lists 5 static routes and 4 project detail paths", () => {
    const paths = getSitemapPaths();

    expect(paths).toHaveLength(9);
    expect(paths).toEqual([
      ...STATIC_SITEMAP_PATHS,
      ...PROJECT_SITEMAP_SLUGS.map((slug) => `/projects/${slug}`),
    ]);
  });

  it("includes the approved static and project inventory", () => {
    const paths = getSitemapPaths();

    expect(paths).toContain("/");
    expect(paths).toContain("/about");
    expect(paths).toContain("/projects");
    expect(paths).toContain("/articles");
    expect(paths).toContain("/ecosystem");
    expect(paths).toContain("/projects/experiment-measurement");
    expect(paths).toContain("/projects/codenames-ai");
    expect(paths).toContain("/projects/editorial-workflow");
    expect(paths).toContain("/projects/renovate-governance");
    expect(paths).not.toContain("/projects/resume-generator");
  });
});

describe("sitemap route", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("emits 9 absolute URLs from the canonical site origin", async () => {
    const sitemap = (await import("@/app/sitemap")).default;
    const entries = sitemap();

    expect(entries).toHaveLength(9);
    expect(entries).toEqual(
      getSitemapPaths().map((path) => ({
        url: `https://michaeltruong.ai${path}`,
      })),
    );
  });
});

describe("robots route", () => {
  beforeEach(() => {
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function loadRobots() {
    return (await import("@/app/robots")).default;
  }

  it("disallows all crawlers on Vercel preview", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.resetModules();

    const robots = await loadRobots();
    expect(robots()).toEqual({
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    });
  });

  it("allows production crawlers and points to the sitemap", async () => {
    const robots = await loadRobots();
    expect(robots()).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
      },
      sitemap: "https://michaeltruong.ai/sitemap.xml",
    });
  });
});
