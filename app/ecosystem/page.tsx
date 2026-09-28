import type { Metadata } from "next";
import Link from "next/link";
import { ProductionLine } from "@/components/ecosystem/ProductionLine";
import { getPortfolioRepository } from "@/lib/portfolio";

export const metadata: Metadata = {
  title: "Ecosystem",
  description:
    "Four unrelated systems — a game move, a dependency upgrade, a published report and this site — pass the same five gates, in the same order.",
  alternates: {
    canonical: "/ecosystem",
  },
  openGraph: {
    url: "/ecosystem",
  },
};

export default async function EcosystemPage() {
  const repository = getPortfolioRepository();
  const line = await repository.getProductionLine();

  const infrastructure = line.infrastructure;
  const prototypeCount = infrastructure.filter((item) => item.prototype).length;

  return (
    <main id="content">
      <section className="section hero hero-compact">
        <div className="container fade-in">
          <p className="eyebrow">Ecosystem · the line</p>
          <h1>Everything here ships down the same five stages.</h1>
          <p className="lead lead-follow measure">
            A game move, a dependency upgrade, a published report and this
            website are unrelated products. Each one began as a product
            requirement that needed a mechanism nobody had built yet. They pass
            the same gates, in the same order, for the same reason: an
            agent&apos;s output is a proposal until something deterministic has
            checked it and a person has judged it.
          </p>
        </div>
      </section>

      <section className="section section-flush">
        <div className="container fade-in delay-1">
          <ProductionLine line={line} />
        </div>
      </section>

      <section className="section">
        <div className="container fade-in delay-2">
          <div className="under-line-head">
            <p className="label">
              Under the line · shared infrastructure every lane draws on
            </p>
            <span className="meta">
              {infrastructure.length} items · {prototypeCount} prototype
            </span>
          </div>
          <div className="under-line-grid">
            {infrastructure.map((item) => (
              <div key={item.id} className="under-line-item">
                <p className="under-line-name">{item.name}</p>
                <p className="under-line-text">{item.body}</p>
                <p
                  className={`under-line-meta${
                    item.prototype ? " is-prototype" : ""
                  }`}
                >
                  {item.meta}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <nav className="section" aria-label="Where to next">
        <div className="container fade-in delay-2">
          <p className="label eco-onward-head">Where to next</p>
          <ul className="eco-onward">
            <li>
              <Link href="/projects">Projects — evidence index →</Link>
            </li>
            <li>
              <Link href="/about">About — practice record →</Link>
            </li>
            <li>
              <Link href="/">Home →</Link>
            </li>
          </ul>
        </div>
      </nav>
    </main>
  );
}
