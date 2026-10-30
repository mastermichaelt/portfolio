/**
 * In-repo content modules indexed by OKF producers.
 * Update `sha256` when a module changes and producer output is refreshed.
 * `tests/okf-content-coverage.test.ts` fails on drift to force paired updates.
 */
export const OKF_CONTENT_SOURCES = [
  {
    path: "content/about.ts",
    producer: "scripts/assistant/okf/about-producer.mjs",
    sha256: "676805aa3cea95df85c26249f74b98e32ba47c51c94840bbaebe6ef45aeb3761",
  },
  {
    path: "content/articles.ts",
    producer: "scripts/assistant/okf/portfolio-producer.mjs",
    sha256: "26240d4ce020a49959514fdbb27207588f1ff914197aa1d2e7050bf1e9777981",
  },
  {
    path: "content/supporting-cases.ts",
    producer: "scripts/assistant/okf/portfolio-producer.mjs",
    sha256: "1d33a60ae04f9069ab66512f88c8f5d109e83ee26759a5cc470d2cc8557758e9",
  },
  {
    path: "content/project-cases.ts",
    producer: "scripts/assistant/okf/project-case-producer.mjs",
    sha256: "bd42542e7299c2bb566e7f0cceebb6739ad9a2583bc2064ec61ce12b50abd83b",
  },
  {
    path: "content/ecosystem.ts",
    producer: "scripts/assistant/okf/ecosystem-producer.mjs",
    sha256: "f8c299a2aaffbc0cefbd2e7c3a18d6a681ea9a44bfd943fe462048fd81a01e78",
  },
];
