import { SingularityPrototype } from "@/components/experiments/singularity-wake/SingularityPrototype";
import { homepage } from "@/content/homepage";
import { profile } from "@/content/profile";

/**
 * Singularity Wake visual prototype (Concept D, scenes I–II).
 *
 * **SSR floor:** With JavaScript disabled or under `prefers-reduced-motion`, the
 * route renders resolved hero copy and a center amber mark (desktop) or static
 * scene plates (mobile). Scroll pin, scrub, and WebGL never arm.
 *
 * Production `/` is unchanged; this route is removed or redirected before launch.
 */
export default function HomeHeroPrototypePage() {
  return (
    <SingularityPrototype
      name={profile.name}
      title={homepage.hero.title}
      lead={homepage.hero.lead}
    />
  );
}
