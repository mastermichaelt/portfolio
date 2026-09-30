"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { ExternalLink } from "@/components/ExternalLink";
import { QualifiedFigure } from "@/components/QualifiedFigure";
import type {
  Beat,
  BoardTile,
  CodenamesExperience,
  LanguageBeat,
} from "@/domain/codenames-experience";
import { armCodenamesStage } from "@/components/projects/codenames-choreography";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * The Codenames AI scroll-driven case study ("1c — two screens, one game").
 *
 * The left/product surface renders in the shipped game's own register (canvas,
 * rounded shadowed tiles, team colours, the blue primary); everything else is
 * the portfolio register (`DESIGN.md`). The 1px seam between them is where the
 * two systems meet and is deliberately not harmonised.
 *
 * This module renders the *resolved* document — board revealed, relay resolved,
 * every beat panel in normal flow — which is exactly the state a reader gets
 * with no JavaScript, with reduced motion, or on a viewport too short to pin.
 * The scroll choreography (a client concern) arms and drives it on top of this;
 * the markup here is the floor it degrades to. Styles: app/styles/codenames-case.css.
 */

const RING_WORDS = new Set(["BEIJING", "WALL"]);

/** One board tile. The resolved state reveals and rings the turn's targets. */
function Tile({
  tile,
  showTeam = true,
}: {
  tile: BoardTile;
  showTeam?: boolean;
}) {
  const revealed = tile.revealed || RING_WORDS.has(tile.word);
  const ring = RING_WORDS.has(tile.word);
  return (
    <span
      className="cn-tile"
      data-team={tile.team}
      data-w={tile.word}
      {...(revealed ? { "data-rv": "" } : {})}
      {...(ring ? { "data-ring": "red" } : {})}
    >
      <span className="cn-tw">
        <span className="cn-en">{tile.word}</span>
        <span className="cn-zh">{tile.zh}</span>
      </span>
      {showTeam ? (
        <span className="cn-tt">
          {tile.team === "assassin"
            ? "Assassin"
            : tile.team.charAt(0).toUpperCase() + tile.team.slice(1)}
        </span>
      ) : null}
    </span>
  );
}

/** The full 4×6 spymaster board (the assassin spans the final full-width row). */
function Board({
  board,
  lang = "en",
  className = "cn-board",
}: {
  board: BoardTile[];
  lang?: "en" | "zh";
  className?: string;
}) {
  return (
    <div className={className} data-lang={lang} data-cn-board>
      {board.map((tile) => (
        <Tile key={tile.word} tile={tile} />
      ))}
    </div>
  );
}

/** The relay above both panes: acting role → clue → calls, plus status. */
function Relay({ experience }: { experience: CodenamesExperience }) {
  const { relay } = experience;
  return (
    <div className="cn-relay" data-cn-relay>
      <span className="cn-relay-mode">
        <span aria-hidden="true" className="cn-relay-glyph">
          ◈
        </span>
        {relay.mode}
      </span>
      <span className="cn-relay-div" aria-hidden="true" />
      <span className="cn-gchip" data-relay="sm">
        {relay.spymaster}
      </span>
      <span className="cn-garrow" data-relay="a1" aria-hidden="true">
        →
      </span>
      <span className="cn-clue" data-relay="clue">
        {relay.clue}
      </span>
      <span className="cn-garrow" data-relay="a2" aria-hidden="true">
        →
      </span>
      <span className="cn-gchip" data-relay="gu">
        {relay.guesser}
      </span>
      <span className="cn-garrow" data-relay="a3" aria-hidden="true">
        →
      </span>
      <span className="cn-calls" data-relay="calls">
        {relay.callBoth}
      </span>
      <span className="cn-relay-div" aria-hidden="true" />
      <span className="cn-status mono" data-relay-status>
        {relay.statusVerdict}
      </span>
    </div>
  );
}

/** The kicker line above each engineering panel: a role chip, then plain text. */
function Kicker({ beat }: { beat: Beat }) {
  return (
    <p className="cn-pkick">
      <span className="cn-rchip">{beat.roleChip}</span>
      {beat.kicker}
    </p>
  );
}

function ReportLink({ url, label }: { url: string; label: string }) {
  return (
    <ExternalLink className="cn-report mono" href={url}>
      {label} ↗
    </ExternalLink>
  );
}

/** One engineering panel — bespoke markup per beat, all copy from the model. */
function BeatPanel({ beat }: { beat: Beat }) {
  return (
    <div className="cn-panel" data-beat={beat.id}>
      <div className="cn-panel-head">
        <Kicker beat={beat} />
        <p className="cn-pstat">{beat.statement}</p>
      </div>
      {beat.kind === "reasoning" ? (
        <div className="cn-relaycard">
          <div className="cn-relaycard-head">
            <p className="cn-label mono">AI spymaster · intent</p>
            <p className="cn-intent mono">{beat.intent}</p>
          </div>
          <div className="cn-relaycard-clue">
            <span className="cn-clue">{beat.clue}</span>
            <span className="cn-label mono">{beat.handover}</span>
          </div>
          <div className="cn-relaycard-calls">
            <p className="cn-label mono">AI guesser · calls</p>
            <div className="cn-calls-list">
              {beat.calls.map((call) => (
                <div key={call.word} className="cn-call-row">
                  <span className="cn-call-word mono">{call.word}</span>
                  <span className="cn-call-bar">
                    <span
                      className="cn-call-fill"
                      style={{ width: `${call.pct}%` }}
                    />
                  </span>
                  <span className="cn-call-tier mono">{call.tier}</span>
                </div>
              ))}
            </div>
            <p className="cn-call-note">
              Discounted{" "}
              <span className="cn-call-word mono">{beat.discounted.word}</span>{" "}
              — {beat.discounted.note}
            </p>
          </div>
        </div>
      ) : null}

      {beat.kind === "legality" ? (
        <>
          <div className="cn-rows">
            {beat.rows.map((row) => (
              <div key={row.role} className="cn-row">
                <span className="cn-row-role mono">{row.role}</span>
                <span className="cn-row-token mono">{row.token}</span>
                <span className="cn-row-note mono">{row.note}</span>
              </div>
            ))}
            <div className="cn-row cn-row--accepted">
              <span className="cn-row-role mono">Accepted</span>
              <span className="cn-row-accepted mono">{beat.accepted}</span>
            </div>
          </div>
          <div className="cn-panel-foot">
            <p className="cn-pcon">{beat.contract}</p>
            <ReportLink
              url={beat.reportUrl}
              label="Schema first, prompt second"
            />
          </div>
        </>
      ) : null}

      {beat.kind === "migration" ? (
        <>
          <div className="cn-cells">
            <div className="cn-cell">
              <p className="cn-label mono">Looked like</p>
              <p className="cn-cell-body">{beat.lookedLike}</p>
            </div>
            <div className="cn-cell">
              <p className="cn-label cn-label--accent mono">Actually was</p>
              <p className="cn-cell-body">{beat.actuallyWas}</p>
            </div>
          </div>
          <div className="cn-panel-foot">
            <p className="cn-pcon">{beat.contract}</p>
            <ReportLink
              url={beat.reportUrl}
              label="Model experiments as a stress test"
            />
          </div>
        </>
      ) : null}

      {beat.kind === "language" ? (
        <>
          <div className="cn-formula mono">
            {beat.formula.map((term, index) => (
              <span key={term} className="cn-formula-part">
                {index > 0 ? (
                  <span
                    className={
                      index === beat.formula.length - 1
                        ? "cn-formula-op cn-formula-op--accent"
                        : "cn-formula-op"
                    }
                    aria-hidden="true"
                  >
                    {index === beat.formula.length - 1 ? "→" : "×"}
                  </span>
                ) : null}
                <span
                  className={
                    index === beat.formula.length - 1
                      ? "cn-formula-term cn-formula-term--strong"
                      : "cn-formula-term"
                  }
                >
                  {term}
                </span>
              </span>
            ))}
          </div>
          <div className="cn-langlines">
            <p className="cn-langline mono">{beat.classicLine}</p>
            <p className="cn-langline mono">{beat.extendedLine}</p>
          </div>
          <p className="cn-pcon">{beat.contract}</p>
          <p className="cn-note mono">{beat.note}</p>
        </>
      ) : null}

      {beat.kind === "operation" ? (
        <>
          <div className="cn-events">
            {beat.events.map((event) => (
              <p key={event} className="cn-event mono">
                {event}
              </p>
            ))}
          </div>
          <p className="cn-op-note">{beat.note}</p>
          <ReportLink url={beat.reportUrl} label="Which sessions counted" />
        </>
      ) : null}
    </div>
  );
}

/** A small board crop (legality / language cards), never a shrunk full board. */
function CropRow({
  tiles,
  columns,
}: {
  tiles: { key: string; node: React.ReactNode }[];
  columns: number;
}) {
  return (
    <div
      className="cn-board cn-board--crop"
      data-cols={columns}
      style={{ ["--cn-cols" as string]: String(columns) }}
    >
      {tiles.map((tile) => tile.node)}
    </div>
  );
}

/** The mobile beat card — the product state paired with the engineering idea. */
function MobileCard({ beat, board }: { beat: Beat; board: BoardTile[] }) {
  const byWord = (word: string) => board.find((tile) => tile.word === word)!;

  return (
    <section className="cn-card">
      <div className="cn-card-head">
        <div className="cn-card-idline">
          <span className="cn-relay-mode">
            <span aria-hidden="true" className="cn-relay-glyph">
              ◈
            </span>
            Solo vs AI
          </span>
          <span className="cn-relay-div" aria-hidden="true" />
          <span className="cn-card-id mono">{beat.cardId}</span>
        </div>
        <div className="cn-card-chips">
          <span className="cn-rchip">{beat.roleChip}</span>
        </div>
      </div>

      {beat.kind === "operation" ? (
        <div className="cn-card-product">
          <Board board={board} className="cn-board cn-board--mobile" />
        </div>
      ) : null}

      {beat.kind === "legality" ? (
        <div className="cn-card-product cn-card-product--ruled">
          <p className="cn-label mono">What reached the board</p>
          <CropRow
            columns={3}
            tiles={["BEIJING", "WALL", "EGYPT"].map((word) => ({
              key: word,
              node: <Tile key={word} tile={byWord(word)} />,
            }))}
          />
        </div>
      ) : null}

      {beat.kind === "migration" ? (
        <div className="cn-card-product cn-card-product--ruled">
          <p className="cn-freeze mono">
            The player&apos;s side has not moved.
          </p>
        </div>
      ) : null}

      {beat.kind === "language" ? (
        <div className="cn-card-product cn-card-product--ruled">
          <div className="cn-langswap mono">
            <span className="cn-gchip cn-gchip--muted">EN</span>
            <span className="cn-garrow" aria-hidden="true">
              →
            </span>
            <span className="cn-gchip cn-gchip--act">中文</span>
          </div>
          <CropRow
            columns={2}
            tiles={(beat as LanguageBeat).mobileTiles.map((tile) => ({
              key: tile.zh,
              node: (
                <span key={tile.zh} className="cn-tile" data-team={tile.team}>
                  <span className="cn-tw">
                    <span className="cn-zh cn-zh--only">{tile.zh}</span>
                  </span>
                  <span className="cn-tt">
                    {tile.team.charAt(0).toUpperCase() + tile.team.slice(1)}
                  </span>
                </span>
              ),
            }))}
          />
        </div>
      ) : null}

      <div className="cn-card-body">
        <BeatPanel beat={beat} />
      </div>
    </section>
  );
}

/**
 * The mobile opening card (Addendum 01). There is one surface at rest on mobile,
 * so identity and the premise (compressed to one sentence) fold into card 01's
 * portfolio block rather than becoming a card 00 before the product. The board
 * is pre-turn at rest; the turn plays as the card is scrolled (the choreography
 * resets and drives it). With no JS / reduced motion this renders the turn
 * resolved, which is the specified fallback.
 */
function OpeningCard({ experience }: { experience: CodenamesExperience }) {
  const { relay, premise } = experience;
  return (
    <section className="cn-card cn-card--opening" data-cn-open>
      <div className="cn-opening-identity">
        <p className="cn-eyebrow mono">{experience.eyebrow}</p>
        <h1 className="cn-card-h1">{experience.title}</h1>
        <p className="cn-opening-premise">{premise.mobileSentence}</p>
      </div>
      <div className="cn-card-head cn-open-head">
        <div className="cn-card-idline">
          <span className="cn-relay-mode">
            <span aria-hidden="true" className="cn-relay-glyph">
              ◈
            </span>
            {relay.mode}
          </span>
          <span className="cn-relay-div" aria-hidden="true" />
          <span className="cn-card-id mono">{experience.openingCardId}</span>
        </div>
        <div className="cn-card-chips">
          <span className="cn-gchip cn-gchip--act">{relay.spymaster}</span>
          <span className="cn-garrow" data-cn-open-arrow aria-hidden="true">
            →
          </span>
          <span className="cn-clue" data-cn-open-clue>
            {relay.clue}
          </span>
        </div>
      </div>
      <div className="cn-card-product">
        <Board board={experience.board} className="cn-board cn-board--mobile" />
        <p className="cn-open-status mono" data-cn-open-status>
          {relay.statusVerdict}
        </p>
      </div>
      <div className="cn-premise-scroll cn-open-scroll">
        <span className="cn-premise-scroll-label mono">
          {premise.affordanceLabel}
        </span>
        <span className="cn-premise-scroll-text mono">
          {premise.affordanceText}
        </span>
      </div>
    </section>
  );
}

export function CodenamesCaseExperience({
  experience,
}: {
  experience: CodenamesExperience;
}) {
  const { doors, relay } = experience;
  const scopeRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () =>
      armCodenamesStage(scopeRef.current, {
        statusPlanning: relay.statusPlanning,
        statusEvaluating: relay.statusEvaluating,
        statusVerdict: relay.statusVerdict,
        callFirst: relay.callFirst,
        callBoth: relay.callBoth,
        bandIds: experience.beats.map((beat) => beat.bandId),
      }),
    { scope: scopeRef },
  );

  return (
    <main id="content" className="cn">
      <div className="cn-scope" data-codenames-scope ref={scopeRef}>
        {/* Desktop / tablet: the pinned two-surface stage. Renders resolved
            (in flow) until the choreography arms it. */}
        <section className="cn-stage" aria-label="Codenames AI, at a glance">
          <div className="cn-frame" data-cn-stage>
            <div className="cn-band">
              <div className="cn-band-top">
                <div className="cn-band-title">
                  <div className="cn-head" data-cn-head>
                    <p className="cn-eyebrow mono">{experience.eyebrow}</p>
                    <h1 className="cn-h1">{experience.title}</h1>
                  </div>
                  <p
                    className="cn-bandid mono"
                    data-cn-bandid
                    aria-hidden="true"
                  >
                    {experience.beats[0].bandId}
                  </p>
                </div>
                <ExternalLink
                  className="cn-band-link mono"
                  href={experience.externalUrl}
                >
                  {experience.externalLabel}
                </ExternalLink>
              </div>
              <Relay experience={experience} />
            </div>

            <div className="cn-stagebody">
              {/* Identity's companion: the premise fills the right pane at
                  rest so it is never empty, then yields to 01 / reasoning. In
                  the resolved (unarmed) document it is the first block, above
                  the board. */}
              <div className="cn-premise" data-cn-premise>
                <p className="cn-pkick">{experience.premise.kicker}</p>
                <p className="cn-pstat">{experience.premise.statement}</p>
                <p className="cn-premise-lead">{experience.premise.lead}</p>
                <div className="cn-premise-scroll">
                  <span className="cn-premise-scroll-label mono">
                    {experience.premise.affordanceLabel}
                  </span>
                  <span className="cn-premise-scroll-text mono">
                    {experience.premise.affordanceText}
                  </span>
                </div>
              </div>

              <div className="cn-split">
                <div className="cn-left" data-cn-left>
                  <div className="cn-ghosts" data-cn-ghosts aria-hidden="true">
                    <span className="cn-ghost" />
                    <span className="cn-ghost" />
                    <span className="cn-ghost" />
                    <span className="cn-ghost" />
                    <span className="cn-ghost" />
                  </div>
                  <div className="cn-boardwrap" data-cn-boardwrap>
                    <Board board={experience.board} />
                    <p
                      className="cn-freeze mono"
                      data-cn-freeze
                      aria-hidden="true"
                    >
                      The player&apos;s side has not moved.
                    </p>
                  </div>
                </div>
                <div className="cn-seam" aria-hidden="true" />
                <div className="cn-right" data-cn-right>
                  {experience.beats.map((beat) => (
                    <BeatPanel key={beat.id} beat={beat} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile: the opening card, then one scroll-snap card per beat. */}
        <section className="cn-cards" aria-hidden="true">
          <OpeningCard experience={experience} />
          {experience.beats.map((beat) => (
            <MobileCard key={beat.id} beat={beat} board={experience.board} />
          ))}
        </section>

        {/* Shared ending, in normal flow for every composition. */}
        <section className="cn-statement">
          <div className="container">
            <p className="cn-statement-text">{experience.statement}</p>
          </div>
        </section>

        <section className="cn-evidence">
          <div className="container">
            <div className="sechead">
              <p className="cn-sechead-label">{experience.evidenceLabel}</p>
              <p className="cn-sechead-tech mono">
                {experience.evidenceTechnical}
              </p>
            </div>
            <div className="hgrid cn-figgrid">
              {experience.figures.map((figure) => (
                <div key={figure.name} className="cn-figcell">
                  <QualifiedFigure figure={figure} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="cn-doors">
          <div className="container">
            <div className="sechead">
              <p className="cn-sechead-label">{experience.deeperLabel}</p>
              <p className="cn-sechead-tech mono">
                {experience.deeperTechnical}
              </p>
            </div>
            <div className="hgrid cn-doorgrid">
              <div className="cn-door">
                <p className="cn-door-label mono">{doors.experience.label}</p>
                <p className="cn-door-title">{doors.experience.title}</p>
                <p className="cn-door-body">{doors.experience.body}</p>
                <p className="cn-door-modes mono">{doors.experience.modes}</p>
                <ExternalLink
                  className="cn-door-cta mono"
                  href={doors.experience.ctaHref}
                >
                  {doors.experience.ctaLabel}
                </ExternalLink>
              </div>

              <div className="cn-door">
                <p className="cn-door-label mono">{doors.reasoning.label}</p>
                <p className="cn-door-title">{doors.reasoning.title}</p>
                <div className="cn-door-reports">
                  {doors.reasoning.reports.map((report) => (
                    <ExternalLink
                      key={report.url}
                      className="cn-door-report"
                      href={report.url}
                    >
                      {report.title} ↗
                    </ExternalLink>
                  ))}
                </div>
              </div>

              <div className="cn-door">
                <p className="cn-door-label mono">{doors.inspect.label}</p>
                <p className="cn-door-title">{doors.inspect.title}</p>
                <p className="cn-door-body">{doors.inspect.body}</p>
                <p className="cn-door-absence figure-scope">
                  {doors.inspect.absence}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
