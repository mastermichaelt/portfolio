"use client";

import type { ComponentPropsWithoutRef, MouseEvent, ReactNode } from "react";

import { captureEvent } from "@/lib/posthog";

type ExternalLinkProps = Omit<
  ComponentPropsWithoutRef<"a">,
  "href" | "target" | "rel"
> & {
  href: string;
  children: ReactNode;
};

const NEW_TAB_HINT = "(opens in new tab)";

function hasNewTabHint(label: string): boolean {
  return /opens in new (tab|window)/i.test(label);
}

function withNewTabHint(label: string): string {
  const trimmed = label.trim();
  if (!trimmed || hasNewTabHint(trimmed)) return trimmed;
  return `${trimmed} (${NEW_TAB_HINT})`;
}

function resolveAccessibleName(
  children: ReactNode,
  ariaLabel: string | undefined,
): string | undefined {
  const fromAria = ariaLabel?.trim();
  if (fromAria) return withNewTabHint(fromAria);
  if (typeof children === "string") {
    const trimmed = children.trim();
    return trimmed ? withNewTabHint(trimmed) : undefined;
  }
  return undefined;
}

function resolveLinkLabel(
  children: ReactNode,
  ariaLabel: string | undefined,
): string | undefined {
  const accessibleName = resolveAccessibleName(children, ariaLabel);
  if (!accessibleName) return undefined;
  return accessibleName.replace(/\s*\(opens in new tab\)\s*$/i, "").trim();
}

/** External destinations open in a new tab so portfolio browsing is preserved. */
export function ExternalLink({
  href,
  children,
  onClick,
  "aria-label": ariaLabel,
  ...props
}: ExternalLinkProps) {
  const accessibleName = resolveAccessibleName(children, ariaLabel);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const linkLabel = resolveLinkLabel(children, ariaLabel);
    captureEvent("outbound_link", {
      href,
      ...(linkLabel ? { link_label: linkLabel } : {}),
    });
    onClick?.(event);
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={accessibleName}
      {...props}
      onClick={handleClick}
    >
      {children}
      {accessibleName ? null : <span className="sr-only">{NEW_TAB_HINT}</span>}
    </a>
  );
}
