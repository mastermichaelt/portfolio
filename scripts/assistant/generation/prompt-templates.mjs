/** @typedef {import("./evidence-packet.mjs").EvidencePacket} EvidencePacket */
/** @typedef {import("./evidence-packet.mjs").EvidencePacketEntry} EvidencePacketEntry */

export const ASSISTANT_GENERATION_SYSTEM_INSTRUCTIONS = `You answer visitor questions using only the evidence packet supplied in the user message.
Cite sources with structured citations that reference evidence_id and unit_id from the packet.
If the packet does not support an answer, set support_level to "none" and explain the gap briefly.`;

/**
 * @param {EvidencePacketEntry} entry
 * @returns {string}
 */
export function formatEvidenceEntryBlock(entry) {
  return `[${entry.evidence_id}] unit_id=${entry.unit_id} okf_concept_id=${entry.okf_concept_id}\n${entry.retrieval_text}`;
}

/**
 * @param {EvidencePacket} packet
 * @returns {string}
 */
export function formatEvidencePacketForPrompt(packet) {
  const header = `assembly_mode=${packet.assembly_mode} truncated=${packet.truncated} character_count=${packet.character_count}`;
  const blocks = packet.entries.map((entry) => formatEvidenceEntryBlock(entry));
  return `${header}\n\n${blocks.join("\n\n---\n\n")}`;
}

/**
 * @param {string} question
 * @param {EvidencePacket} packet
 * @returns {{ system: string, user: string }}
 */
export function buildGenerationMessages(question, packet) {
  const trimmedQuestion = question.trim();
  if (!trimmedQuestion) {
    throw new Error("question must be a non-empty string");
  }

  return {
    system: ASSISTANT_GENERATION_SYSTEM_INSTRUCTIONS,
    user: `Question:\n${trimmedQuestion}\n\nEvidence packet:\n${formatEvidencePacketForPrompt(packet)}`,
  };
}
