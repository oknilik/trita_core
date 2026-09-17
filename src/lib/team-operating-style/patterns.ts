import { OPERATING_CATALOGUE, type CatalogueKey } from "./catalogue";
import type { Localized } from "./questions";

/** Binary storage keys remain stable; public names come from the shared catalogue. */
export const OPERATING_PATTERNS = Object.fromEntries(
  Object.entries(OPERATING_CATALOGUE).map(([key, value]) => [key, value.name]),
) as Record<CatalogueKey, Localized>;
export type OperatingPatternCode = CatalogueKey;
