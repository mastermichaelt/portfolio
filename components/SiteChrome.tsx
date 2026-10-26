import { PersonJsonLd } from "@/components/PersonJsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getPortfolioRepository } from "@/lib/portfolio";

export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const profile = await getPortfolioRepository().getProfile();

  return (
    <>
      <PersonJsonLd profile={profile} />
      <SiteHeader email={profile.email} />
      {children}
      <SiteFooter profile={profile} />
    </>
  );
}
