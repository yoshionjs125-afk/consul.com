/**
 * Escrow state machine (FR-51, FR-52).
 *
 * Lifecycle (requirements §6.6):
 *   authorized → held → released | refunded | disputed
 *   disputed   → released | refunded
 *
 * `released` and `refunded` are terminal. Every transition the system performs
 * must go through {@link applyEscrowTransition} so illegal jumps are impossible
 * and every change is auditable (NFR-05, NFR-08).
 */

import { AUTO_RELEASE_DAYS, type EscrowState } from "../config/constants.js";

/** What triggered a transition — recorded for the audit log (FR-53, NFR-08). */
export type EscrowTrigger =
  | "capture" // authorized -> held (funds captured/held)
  | "accept" // held -> released (seeker confirmed fulfillment, FR-52)
  | "auto_release" // held -> released (timeout, FR-52)
  | "dispute" // held -> disputed (FR-73)
  | "refund" // held|disputed -> refunded (FR-54)
  | "resolve_release" // disputed -> released
  | "resolve_refund"; // disputed -> refunded

interface TransitionRule {
  from: EscrowState;
  to: EscrowState;
  trigger: EscrowTrigger;
}

const TRANSITIONS: readonly TransitionRule[] = [
  { from: "authorized", to: "held", trigger: "capture" },
  { from: "held", to: "released", trigger: "accept" },
  { from: "held", to: "released", trigger: "auto_release" },
  { from: "held", to: "disputed", trigger: "dispute" },
  { from: "held", to: "refunded", trigger: "refund" },
  { from: "disputed", to: "released", trigger: "resolve_release" },
  { from: "disputed", to: "refunded", trigger: "resolve_refund" },
];

const TERMINAL_STATES: ReadonlySet<EscrowState> = new Set(["released", "refunded"]);

export class EscrowTransitionError extends Error {
  constructor(
    public readonly from: EscrowState,
    public readonly trigger: EscrowTrigger,
  ) {
    super(`Illegal escrow transition: cannot apply "${trigger}" from state "${from}"`);
    this.name = "EscrowTransitionError";
  }
}

export function isTerminalEscrowState(state: EscrowState): boolean {
  return TERMINAL_STATES.has(state);
}

/** All triggers that are legal from a given state (useful for building UIs). */
export function allowedTriggers(from: EscrowState): EscrowTrigger[] {
  return TRANSITIONS.filter((t) => t.from === from).map((t) => t.trigger);
}

export function canApply(from: EscrowState, trigger: EscrowTrigger): boolean {
  return TRANSITIONS.some((t) => t.from === from && t.trigger === trigger);
}

/**
 * Apply a transition, returning the resulting state. Throws
 * {@link EscrowTransitionError} if the transition is not allowed.
 */
export function applyEscrowTransition(from: EscrowState, trigger: EscrowTrigger): EscrowState {
  const rule = TRANSITIONS.find((t) => t.from === from && t.trigger === trigger);
  if (!rule) {
    throw new EscrowTransitionError(from, trigger);
  }
  return rule.to;
}

/**
 * Whether a held payment is eligible for auto-release (FR-52).
 * @param heldSince  When the payment entered the `held` state.
 * @param now        Current time (injected for deterministic tests).
 */
export function isAutoReleaseDue(heldSince: Date, now: Date): boolean {
  const elapsedMs = now.getTime() - heldSince.getTime();
  const windowMs = AUTO_RELEASE_DAYS * 24 * 60 * 60 * 1000;
  return elapsedMs >= windowMs;
}
