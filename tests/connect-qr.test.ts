import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { LINKEDIN_PROFILE_URL } from "@/lib/connect";
import { decodeQrFromSvgFile } from "@/lib/connect-qr-decode";

const qrSvgPath = resolve(
  import.meta.dirname,
  "../public/linkedin-connect-qr.svg",
);

describe("linkedin-connect-qr.svg", () => {
  it("decodes to the canonical LinkedIn profile URL", async () => {
    const decoded = await decodeQrFromSvgFile(qrSvgPath);
    expect(decoded).toBe(LINKEDIN_PROFILE_URL);
  });
});
