import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  JSON_LD_FRAGMENT,
  PersonJsonLd,
  buildPersonJsonLd,
  jsonLdId,
} from "@/components/PersonJsonLd";
import { profile } from "@/content/profile";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site-metadata";

const SITE_URL = "https://michaeltruong.ai";

type GraphNode = Record<string, unknown>;

function getGraphNode(
  graph: GraphNode[],
  type: "WebSite" | "ProfilePage" | "Person",
): GraphNode {
  const node = graph.find((entry) => entry["@type"] === type);
  if (!node) {
    throw new Error(`Missing ${type} node in @graph`);
  }
  return node;
}

describe("buildPersonJsonLd graph", () => {
  it("emits a linked @graph with WebSite, ProfilePage, and Person", () => {
    const jsonLd = buildPersonJsonLd(profile, SITE_URL);

    expect(jsonLd["@context"]).toBe("https://schema.org");
    expect(jsonLd["@graph"]).toHaveLength(3);

    const graph = jsonLd["@graph"] as GraphNode[];
    const types = graph.map((node) => node["@type"]);
    expect(types).toEqual(["WebSite", "ProfilePage", "Person"]);
  });

  it("uses stable @id URLs under the site origin", () => {
    const jsonLd = buildPersonJsonLd(profile, SITE_URL);
    const graph = jsonLd["@graph"] as GraphNode[];

    expect(getGraphNode(graph, "WebSite")["@id"]).toBe(
      jsonLdId(SITE_URL, "website"),
    );
    expect(getGraphNode(graph, "ProfilePage")["@id"]).toBe(
      jsonLdId(SITE_URL, "profilePage"),
    );
    expect(getGraphNode(graph, "Person")["@id"]).toBe(
      jsonLdId(SITE_URL, "person"),
    );

    expect(jsonLdId(SITE_URL, "website")).toBe(`${SITE_URL}/#website`);
    expect(jsonLdId(SITE_URL, "profilePage")).toBe(`${SITE_URL}/#profilepage`);
    expect(jsonLdId(SITE_URL, "person")).toBe(`${SITE_URL}/#person`);
    expect(JSON_LD_FRAGMENT).toEqual({
      website: "website",
      profilePage: "profilepage",
      person: "person",
    });
  });

  it("links WebSite, ProfilePage, and Person via @id references", () => {
    const jsonLd = buildPersonJsonLd(profile, SITE_URL);
    const graph = jsonLd["@graph"] as GraphNode[];

    const website = getGraphNode(graph, "WebSite");
    const profilePage = getGraphNode(graph, "ProfilePage");
    const person = getGraphNode(graph, "Person");

    expect(website.publisher).toEqual({ "@id": person["@id"] });
    expect(profilePage.isPartOf).toEqual({ "@id": website["@id"] });
    expect(profilePage.mainEntity).toEqual({ "@id": person["@id"] });
  });

  it("keeps Person claims aligned with profile data only", () => {
    const jsonLd = buildPersonJsonLd(profile, SITE_URL);
    const person = getGraphNode(jsonLd["@graph"] as GraphNode[], "Person");

    expect(person).toEqual({
      "@type": "Person",
      "@id": jsonLdId(SITE_URL, "person"),
      name: profile.name,
      jobTitle: ["Senior Software Engineer", "AI Product Engineer"],
      url: SITE_URL,
      email: profile.email,
      homeLocation: {
        "@type": "Place",
        name: profile.location,
      },
      sameAs: [
        profile.links.linkedin,
        profile.links.github,
        profile.links.blog,
      ],
    });
  });

  it("derives WebSite identity fields from shared site metadata constants", () => {
    const jsonLd = buildPersonJsonLd(profile, SITE_URL);
    const website = getGraphNode(jsonLd["@graph"] as GraphNode[], "WebSite");

    expect(website.name).toBe(SITE_NAME);
    expect(website.description).toBe(SITE_DESCRIPTION);
    expect(website.url).toBe(SITE_URL);
  });
});

describe("PersonJsonLd", () => {
  it("renders a single JSON-LD script with the linked graph", () => {
    const html = renderToStaticMarkup(<PersonJsonLd profile={profile} />);

    expect(html).toContain('type="application/ld+json"');

    const match = html.match(/<script[^>]*>(.*)<\/script>/);
    expect(match).not.toBeNull();

    const parsed = JSON.parse(match![1]) as ReturnType<
      typeof buildPersonJsonLd
    >;

    expect(parsed["@graph"]).toHaveLength(3);
    expect(getGraphNode(parsed["@graph"] as GraphNode[], "Person").email).toBe(
      profile.email,
    );
  });
});
