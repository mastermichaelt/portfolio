"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CaseElsewhereLink } from "@/domain/project-case";

export interface RailItem {
  id: string;
  ordinal: string;
  navLabel: string;
}

/**
 * Sticky contents rail with a reading-line scroll-spy. The active block is the
 * last one whose top has passed the reading line (96px header offset + ~40px of
 * lead), read from true geometry every frame via a rAF-throttled rect scan.
 *
 * A rect scan — not an IntersectionObserver — is deliberate: an observer only
 * reports entries whose intersection changed, so it lags the reader when blocks
 * share the band and goes stale on reverse scroll. Reading rects each frame lets
 * reverse scroll and `scrollY = 0` self-correct.
 */
export function CaseStudyRail({
  items,
  elsewhere,
}: {
  items: RailItem[];
  elsewhere: CaseElsewhereLink[];
}) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    if (items.length === 0) return;

    const ids = items.map((item) => item.id);
    let frame = 0;

    // 96px header offset plus ~40px of reading lead.
    const line = 136;
    const sync = () => {
      frame = 0;
      let active = ids[0]!;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) active = id;
      }
      setActiveId(active);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(sync);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    sync();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav className="pcase-rail" aria-label="Contents">
      <p className="pcase-rail-heading">Contents</p>
      <div className="pcase-rail-list">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={
                active ? "pcase-rail-item is-active" : "pcase-rail-item"
              }
              aria-current={active ? "location" : undefined}
            >
              <span className="pcase-rail-bar" aria-hidden="true" />
              <span className="pcase-rail-text">
                <span className="pcase-rail-num">{item.ordinal}</span>
                {item.navLabel}
              </span>
            </a>
          );
        })}
      </div>
      <p className="pcase-rail-heading pcase-rail-heading-spaced">Elsewhere</p>
      <div className="pcase-rail-elsewhere">
        {elsewhere.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
