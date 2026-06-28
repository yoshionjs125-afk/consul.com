/**
 * Price-band validation (FR-21).
 *
 * The platform (admin) fixes a price range per (rank × category × kind) — the
 * "価格バンド". An advisor may only publish an offering whose price falls inside
 * the matching band. This module is the single source of truth for that check;
 * UI and API both call it so the rule cannot drift (NFR-02, NFR-04).
 */

import type { AdvisorRank, CategorySlug, OfferingKind } from "../config/constants.js";

/** A price band as configured by admin (FR-71). Prices are integer yen, inclusive. */
export interface PriceBand {
  rank: AdvisorRank;
  category: CategorySlug;
  kind: OfferingKind;
  minPrice: number;
  maxPrice: number;
}

export type PriceBandKey = `${AdvisorRank}:${CategorySlug}:${OfferingKind}`;

export function priceBandKey(rank: AdvisorRank, category: CategorySlug, kind: OfferingKind): PriceBandKey {
  return `${rank}:${category}:${kind}`;
}

export type PriceValidation =
  | { ok: true }
  | { ok: false; reason: "not_integer" | "below_min" | "above_max"; band: PriceBand };

/**
 * Validate a proposed offering price against its band.
 * Returns a structured result rather than throwing so callers can map the
 * `reason` to a localized message.
 */
export function validateOfferingPrice(price: number, band: PriceBand): PriceValidation {
  if (!Number.isInteger(price)) {
    return { ok: false, reason: "not_integer", band };
  }
  if (price < band.minPrice) {
    return { ok: false, reason: "below_min", band };
  }
  if (price > band.maxPrice) {
    return { ok: false, reason: "above_max", band };
  }
  return { ok: true };
}

/** Look up the band for a given (rank, category, kind) from a configured set. */
export function findPriceBand(
  bands: readonly PriceBand[],
  rank: AdvisorRank,
  category: CategorySlug,
  kind: OfferingKind,
): PriceBand | undefined {
  return bands.find((b) => b.rank === rank && b.category === category && b.kind === kind);
}
