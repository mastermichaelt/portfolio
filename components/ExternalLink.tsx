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

function resolveLinkLabel(
  children: ReactNode,
  ariaLabel: string | undefined,
): string | undefined {
  const fromAria = ariaLabel?.trim();
  if (fromAria) return fromAria;
  if (typeof children === "string") {
    const trimmed = children.trim();
    return trimmed || undefined;
  }
  return undefined;
}

/** External destinations open in a new tab so portfolio browsing is preserved. */
export function ExternalLink({
  href,
  children,
  onClick,
  ...props
}: ExternalLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const linkLabel = resolveLinkLabel(children, props["aria-label"]);
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
      {...props}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
