"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isNavCurrent, primaryNav } from "@/lib/nav";

const DESKTOP_MIN = "(min-width: 921px)";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_MIN);
    const clearWhenWide = () => {
      if (media.matches) setOpen(false);
    };
    media.addEventListener("change", clearWhenWide);
    return () => media.removeEventListener("change", clearWhenWide);
  }, []);

  const closeMenu = () => setOpen(false);
  // Mobile menu keeps Contact as the CTA to /about — omit the duplicate About row.
  const mobileNav = primaryNav.filter((item) => item.href !== "/about");

  return (
    <header className="topnav">
      <div className="container topnav-inner">
        <Link className="logo" href="/" onClick={closeMenu}>
          Michael Truong <em>· systems</em>
        </Link>
        <nav aria-label="Primary">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={
                isNavCurrent(pathname, item.href) ? "page" : undefined
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link className="btn btn-primary topnav-cta" href="/about">
          Contact
        </Link>
        <button
          className="nav-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
        </button>
      </div>
      <div
        id="mobile-nav"
        className={open ? "mobile-nav open" : "mobile-nav"}
        hidden={!open}
      >
        {mobileNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={closeMenu}
            aria-current={
              isNavCurrent(pathname, item.href) ? "page" : undefined
            }
          >
            {item.label}
          </Link>
        ))}
        <Link
          className="btn btn-primary mobile-nav-cta"
          href="/about"
          onClick={closeMenu}
          aria-current={isNavCurrent(pathname, "/about") ? "page" : undefined}
        >
          Contact
        </Link>
      </div>
    </header>
  );
}
