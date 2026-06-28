/**
 * Fee splitting (FR-22, FR-53).
 *
 * Given a gross price (integer yen) and a platform take-rate, computes the
 * platform fee and the advisor payout. The split is always shown to the seeker
 * (FR-22), so it must be exact and reproducible (NFR-05).
 *
 * Invariant guaranteed by this module:
 *   platformFee + advisorPayout === amount   (no yen is created or lost)
 */

import { PLATFORM_FEE_MAX_RATE, PLATFORM_FEE_MIN_RATE } from "../config/constants.js";

export interface FeeBreakdown {
  /** Gross amount paid by the seeker (integer yen). */
  amount: number;
  /** Effective take-rate applied, echoed back for display/audit. */
  feeRate: number;
  /** Platform commission (integer yen). */
  platformFee: number;
  /** Amount the advisor receives (integer yen). */
  advisorPayout: number;
}

export class FeeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeeError";
  }
}

function assertValidAmount(amount: number): void {
  if (!Number.isInteger(amount)) {
    throw new FeeError(`amount must be an integer number of yen, got ${amount}`);
  }
  if (amount < 0) {
    throw new FeeError(`amount must be non-negative, got ${amount}`);
  }
}

function assertValidFeeRate(feeRate: number): void {
  if (!Number.isFinite(feeRate)) {
    throw new FeeError(`feeRate must be a finite number, got ${feeRate}`);
  }
  if (feeRate < PLATFORM_FEE_MIN_RATE || feeRate > PLATFORM_FEE_MAX_RATE) {
    throw new FeeError(
      `feeRate ${feeRate} out of allowed bounds [${PLATFORM_FEE_MIN_RATE}, ${PLATFORM_FEE_MAX_RATE}]`,
    );
  }
}

/**
 * Round half up to the nearest integer yen. `Math.round` already rounds .5 up
 * for positive numbers; we keep this explicit so the rounding policy is auditable.
 */
function roundYen(value: number): number {
  return Math.floor(value + 0.5);
}

/**
 * Compute the fee split for a transaction.
 *
 * The platform fee is rounded to the nearest yen; the advisor payout is then
 * derived by subtraction so the two always reconcile exactly to `amount`.
 */
export function computeFeeBreakdown(amount: number, feeRate: number): FeeBreakdown {
  assertValidAmount(amount);
  assertValidFeeRate(feeRate);

  const platformFee = roundYen(amount * feeRate);
  const advisorPayout = amount - platformFee;

  return { amount, feeRate, platformFee, advisorPayout };
}
