import type { PortfolioRepository } from "@/repositories/portfolio-repository";
import { StaticPortfolioRepository } from "@/repositories/static-portfolio-repository";

/** Pages depend on the repository interface, not a concrete adapter. */
export function getPortfolioRepository(): PortfolioRepository {
  return new StaticPortfolioRepository();
}
