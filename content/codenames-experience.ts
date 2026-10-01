import { articles } from "@/content/articles";
import { projectCases } from "@/content/project-cases";
import type {
  BoardTile,
  CodenamesExperience,
  DoorReport,
} from "@/domain/codenames-experience";
import type { CaseFigure } from "@/domain/project-case";

/**
 * The Codenames AI scroll experience ("1c — two screens, one game"). Copy is
 * transcribed verbatim from the approved design handoff prototype and verified
 * against the live repos; see `domain/codenames-experience.ts` for the shape.
 *
 * Two facts stay single-source rather than being re-typed here:
 *   - the three qualified figures are pulled from the `codenamesAi`
 *     `ProjectCase`, so a figure has one home and cannot drift;
 *   - the field-report door resolves its links from `content/articles.ts` by
 *     `relatedProjectSlug`, so titles and URLs are never hard-coded.
 */

/** The 25 spymaster-view tiles: 9 red · 8 blue · 7 neutral · 1 assassin. */
const board: BoardTile[] = [
  { word: "BAR", zh: "北极", team: "blue" },
  { word: "CLUB", zh: "木匠", team: "blue" },
  { word: "OCTOPUS", zh: "壁炉", team: "red" },
  { word: "INDIA", zh: "相机", team: "neutral" },
  { word: "SUPERHERO", zh: "显微镜", team: "red" },
  { word: "BANK", zh: "路口", team: "red" },
  { word: "WATER", zh: "挡风玻璃", team: "neutral" },
  { word: "GLOVE", zh: "液体", team: "red" },
  { word: "DINOSAUR", zh: "味道", team: "blue" },
  { word: "SWITCH", zh: "听力", team: "blue" },
  { word: "BEIJING", zh: "秤", team: "red" },
  { word: "PIRATE", zh: "统治者", team: "blue" },
  { word: "WIND", zh: "温度计", team: "neutral" },
  { word: "WALL", zh: "望远镜", team: "red" },
  { word: "RULER", zh: "微波", team: "neutral" },
  { word: "FIRE", zh: "婴儿床", team: "blue" },
  { word: "RABBIT", zh: "墓志铭", team: "neutral" },
  { word: "VAN", zh: "救护车", team: "red" },
  { word: "SPINE", zh: "靴子", team: "neutral" },
  { word: "EGYPT", zh: "船", team: "neutral" },
  { word: "CHEST", zh: "唱诗班", team: "red" },
  { word: "TRUNK", zh: "剧院", team: "red" },
  { word: "STADIUM", zh: "乌云", team: "blue", revealed: true },
  { word: "HORN", zh: "霜", team: "blue" },
  { word: "OPERA", zh: "雪崩", team: "assassin" },
];

/** Field reports tagged to this project, resolved from articles (exactly four). */
const RELATED_SLUG = "codenames-ai";
const doorReports: DoorReport[] = articles
  .filter((article) => article.relatedProjectSlug === RELATED_SLUG)
  .map((article) => ({ title: article.title, url: article.url }));

/** Small-integer to word, so the door heading tracks the resolved report count
 *  instead of hardcoding "Four" beside a dynamically-filtered list. */
const COUNT_WORDS = [
  "No",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
];
const countWord = (n: number) => COUNT_WORDS[n] ?? String(n);

/** The three qualified figures, pulled from the co-primary case so they don't drift. */
const caseFigures: CaseFigure[] = (
  projectCases.find((entry) => entry.slug === "codenames-ai")?.blocks ?? []
).flatMap((block) => block.figures ?? []);

function figureByValue(value: string): CaseFigure {
  const found = caseFigures.find((figure) => figure.value === value);
  if (!found) {
    throw new Error(
      `Codenames experience references unknown case figure: ${value}`,
    );
  }
  return found;
}

export const codenamesExperience: CodenamesExperience = {
  slug: "codenames-ai",
  eyebrow: "CH 01 · Independent · 2026 – present · live product",
  title: "A real Codenames game, and the AI is a player.",
  externalUrl: "https://codenames-ai.com/",
  externalLabel: "codenames-ai.com ↗",
  openingCardId: "01 / the turn",
  premise: {
    kicker: "The premise",
    statement:
      "Codenames is a word game of clues and constrained guesses. Solo mode hands both sides of it to an AI.",
    lead: "It is deployed, it has players, and the AI is a participant rather than a feature bolted to the side of one.",
    affordanceLabel: "Scroll",
    affordanceText: "The AI takes a turn, then what it took to make that work.",
    mobileSentence:
      "Codenames is a word game of clues and constrained guesses. Solo hands both sides to an AI.",
  },
  relay: {
    mode: "Solo vs AI",
    spymaster: "AI Spymaster",
    guesser: "AI Guesser",
    clue: "EMPIRE · two links",
    callFirst: "BEIJING",
    callBoth: "BEIJING, WALL",
    statusPlanning: "Planning",
    statusEvaluating: "Operatives are evaluating the clue",
    statusVerdict:
      "They hit BEIJING, then WALL — used every call they were willing to make.",
  },
  board,
  beats: [
    {
      kind: "reasoning",
      id: "reasoning",
      bandId: "01 / reasoning",
      cardId: "02 / reasoning",
      roleChip: "AI Spymaster → AI Guesser",
      kicker: "It plays both sides",
      statement:
        "In solo the AI is both roles. Only the clue passes between them.",
      intent: "BEIJING · WALL",
      clue: "EMPIRE · two links",
      handover: "the only thing handed over ↓",
      calls: [
        { word: "BEIJING", tier: "Sure", pct: 92 },
        { word: "WALL", tier: "Likely", pct: 71 },
      ],
      discounted: {
        word: "EGYPT",
        note: "a weaker read alongside the other target.",
      },
    },
    {
      kind: "legality",
      id: "legality",
      bandId: "02 / legality",
      cardId: "03 / legality",
      roleChip: "Both roles",
      kicker: "It has to play legally",
      statement:
        "Each role can propose something illegal. Neither one gets to act on it.",
      rows: [
        {
          role: "Spymaster",
          token: "BEIJING",
          note: "a codename cannot be the clue",
        },
        {
          role: "Guesser",
          token: "EMPIRE",
          note: "not a word on this board",
        },
      ],
      accepted: "EMPIRE · two links → BEIJING, WALL",
      contract: "Valid JSON is not a legal move — the validator decides.",
      reportUrl:
        "https://dev.to/michaeltruong/schema-first-prompt-second-valid-json-wasnt-enough-3nhm",
    },
    {
      kind: "migration",
      id: "migration",
      bandId: "03 / migration",
      cardId: "04 / model change",
      roleChip: "Both roles",
      kicker: "The model underneath changes",
      statement: "A new model generation is not a dependency upgrade.",
      lookedLike: "A drop in the quality of the AI's play.",
      actuallyWas:
        "An architectural gap. Contract checks and live telemetry surfaced it before it became a silent gameplay regression.",
      contract:
        "A migration ships when the contracts still hold under live traffic, not when the model is newer.",
      reportUrl:
        "https://dev.to/michaeltruong/model-experiments-became-an-architectural-stress-test-3gc0",
    },
    {
      kind: "language",
      id: "language",
      bandId: "04 / language",
      cardId: "05 / language",
      roleChip: "Board · both roles",
      kicker: "Another language",
      statement: "The board just changed. The game did not.",
      formula: ["word set", "language", "playable pool"],
      classicLine:
        "Classic — one playable token per concept, in English and in Simplified Chinese.",
      extendedLine:
        "Extended — authored per language, independent pools. No cross-language concept layer.",
      contract:
        "A language is supported when its own playable word set is written down and validated — not when its interface is translated.",
      note: "This board is the extended zh-Hans pool. Its words are its own, not translations of the English board.",
      mobileTiles: [
        { zh: "北极", team: "red" },
        { zh: "显微镜", team: "red" },
        { zh: "挡风玻璃", team: "neutral" },
        { zh: "望远镜", team: "blue" },
      ],
    },
    {
      kind: "operation",
      id: "operation",
      bandId: "05 / operation",
      cardId: "07 / the product",
      roleChip: "Whole product",
      kicker: "People actually play it",
      statement: "Not a demo. A deployed product emitting real sessions.",
      events: [
        "game_started",
        "ai_clue_generated",
        "ai_guess_generated",
        "field_report_shown",
        "reasoning_expanded",
        "game_finished",
      ],
      note: "Which sessions count is a question the instrumentation had to answer before any number was publishable.",
      reportUrl:
        "https://dev.to/michaeltruong/active-players-looked-real-until-we-asked-which-sessions-counted-11em",
    },
  ],
  statement:
    "One product surface. Five different kinds of engineering behind it.",
  evidenceLabel: "Qualified evidence",
  evidenceTechnical: "03 / live product",
  figures: [figureByValue("175+"), figureByValue("#1"), figureByValue("350")],
  deeperLabel: "Where to go deeper",
  deeperTechnical: "04 / optional depth",
  doors: {
    experience: {
      label: "Experience it",
      title: "Play Codenames AI",
      body: "Solo runs both AI roles: an AI Spymaster proposes the clue, AI operatives call the board. Two Player keeps the spymaster human.",
      modes:
        "Solo vs AI · Solo vs JUDGE — safer, more cautious reasoning · Solo vs STRANGE — simulates outcomes before choosing · Two Player",
      ctaHref: "https://codenames-ai.com/",
      ctaLabel: "codenames-ai.com ↗",
    },
    reasoning: {
      label: "Read the reasoning",
      title: `${countWord(doorReports.length)} field reports`,
      reports: doorReports,
    },
    inspect: {
      label: "Inspect the build",
      title: "Technical depth",
      body: "Architecture and flow figures, the judge and validation path, the word-set model, and how this system connects to the others.",
      absence: "Private repository · no public URL",
    },
  },
};
