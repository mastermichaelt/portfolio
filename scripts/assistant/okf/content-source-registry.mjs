/**
 * In-repo content modules indexed by OKF producers.
 * Update `sha256` when a module changes and producer output is refreshed.
 * `tests/okf-content-coverage.test.ts` fails on drift to force paired updates.
 */
export const OKF_CONTENT_SOURCES = [
  {
    path: "content/about.ts",
    producer: "scripts/assistant/okf/about-producer.mjs",
    sha256: "b9405442328eed2a5290adb4c8c1ffa3fee4f708a866436b13e4fab6961c9b8a",
  },
  {
    path: "content/articles.ts",
    producer: "scripts/assistant/okf/portfolio-producer.mjs",
    sha256: "688a2f737d022cc5f110eea4ece0152d452a99b1f6e6c8ba7477c960d52d3c55",
  },
  {
    path: "content/supporting-cases.ts",
    producer: "scripts/assistant/okf/portfolio-producer.mjs",
    sha256: "1d33a60ae04f9069ab66512f88c8f5d109e83ee26759a5cc470d2cc8557758e9",
  },
  {
    path: "content/project-cases.ts",
    producer: "scripts/assistant/okf/project-case-producer.mjs",
    sha256: "640c8442ae2a8e33eeffb22ce38e03087581caf380ec472c0eda54a967f84ad9",
  },
  {
    path: "content/ecosystem.ts",
    producer: "scripts/assistant/okf/ecosystem-producer.mjs",
    sha256: "f8c299a2aaffbc0cefbd2e7c3a18d6a681ea9a44bfd943fe462048fd81a01e78",
  },
];
