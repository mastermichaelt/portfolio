import type { ComponentPropsWithoutRef, ReactNode } from "react";

type ExternalLinkProps = Omit<
  ComponentPropsWithoutRef<"a">,
  "href" | "target" | "rel"
> & {
  href: string;
  children: ReactNode;
};

/** External destinations open in a new tab so portfolio browsing is preserved. */
export function ExternalLink({ href, children, ...props }: ExternalLinkProps) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  );
}
