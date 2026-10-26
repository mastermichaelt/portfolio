import type { Metadata } from "next";

import { NotFoundContent } from "@/components/NotFoundContent";
import { SiteChrome } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Not found",
};

export default function GlobalNotFound() {
  return (
    <SiteChrome>
      <NotFoundContent />
    </SiteChrome>
  );
}
