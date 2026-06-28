import { describe, expect, it } from "vitest";
import { AUTO_RELEASE_DAYS } from "../config/constants.js";
import {
  allowedTriggers,
  applyEscrowTransition,
  canApply,
  EscrowTransitionError,
  isAutoReleaseDue,
  isTerminalEscrowState,
} from "./escrow.js";

describe("applyEscrowTransition — happy paths", () => {
  it("captures authorized funds into held", () => {
    expect(applyEscrowTransition("authorized", "capture")).toBe("held");
  });

  it("releases on seeker accept", () => {
    expect(applyEscrowTransition("held", "accept")).toBe("released");
  });

  it("releases on auto-release timeout", () => {
    expect(applyEscrowTransition("held", "auto_release")).toBe("released");
  });

  it("moves to disputed and resolves either way", () => {
    expect(applyEscrowTransition("held", "dispute")).toBe("disputed");
    expect(applyEscrowTransition("disputed", "resolve_release")).toBe("released");
    expect(applyEscrowTransition("disputed", "resolve_refund")).toBe("refunded");
  });

  it("refunds a held payment", () => {
    expect(applyEscrowTransition("held", "refund")).toBe("refunded");
  });
});

describe("applyEscrowTransition — illegal transitions", () => {
  it("cannot capture an already-held payment", () => {
    expect(() => applyEscrowTransition("held", "capture")).toThrow(EscrowTransitionError);
  });

  it("cannot accept from authorized (must be held first)", () => {
    expect(() => applyEscrowTransition("authorized", "accept")).toThrow(EscrowTransitionError);
  });

  it("cannot transition out of terminal states", () => {
    expect(() => applyEscrowTransition("released", "refund")).toThrow(EscrowTransitionError);
    expect(() => applyEscrowTransition("refunded", "accept")).toThrow(EscrowTransitionError);
  });
});

describe("state metadata helpers", () => {
  it("identifies terminal states", () => {
    expect(isTerminalEscrowState("released")).toBe(true);
    expect(isTerminalEscrowState("refunded")).toBe(true);
    expect(isTerminalEscrowState("held")).toBe(false);
  });

  it("lists allowed triggers per state", () => {
    expect(allowedTriggers("authorized")).toEqual(["capture"]);
    expect(allowedTriggers("held").sort()).toEqual(["accept", "auto_release", "dispute", "refund"]);
    expect(allowedTriggers("released")).toEqual([]);
  });

  it("canApply agrees with applyEscrowTransition", () => {
    expect(canApply("held", "accept")).toBe(true);
    expect(canApply("released", "accept")).toBe(false);
  });
});

describe("isAutoReleaseDue", () => {
  const heldSince = new Date("2026-06-01T00:00:00Z");

  it("is not due before the window elapses", () => {
    const now = new Date(heldSince.getTime() + (AUTO_RELEASE_DAYS - 1) * 86_400_000);
    expect(isAutoReleaseDue(heldSince, now)).toBe(false);
  });

  it("is due exactly at the window boundary", () => {
    const now = new Date(heldSince.getTime() + AUTO_RELEASE_DAYS * 86_400_000);
    expect(isAutoReleaseDue(heldSince, now)).toBe(true);
  });

  it("is due after the window", () => {
    const now = new Date(heldSince.getTime() + (AUTO_RELEASE_DAYS + 3) * 86_400_000);
    expect(isAutoReleaseDue(heldSince, now)).toBe(true);
  });
});
