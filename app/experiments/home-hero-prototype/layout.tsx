import type { Metadata } from "next";
import "@/app/styles/singularity-prototype.css";

export const metadata: Metadata = {
  title: "Singularity Wake — visual prototype",
  robots: { index: false, follow: false },
};

export default function SingularityPrototypeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
