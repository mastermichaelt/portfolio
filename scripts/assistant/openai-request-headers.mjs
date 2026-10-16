import { loadEnvFiles } from "./db/load-env.mjs";

/**
 * Optional OpenAI project scope for `sk-proj-*` keys (`OpenAI-Project` header).
 * When unset, requests use Authorization only (legacy behavior).
 *
 * @returns {string | undefined}
 */
export function resolveOpenAIProjectId() {
  loadEnvFiles();
  const projectId = process.env.OPENAI_PROJECT_ID?.trim();
  return projectId || undefined;
}

/**
 * @param {string} apiKey
 * @param {string | undefined} [projectId]
 * @returns {Record<string, string>}
 */
export function buildOpenAIRequestHeaders(
  apiKey,
  projectId = resolveOpenAIProjectId(),
) {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (projectId) {
    headers["OpenAI-Project"] = projectId;
  }
  return headers;
}
