import { describe, expect, it } from "vitest";
import { PLATFORM_FEE_MAX_RATE, PLATFORM_FEE_MIN_RATE } from "../config/constants.js";
import { computeFeeBreakdown, FeeError } from "./fees.js";

describe("computeFeeBreakdown", () => {
  it("splits a clean amount at the minimum rate", () => {
    const r = computeFeeBreakdown(10000, 0.15);
    expect(r.platformFee).toBe(1500);
    expect(r.advisorPayout).toBe(8500);
  });

  it("splits at the maximum rate", () => {
    const r = computeFeeBreakdown(10000, 0.2);
    expect(r.platformFee).toBe(2000);
    expect(r.advisorPayout).toBe(8000);
  });

  it("always reconciles: platformFee + advisorPayout === amount", () => {
    for (const amount of [1, 7, 99, 333, 4999, 12345, 1_000_000]) {
      for (const rate of [0.15, 0.17, 0.1825, 0.2]) {
        const r = computeFeeBreakdown(amount, rate);
        expect(r.platformFee + r.advisorPayout).toBe(amount);
        expect(Number.isInteger(r.platformFee)).toBe(true);
        expect(Number.isInteger(r.advisorPayout)).toBe(true);
      }
    }
  });

  it("rounds the platform fee half up", () => {
    // 333 * 0.15 = 49.95 -> 50
    expect(computeFeeBreakdown(333, 0.15).platformFee).toBe(50);
    // 4999 * 0.2 = 999.8 -> 1000
    expect(computeFeeBreakdown(4999, 0.2).platformFee).toBe(1000);
  });

  it("handles a zero amount", () => {
    const r = computeFeeBreakdown(0, 0.15);
    expect(r.platformFee).toBe(0);
    expect(r.advisorPayout).toBe(0);
  });

  it("rejects non-integer amounts", () => {
    expect(() => computeFeeBreakdown(100.5, 0.15)).toThrow(FeeError);
  });

  it("rejects negative amounts", () => {
    expect(() => computeFeeBreakdown(-1, 0.15)).toThrow(FeeError);
  });

  it("rejects fee rates outside the allowed band", () => {
    expect(() => computeFeeBreakdown(10000, PLATFORM_FEE_MIN_RATE - 0.01)).toThrow(FeeError);
    expect(() => computeFeeBreakdown(10000, PLATFORM_FEE_MAX_RATE + 0.01)).toThrow(FeeError);
    expect(() => computeFeeBreakdown(10000, Number.NaN)).toThrow(FeeError);
  });

  it("accepts the inclusive boundaries of the fee band", () => {
    expect(() => computeFeeBreakdown(10000, PLATFORM_FEE_MIN_RATE)).not.toThrow();
    expect(() => computeFeeBreakdown(10000, PLATFORM_FEE_MAX_RATE)).not.toThrow();
  });
});
