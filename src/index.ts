/**
 * Public barrel for the platform core (vertical-independent business logic).
 *
 * Everything exported here is pure and unit-tested. The data-access, auth, and
 * Stripe webhook layers (Phase 1 remaining work) should depend on these modules
 * rather than re-implementing any rule (NFR-02, NFR-05).
 */

export * from "./config/constants.js";
export * from "./domain/fees.js";
export * from "./domain/priceBands.js";
export * from "./domain/escrow.js";
export * from "./domain/diagnosis.js";
export * from "./diagnosis-templates/index.js";
export type * from "./types/database.js";
