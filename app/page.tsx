import type { Metadata } from "next";
import Link from "next/link";
import { MethodReveal } from "@/components/home/MethodReveal";
import { QualifiedFigure } from "@/components/QualifiedFigure";
import type {
  HomepageChannel,
  HomepageMethodDimension,
} from "@/domain/homepage";
import { getPortfolioRepository } from "@/lib/portfolio";
import { HOME_DESCRIPTION, SITE_TITLE } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: {
    absolute: SITE_TITLE,
  },
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    description: HOME_DESCRIPTION,
  },
  twitter: {
    description: HOME_DESCRIPTION,
  },
};

/**
 * The channel's answer to one method dimension. `evidence` renders the single
 * qualified figure; `contract` renders the heaviest line; the rest render the
 * matching spine field. Shared by both the wide matrix and the narrow schema so
 * the two projections read from the same model, never divergent copy.
 */
function ChannelAnswer({
  channel,
  dimension,
}: {
  channel: HomepageChannel;
  dimension: HomepageMethodDimension;
}) {
  if (dimension.key === "evidence") {
    return <QualifiedFigure figure={channel.figure} />;
  }
  if (dimension.key === "contract") {
    return <p className="home2-contract">{channel.spine.contract}</p>;
  }
  return <p className="home2-answer">{channel.spine[dimension.key]}</p>;
}

export default async function HomePage() {
  const repository = getPortfolioRepository();
  const [profile, homepage] = await Promise.all([
    repository.getProfile(),
    repository.getHomepage(),
  ]);

  const { hero, method, channels, continuity, routes } = homepage;
  // The wide hero keeps availability inline and muted; the narrow hero drops it
  // to its own line. Kept out of the amber signal budget at both widths.
  const availability = profile.status?.replace(/\.\s*$/, "");
  const total = String(channels.length).padStart(2, "0");

  return (
    <main id="content" className="home2">
      <section className="home2-hero" aria-labelledby="home2-thesis">
        <div className="container">
          <p className="label home2-kicker">
            {profile.headline}{" "}
            <span className="home2-kicker-sep" aria-hidden="true">
              ·{" "}
            </span>
            {profile.location}
            {availability ? (
              <>
                {" "}
                <span className="home2-kicker-avail">
                  <span className="home2-kicker-sep" aria-hidden="true">
                    ·{" "}
                  </span>
                  {availability}
                </span>
              </>
            ) : null}
          </p>
          <div className="home2-hero-grid">
            <h1 id="home2-thesis">{hero.title}</h1>
            <p className="lead home2-hero-lead">
              {hero.leadEmphasis ? (
                <>
                  {hero.lead} <strong>{hero.leadEmphasis}</strong>
                </>
              ) : (
                hero.lead
              )}
            </p>
          </div>
        </div>
      </section>

      {/* The method section's once-on-entry reveal runs on GSAP ScrollTrigger
          (MethodReveal, mounted at the end of this page). The markup here is the
          resolved composition it degrades to with no JS or reduced motion; the
          runtime migration and its a11y contract are documented in
          docs/experiments/scroll-craft-baseline.md. */}
      <section className="home2-method" aria-labelledby="home2-method-head">
        <div className="container">
          <div className="section-head">
            <h2 id="home2-method-head">Two systems, one method</h2>
            <p className="label">
              01 /{" "}
              <span className="home2-read home2-read--wide">read across</span>
              <span className="home2-read home2-read--narrow">
                read down, twice
              </span>
            </p>
          </div>
          <p className="home2-method-intro">
            The same four questions, asked of both systems.
          </p>

          {/* Wide projection — the method is a persistent left axis; the two
              channels are adjacent columns, so comparison happens across a row. */}
          {/* Native div grid keeps the resolved composition exactly; ARIA table
              roles restore the row/column-header association a sighted reader
              gets spatially, so a screen reader announces each answer's method
              dimension (row header) and channel (column header). */}
          <div className="home2-only-wide">
            {/* The reveal fires once on entry and never re-hides. Its hidden
                state is applied by GSAP at mount, so the resolved composition is
                what renders with no JavaScript. Reading order, the ARIA table
                roles and the projection switch are all untouched. */}
            <div
              className="home2-matrix"
              role="table"
              aria-labelledby="home2-method-head"
              data-method-reveal=""
            >
              <div
                className="home2-matrix-row home2-matrix-row--head"
                role="row"
              >
                <div role="columnheader" />
                {channels.map((channel) => (
                  <div
                    key={channel.id}
                    className="home2-matrix-channel"
                    role="columnheader"
                  >
                    <p className="home2-channel-label">
                      {channel.channelLabel}
                    </p>
                    <h3 className="home2-channel-title">{channel.title}</h3>
                    <p className="meta">{channel.meta}</p>
                  </div>
                ))}
              </div>

              {method.map((dimension) => (
                <div
                  key={dimension.ordinal}
                  className={`home2-matrix-row home2-matrix-row--${dimension.key}`}
                  role="row"
                >
                  <div className="home2-dim" role="rowheader">
                    <p className="home2-dim-ord">{dimension.ordinal}</p>
                    <p className="home2-dim-label">{dimension.label}</p>
                    <p className="home2-dim-gloss">{dimension.gloss}</p>
                  </div>
                  {channels.map((channel) => (
                    <div key={channel.id} className="home2-cell" role="cell">
                      <ChannelAnswer channel={channel} dimension={dimension} />
                    </div>
                  ))}
                </div>
              ))}

              <div
                className="home2-matrix-row home2-matrix-row--route"
                role="row"
              >
                <div role="rowheader" />
                {channels.map((channel) => (
                  <div
                    key={channel.id}
                    className="home2-route-cell"
                    role="cell"
                  >
                    <Link className="home2-morelink" href={channel.href}>
                      <span>{channel.caseStudyLabel}</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Narrow projection — the schema is declared once, then instantiated
              per channel. Comparison happens through recognition: the second
              channel repeats the first channel's structure, ordinals included. */}
          <div className="home2-only-narrow">
            {/* The narrow projection is staggered too: the two projections are
                mutually exclusive at 820px, so a phone would otherwise get no
                enhancement at all. MethodReveal arms only the shown projection
                and re-arms the other across the breakpoint, via matchMedia. */}
            <ol className="home2-schema" data-method-reveal="">
              {method.map((dimension) => (
                <li key={dimension.ordinal} className="home2-schema-row">
                  <p className="home2-dim-ord">{dimension.ordinal}</p>
                  <div>
                    <p className="home2-dim-label">{dimension.label}</p>
                    <p className="home2-dim-gloss">{dimension.gloss}</p>
                  </div>
                </li>
              ))}
            </ol>

            {channels.map((channel, index) => (
              <section key={channel.id} className="home2-system">
                <p className="home2-system-count">
                  System {String(index + 1).padStart(2, "0")} of {total}
                </p>
                <div className="home2-system-head">
                  <p className="home2-channel-label">{channel.channelLabel}</p>
                  <h3 className="home2-channel-title">{channel.title}</h3>
                  <p className="meta">{channel.meta}</p>
                </div>
                {method.map((dimension) => (
                  <div
                    key={dimension.ordinal}
                    className={`home2-block home2-block--${dimension.key}`}
                  >
                    <p className="home2-block-head">
                      <span className="home2-dim-ord">{dimension.ordinal}</span>
                      <span className="home2-dim-label">{dimension.label}</span>
                    </p>
                    <ChannelAnswer channel={channel} dimension={dimension} />
                  </div>
                ))}
                <Link className="home2-morelink" href={channel.href}>
                  <span>{channel.caseStudyLabel}</span>
                </Link>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section
        className="home2-continuity"
        aria-labelledby="home2-continuity-label"
      >
        <div className="container">
          <div className="home2-continuity-grid">
            <div className="home2-continuity-aside">
              <p id="home2-continuity-label" className="home2-dim-label">
                {continuity.label}
              </p>
              <p className="home2-dim-gloss">{continuity.gloss}</p>
            </div>
            <p className="home2-continuity-claim">{continuity.claim}</p>
            <p className="home2-continuity-body">{continuity.body}</p>
            <Link className="home2-morelink" href={continuity.link.href}>
              <span>{continuity.link.label}</span>
            </Link>
            <div className="home2-continuity-figure">
              <QualifiedFigure figure={continuity.figure} />
            </div>
          </div>
        </div>
      </section>

      <section className="home2-routes">
        <div className="container">
          <nav
            className="home2-route-nav"
            aria-label="Explore the rest of the site"
          >
            <div className="home2-route-grid">
              {routes.map((route) => (
                <Link key={route.id} className="home2-route" href={route.href}>
                  <span className="home2-route-role">{route.role}</span>
                  <span className="home2-route-name">{route.name}</span>
                  <span className="home2-route-summary">{route.summary}</span>
                </Link>
              ))}
            </div>
          </nav>
          {availability ? (
            <p className="home2-availability">
              {availability} —{" "}
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
            </p>
          ) : null}
        </div>
      </section>

      <MethodReveal />
    </main>
  );
}
