import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PersonJsonLd, buildPersonJsonLd } from "@/components/PersonJsonLd";
import { profile } from "@/content/profile";

describe("buildPersonJsonLd", () => {
  it("includes email, Sydney location, and sameAs profiles", () => {
    const jsonLd = buildPersonJsonLd(profile, "https://michaeltruong.ai");

    expect(jsonLd.email).toBe("michael@multipliers.dev");
    expect(jsonLd.homeLocation).toEqual({
      "@type": "Place",
      name: "Sydney, Australia",
    });
    expect(jsonLd.sameAs).toEqual([
      "https://www.linkedin.com/in/michael-truong-dev",
      "https://github.com/mastermichaelt",
      "https://dev.to/michaeltruong",
    ]);
    expect(jsonLd.jobTitle).toEqual([
      "Senior Software Engineer",
      "AI Product Engineer",
    ]);
    expect(jsonLd.url).toBe("https://michaeltruong.ai");
    expect(jsonLd.name).toBe("Michael Truong");
  });
});

describe("PersonJsonLd", () => {
  it("renders schema.org Person JSON-LD on the page", () => {
    const html = renderToStaticMarkup(<PersonJsonLd profile={profile} />);

    expect(html).toContain('type="application/ld+json"');

    const match = html.match(/<script[^>]*>(.*)<\/script>/);
    expect(match).not.toBeNull();

    const parsed = JSON.parse(match![1]) as ReturnType<
      typeof buildPersonJsonLd
    >;

    expect(parsed["@context"]).toBe("https://schema.org");
    expect(parsed["@type"]).toBe("Person");
    expect(parsed.email).toBe("michael@multipliers.dev");
    expect(parsed.homeLocation.name).toBe("Sydney, Australia");
    expect(parsed.sameAs).toHaveLength(3);
  });
});
