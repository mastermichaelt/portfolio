import type { Metadata } from "next";

import { AssistantExperience } from "@/components/assistant/AssistantExperience";
import { openGraphForCanonicalPath } from "@/lib/social-metadata";

export const metadata: Metadata = {
  title: "Assistant",
  description:
    "Ask questions about Michael Truong's published portfolio work — evidence-aware answers with claim-level attribution and citations.",
  alternates: {
    canonical: "/assistant",
  },
  openGraph: openGraphForCanonicalPath("/assistant"),
};

export default function AssistantPage() {
  return (
    <main id="content">
      <section className="section hero hero-compact">
        <div className="container">
          <AssistantExperience />
        </div>
      </section>
    </main>
  );
}
