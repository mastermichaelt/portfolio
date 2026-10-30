import type { Metadata } from "next";

import { AssistantExperience } from "@/components/assistant/AssistantExperience";
import { AssistantMaintenanceView } from "@/components/assistant/AssistantMaintenanceView";
import { resolveAssistantApiConfig } from "@/lib/assistant/api/config";
import { resolveEvaluationObservabilityConfig } from "@/lib/assistant/evaluation/config";
import { openGraphForCanonicalPath } from "@/lib/social-metadata";

/** Read ASSISTANT_PUBLIC_ENABLED at request time (align with dynamic generate API). */
export const dynamic = "force-dynamic";

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
  const { publicEnabled } = resolveAssistantApiConfig();
  const evaluationDisclosure = resolveEvaluationObservabilityConfig();

  return (
    <main id="content">
      <section className="section hero hero-compact">
        <div className="container">
          {publicEnabled ? (
            <AssistantExperience evaluationDisclosure={evaluationDisclosure} />
          ) : (
            <AssistantMaintenanceView />
          )}
        </div>
      </section>
    </main>
  );
}
