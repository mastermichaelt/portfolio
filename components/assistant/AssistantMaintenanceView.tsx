import { ASSISTANT_PUBLIC_DISABLED_MESSAGE } from "@/lib/assistant/api/config";

export function AssistantMaintenanceView() {
  return (
    <div className="assistant-shell assistant-maintenance fade-in">
      <header className="assistant-intro">
        <p className="eyebrow">Assistant · maintenance</p>
        <h1>Temporarily unavailable</h1>
        <p className="lead measure">{ASSISTANT_PUBLIC_DISABLED_MESSAGE}</p>
      </header>
    </div>
  );
}
