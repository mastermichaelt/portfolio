import { jsonError } from "./errors";

function concatChunks(chunks: Uint8Array[], totalBytes: number): Uint8Array {
  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

/**
 * Read the request body as UTF-8 text with a hard byte limit (not UTF-16 length).
 * Cancels the stream when the limit is exceeded.
 */
export async function readBoundedUtf8Body(
  request: Request,
  maxBodyBytes: number,
): Promise<Response | string> {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const length = Number(contentLength);
    if (Number.isFinite(length) && length > maxBodyBytes) {
      return jsonError(413, "request_too_large", "Request body is too large.");
    }
  }

  if (!request.body) {
    return "";
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (!value || value.byteLength === 0) {
        continue;
      }

      totalBytes += value.byteLength;
      if (totalBytes > maxBodyBytes) {
        await reader.cancel();
        return jsonError(
          413,
          "request_too_large",
          "Request body is too large.",
        );
      }

      chunks.push(value);
    }
  } catch {
    await reader.cancel().catch(() => {});
    return jsonError(400, "invalid_json", "Request body could not be read.");
  }

  if (totalBytes === 0) {
    return "";
  }

  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    return decoder.decode(concatChunks(chunks, totalBytes));
  } catch {
    return jsonError(400, "invalid_json", "Request body must be valid UTF-8.");
  }
}
