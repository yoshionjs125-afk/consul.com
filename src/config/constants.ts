/**
 * Centralized business constants.
 *
 * NFR-02 forbids magic numbers scattered across the codebase. Every tunable
 * business rule (fee bounds, auto-release window, enumerations) lives here so a
 * human can audit and change them in one safe place.
 */

/** Platform take-rate bounds. Requirements §1: "運営は取引手数料15〜20%". */
export const PLATFORM_FEE_MIN_RATE = 0.15;
export const PLATFORM_FEE_MAX_RATE = 0.2;

/** Settlement currency. Phase 1 is JP-only; amounts are integer yen (no minor unit). */
export const CURRENCY = "jpy" as const;

/**
 * Days after which a held payment auto-releases to the advisor if the seeker
 * neither accepts nor disputes (FR-52). Conservative default; tune in Phase 2.
 */
export const AUTO_RELEASE_DAYS = 7;

/** Advisor ranks (FR-13). Order is meaningful: standard < pro < senior. */
export const ADVISOR_RANKS = ["standard", "pro", "senior"] as const;
export type AdvisorRank = (typeof ADVISOR_RANKS)[number];

/** Credential verification states (FR-12). */
export const CREDENTIAL_STATUSES = ["pending", "verified", "rejected"] as const;
export type CredentialStatus = (typeof CREDENTIAL_STATUSES)[number];

/**
 * Offering kinds (FR-20). `diagnosis` is the deliverable / cash point; the
 * others are consultation entry points.
 */
export const OFFERING_KINDS = ["chat", "phone", "online", "diagnosis"] as const;
export type OfferingKind = (typeof OFFERING_KINDS)[number];

/** Phase-1 service verticals (categories). Logic must stay category-agnostic (NFR-04). */
export const CATEGORY_SLUGS = ["rental", "purchase", "custom_home"] as const;
export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

/**
 * Per-line-item assessment in a neutral diagnosis (FR-43).
 * over = above market, standard = fair, negotiate = room to negotiate.
 */
export const ASSESSMENTS = ["over", "standard", "negotiate"] as const;
export type Assessment = (typeof ASSESSMENTS)[number];

/** Escrow lifecycle states (FR-51). */
export const ESCROW_STATES = [
  "authorized",
  "held",
  "released",
  "refunded",
  "disputed",
] as const;
export type EscrowState = (typeof ESCROW_STATES)[number];

/** UI color tokens for assessment display (FR-44). Kept semantic, not literal hex. */
export const ASSESSMENT_COLOR_TOKEN: Record<Assessment, "danger" | "neutral" | "warning"> = {
  over: "danger",
  standard: "neutral",
  negotiate: "warning",
};
