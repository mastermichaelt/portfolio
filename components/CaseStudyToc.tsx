"use client";

import { useEffect, useState } from "react";

export interface TocItem {
  id: string;
  title: string;
}

export function CaseStudyToc({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    if (items.length === 0) return;

    const sections = items
      .map((item) => {
        const el = document.getElementById(item.id);
        return el ? { id: item.id, el } : null;
      })
      .filter(
        (value): value is { id: string; el: HTMLElement } => value !== null,
      );

    if (sections.length === 0) return;

    const onScroll = () => {
      // Viewport-relative tops stay correct when ancestors use CSS transform
      // (e.g. `.fade-in`), unlike offsetTop which becomes transform-local.
      const marker = 120;
      let current = sections[0];
      for (const section of sections) {
        if (section.el.getBoundingClientRect().top <= marker) {
          current = section;
        }
      }
      setActiveId(current.id);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav className="toc card" aria-label="On this page">
      <p className="meta">On this page</p>
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={item.id === activeId ? "active" : undefined}
        >
          {item.title}
        </a>
      ))}
    </nav>
  );
}
