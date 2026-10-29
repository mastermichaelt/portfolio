import type { AssistantPublicAnswer } from "@/lib/assistant/api/public-envelope";

type PacketEntry = {
  unit_id?: string;
  evidence_id?: string;
};

type EvidencePacketLike = {
  entries?: PacketEntry[];
};

export function extractEvidenceRefs(options: {
  packet: EvidencePacketLike;
  answer?: Pick<AssistantPublicAnswer, "claims" | "citations">;
}): {
  evidenceUnitIds: string[];
  evidenceIds: string[];
  retrievedEvidenceCount: number;
} {
  const unitIds = new Set<string>();
  const evidenceIds = new Set<string>();

  for (const entry of options.packet.entries ?? []) {
    if (typeof entry.unit_id === "string" && entry.unit_id.trim()) {
      unitIds.add(entry.unit_id.trim());
    }
    if (typeof entry.evidence_id === "string" && entry.evidence_id.trim()) {
      evidenceIds.add(entry.evidence_id.trim());
    }
  }

  const answer = options.answer;
  if (answer) {
    for (const citation of answer.citations ?? []) {
      if (citation.evidence_id?.trim()) {
        evidenceIds.add(citation.evidence_id.trim());
      }
      if (citation.unit_id?.trim()) {
        unitIds.add(citation.unit_id.trim());
      }
    }
    for (const claim of answer.claims ?? []) {
      for (const citation of claim.citations ?? []) {
        if (citation.evidence_id?.trim()) {
          evidenceIds.add(citation.evidence_id.trim());
        }
        if (citation.unit_id?.trim()) {
          unitIds.add(citation.unit_id.trim());
        }
      }
    }
  }

  return {
    evidenceUnitIds: [...unitIds].sort(),
    evidenceIds: [...evidenceIds].sort(),
    retrievedEvidenceCount: options.packet.entries?.length ?? 0,
  };
}
