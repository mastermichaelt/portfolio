import { describe, expect, it } from "vitest";
import { buildPersonJsonLd, jsonLdId } from "@/components/PersonJsonLd";
import { profile } from "@/content/profile";

const SITE_URL = "https://michaeltruong.ai";

type PersonGraphNode = Extract<
  ReturnType<typeof buildPersonJsonLd>["@graph"][number],
  { "@type": "Person" }
>;

function getPersonNode(
  jsonLd: ReturnType<typeof buildPersonJsonLd>,
): PersonGraphNode {
  const person = jsonLd["@graph"].find(
    (node): node is PersonGraphNode => node["@type"] === "Person",
  );
  if (!person) {
    throw new Error("Missing Person node in @graph");
  }
  return person;
}

describe("buildPersonJsonLd", () => {
  it("includes email, Sydney location, and sameAs profiles on the Person node", () => {
    const jsonLd = buildPersonJsonLd(profile, SITE_URL);
    const person = getPersonNode(jsonLd);

    expect(person.email).toBe("michael@multipliers.dev");
    expect(person.homeLocation).toEqual({
      "@type": "Place",
      name: "Sydney, Australia",
    });
    expect(person.sameAs).toEqual([
      "https://www.linkedin.com/in/michael-truong-dev",
      "https://github.com/mastermichaelt",
      "https://dev.to/michaeltruong",
    ]);
    expect(person.jobTitle).toEqual([
      "Senior Software Engineer",
      "AI Product Engineer",
    ]);
    expect(person.url).toBe(SITE_URL);
    expect(person.name).toBe("Michael Truong");
    expect(person["@id"]).toBe(jsonLdId(SITE_URL, "person"));
  });
});
