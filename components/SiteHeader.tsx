"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { isNavCurrent, primaryNav } from "@/lib/nav";

const DESKTOP_MIN = "(min-width: 921px)";

export function SiteHeader({ email }: { email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);

  // Close on route change (including browser back/forward) without an effect.
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_MIN);
    const clearWhenWide = () => {
      if (media.matches) setOpen(false);
    };
    media.addEventListener("change", clearWhenWide);
    return () => media.removeEventListener("change", clearWhenWide);
  }, []);

  const closeMenu = () => setOpen(false);

  return (
    <header className="topnav">
      <div className="container topnav-inner">
        <Link className="logo" href="/" onClick={closeMenu}>
          Michael Truong
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
        <div className="topnav-end">
          <a className="topnav-address" href={`mailto:${email}`}>
            {email}
          </a>
          <ThemeSwitch />
        </div>
        <button
          className="nav-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          Menu
        </button>
      </div>
      <div
        id="mobile-nav"
        className={open ? "mobile-nav open" : "mobile-nav"}
        hidden={!open}
      >
        {primaryNav.map((item) => (
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
        <a className="address" href={`mailto:${email}`} onClick={closeMenu}>
          {email}
        </a>
        {/* Intentionally does not close the sheet: toggling the theme does not
            navigate away, and keeping the sheet open shows the switch flip to
            its new destination state immediately. */}
        <ThemeSwitch variant="mobile" />
      </div>
    </header>
  );
}
