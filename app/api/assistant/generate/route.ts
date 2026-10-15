import { handleAssistantGeneratePost } from "@/lib/assistant/api/handle-generate-post";

/** Node.js + Fluid Compute — pgvector retrieval via shared assistant DATABASE_URL. */
export const runtime = "nodejs";

/** Align with default ASSISTANT_GENERATION_TIMEOUT_MS (120s); Vercel allows up to 300s. */
export const maxDuration = 120;

export async function POST(request: Request): Promise<Response> {
  return handleAssistantGeneratePost(request);
}

export function GET(): Response {
  return new Response(null, {
    status: 405,
    headers: { Allow: "POST" },
  });
}
