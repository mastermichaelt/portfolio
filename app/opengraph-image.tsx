import { getSiteHostname } from "@/lib/site";
import { renderSocialCard } from "@/lib/social-card";

export const alt = "Michael Truong · Making uncertain systems dependable";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

/** Default social preview for LinkedIn / Open Graph / Twitter large cards. */
export default function OpenGraphImage() {
  return renderSocialCard({
    kicker: "Senior Software Engineer · AI Product Engineer · Sydney",
    headline: "Michael Truong",
    body: "Making uncertain systems dependable — experimentation, measurement, verification, and evidence-backed field reports.",
    footer: getSiteHostname(),
  });
}
