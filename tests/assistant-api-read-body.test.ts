import { describe, expect, it } from "vitest";

import { readBoundedUtf8Body } from "@/lib/assistant/api/read-request-body";

describe("readBoundedUtf8Body", () => {
  it("rejects bodies over the byte limit without Content-Length", async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('{"question":"'));
        controller.enqueue(encoder.encode("x".repeat(40)));
        controller.enqueue(encoder.encode('"}'));
        controller.close();
      },
    });

    const request = new Request("http://localhost/api/assistant/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: stream,
      duplex: "half",
    } as RequestInit);

    const result = await readBoundedUtf8Body(request, 32);
    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) {
      expect(result.status).toBe(413);
    }
  });

  it("counts UTF-8 bytes for multibyte characters", async () => {
    const body = JSON.stringify({ question: "😀" });
    const byteLength = new TextEncoder().encode(body).length;
    const request = new Request("http://localhost/api/assistant/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    const within = await readBoundedUtf8Body(request, byteLength);
    expect(typeof within).toBe("string");

    const tight = await readBoundedUtf8Body(
      new Request("http://localhost/", { method: "POST", body }),
      byteLength - 1,
    );
    expect(tight).toBeInstanceOf(Response);
    if (tight instanceof Response) {
      expect(tight.status).toBe(413);
    }
  });

  it("returns a safe JSON error when the stream is interrupted", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("{"));
        controller.error(new Error("connection reset"));
      },
    });

    const request = new Request("http://localhost/", {
      method: "POST",
      body: stream,
      duplex: "half",
    } as RequestInit);

    const result = await readBoundedUtf8Body(request, 1024);
    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) {
      expect(result.status).toBe(400);
      const body = await result.json();
      expect(body.error.code).toBe("invalid_json");
    }
  });
});
