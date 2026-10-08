import fs from "node:fs";
import path from "node:path";

import { CORPUS_ROOT } from "../okf/constants.mjs";

/**
 * @param {string} [corpusRoot]
 * @returns {string}
 */
export function readOkfBundleSha256(corpusRoot = CORPUS_ROOT) {
  const absoluteRoot = path.isAbsolute(corpusRoot)
    ? corpusRoot
    : path.join(process.cwd(), corpusRoot);
  const manifestPath = path.join(absoluteRoot, "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `OKF manifest missing at ${manifestPath}; run npm run okf:build first`,
    );
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const bundleHash = manifest.outputs?.bundle_sha256;
  if (typeof bundleHash !== "string" || !bundleHash) {
    throw new Error(
      `OKF manifest at ${manifestPath} is missing outputs.bundle_sha256`,
    );
  }
  return bundleHash;
}
