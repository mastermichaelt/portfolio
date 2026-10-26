import type { Metadata } from "next";

import { NotFoundContent } from "@/components/NotFoundContent";

export const metadata: Metadata = {
  title: "Not found",
};

export default function SiteNotFound() {
  return <NotFoundContent />;
}
