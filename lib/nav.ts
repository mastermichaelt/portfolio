export const primaryNav = [
  { href: "/projects", label: "Projects" },
  { href: "/articles", label: "Articles" },
  { href: "/assistant", label: "Assistant" },
  { href: "/about", label: "About" },
] as const;

export function isNavCurrent(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
