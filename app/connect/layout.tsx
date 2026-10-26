import type { Metadata } from "next";

import { CONNECT_PAGE_DESCRIPTION, CONNECT_PAGE_TITLE } from "@/lib/connect";
import { openGraphForCanonicalPath } from "@/lib/social-metadata";

export const metadata: Metadata = {
  title: CONNECT_PAGE_TITLE,
  description: CONNECT_PAGE_DESCRIPTION,
  alternates: {
    canonical: "/connect",
  },
  openGraph: openGraphForCanonicalPath("/connect", {
    title: CONNECT_PAGE_TITLE,
    description: CONNECT_PAGE_DESCRIPTION,
  }),
};

export default function ConnectLayout({ children }: LayoutProps<"/connect">) {
  return children;
}
