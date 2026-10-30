import type { Metadata } from "next";

import { AssistantExperience } from "@/components/assistant/AssistantExperience";
import { AssistantMaintenanceView } from "@/components/assistant/AssistantMaintenanceView";
import { resolveAssistantPublicEnabled } from "@/lib/assistant/api/config";
import { resolveEvaluationObservabilityConfig } from "@/lib/assistant/evaluation/config";
import { buildAssistantPageMetadata } from "@/lib/assistant/page-metadata";

/** Read ASSISTANT_PUBLIC_ENABLED at request time (align with dynamic generate API). */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const publicEnabled = resolveAssistantPublicEnabled();
  return buildAssistantPageMetadata(publicEnabled);
}

export default function AssistantPage() {
  const publicEnabled = resolveAssistantPublicEnabled();

  return (
    <main id="content">
      <section className="section hero hero-compact">
        <div className="container">
          {publicEnabled ? (
            <AssistantExperience
              evaluationDisclosure={resolveEvaluationObservabilityConfig()}
            />
          ) : (
            <AssistantMaintenanceView />
          )}
        </div>
      </section>
    </main>
  );
}
