import Link from "next/link";
import type { Profile } from "@/domain/profile";
import { primaryNav } from "@/lib/nav";

export function SiteFooter({ profile }: { profile: Profile }) {
  const year = new Date().getFullYear();

  return (
    <footer className="pagefoot">
      <div className="container row-between">
        <p style={{ margin: 0 }}>
          © {year} {profile.name} · {profile.location}
        </p>
        <nav aria-label="Footer" className="row" style={{ gap: 20 }}>
          {primaryNav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
          <a href={profile.links.github} rel="noopener noreferrer">
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
