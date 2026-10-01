import { describe, expect, it } from "vitest";
import { articles } from "@/content/articles";
import { codenamesExperience } from "@/content/codenames-experience";
import { projectCases } from "@/content/project-cases";
import type { TileTeam } from "@/domain/codenames-experience";

/**
 * The Codenames scroll experience is a presentation of verified content. These
 * tests lock the facts the design handoff called out as most-corrected: the
 * board distribution, the two-role semantics, the verbatim contract lines, the
 * single-sourced figures, and the dynamically-resolved field-report door.
 */
describe("codenames scroll experience content", () => {
  it("carries the shipped 4×6 board: 9 red · 8 blue · 7 neutral · 1 assassin", () => {
    const { board } = codenamesExperience;
    expect(board).toHaveLength(25);

    const count = (team: TileTeam) =>
      board.filter((tile) => tile.team === team).length;
    expect(count("red")).toBe(9);
    expect(count("blue")).toBe(8);
    expect(count("neutral")).toBe(7);
    expect(count("assassin")).toBe(1);

    // STADIUM is the one already-revealed tile on the spymaster board.
    const revealed = board.filter((tile) => tile.revealed);
    expect(revealed).toHaveLength(1);
    expect(revealed[0]?.word).toBe("STADIUM");
  });

  it("gives every tile its own zh-Hans token (its own word, not a translation)", () => {
    for (const tile of codenamesExperience.board) {
      expect(tile.word.trim().length).toBeGreaterThan(0);
      expect(tile.zh.trim().length).toBeGreaterThan(0);
    }
    // Spot-check a known pairing from the extended zh-Hans pool.
    const bar = codenamesExperience.board.find((tile) => tile.word === "BAR");
    expect(bar?.zh).toBe("北极");
  });

  it("keeps the five engineering beats in narrative order", () => {
    expect(codenamesExperience.beats.map((beat) => beat.kind)).toEqual([
      "reasoning",
      "legality",
      "migration",
      "language",
      "operation",
    ]);
  });

  it("keeps the two AI roles' legality examples valid for each domain", () => {
    const legality = codenamesExperience.beats.find(
      (beat) => beat.kind === "legality",
    );
    if (legality?.kind !== "legality") throw new Error("no legality beat");
    // The spymaster cannot clue a codename; the guesser cannot call a non-board word.
    const spymaster = legality.rows.find((row) => row.role === "Spymaster");
    const guesser = legality.rows.find((row) => row.role === "Guesser");
    expect(spymaster?.token).toBe("BEIJING");
    expect(guesser?.token).toBe("EMPIRE");
    expect(legality.contract).toBe(
      "Valid JSON is not a legal move — the validator decides.",
    );
  });

  it("frames model change as an architectural gap, never a controlled A/B", () => {
    const migration = codenamesExperience.beats.find(
      (beat) => beat.kind === "migration",
    );
    if (migration?.kind !== "migration") throw new Error("no migration beat");
    expect(migration.actuallyWas).toMatch(/architectural gap/i);
    expect(JSON.stringify(migration)).not.toMatch(
      /A\/B|control group|same clue/i,
    );
  });

  it("keeps the language abstraction and never claims translation", () => {
    const language = codenamesExperience.beats.find(
      (beat) => beat.kind === "language",
    );
    if (language?.kind !== "language") throw new Error("no language beat");
    expect(language.formula).toEqual(["word set", "language", "playable pool"]);
    expect(language.note).toMatch(/not translations of the English board/i);
    // Narrative copy must not encode a seam direction: the seam rotates on
    // tablet and disappears on mobile, so "the left"/"above" etc. would be wrong
    // in at least one approved composition (Addendum 02 §4).
    expect(`${language.statement} ${language.note}`).not.toMatch(
      /\b(the left|the right|above|below)\b/i,
    );
    // The mobile crop is the extended zh-Hans pool with its own teams.
    expect(language.mobileTiles).toHaveLength(4);
    expect(language.mobileTiles.map((tile) => tile.zh)).toEqual([
      "北极",
      "显微镜",
      "挡风玻璃",
      "望远镜",
    ]);
  });

  it("shows the three qualified figures, single-sourced from the case", () => {
    expect(codenamesExperience.figures.map((figure) => figure.value)).toEqual([
      "175+",
      "#1",
      "350",
    ]);

    // Each figure is the very object from the codenames ProjectCase, so scope
    // strings cannot drift between the two surfaces.
    const caseFigures = projectCases
      .find((entry) => entry.slug === "codenames-ai")!
      .blocks.flatMap((block) => block.figures ?? []);
    for (const figure of codenamesExperience.figures) {
      expect(caseFigures).toContain(figure);
    }
  });

  it("resolves the door's four field reports dynamically by relatedProjectSlug", () => {
    const expected = articles
      .filter((article) => article.relatedProjectSlug === "codenames-ai")
      .map((article) => article.url);
    expect(expected).toHaveLength(4);

    const reports = codenamesExperience.doors.reasoning.reports;
    expect(reports).toHaveLength(4);
    expect(new Set(reports.map((report) => report.url))).toEqual(
      new Set(expected),
    );
    // The persistence report is included as the fourth.
    expect(
      reports.some((report) => /The board came back/i.test(report.title)),
    ).toBe(true);
    expect(codenamesExperience.doors.reasoning.title).toBe(
      "Four field reports",
    );
  });

  it("carries the corrected Solo description on the experience door", () => {
    expect(codenamesExperience.doors.experience.body).toBe(
      "Solo runs both AI roles: an AI Spymaster proposes the clue, AI operatives call the board. Two Player keeps the spymaster human.",
    );
    expect(codenamesExperience.doors.inspect.absence).toBe(
      "Private repository · no public URL",
    );
  });

  it("presents identity and premise at rest (Addendum 01)", () => {
    const { premise } = codenamesExperience;
    expect(premise.kicker).toBe("The premise");
    expect(premise.statement).toMatch(/word game of clues/i);
    // The premise explains the game to a visitor who does not know Codenames.
    expect(premise.lead).toMatch(/deployed/i);
    // The mobile identity block folds the premise to one shorter sentence.
    expect(premise.mobileSentence).toMatch(/Solo hands both sides to an AI/i);
    expect(premise.mobileSentence.length).toBeLessThan(
      premise.statement.length,
    );
  });

  it("promotes the turn to the opening card and reasoning to card 02", () => {
    expect(codenamesExperience.openingCardId).toBe("01 / the turn");
    const reasoning = codenamesExperience.beats.find(
      (beat) => beat.kind === "reasoning",
    );
    expect(reasoning?.cardId).toBe("02 / reasoning");
  });
});
