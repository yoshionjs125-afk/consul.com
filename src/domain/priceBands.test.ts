import { describe, expect, it } from "vitest";
import { findPriceBand, priceBandKey, validateOfferingPrice, type PriceBand } from "./priceBands.js";

const band: PriceBand = {
  rank: "pro",
  category: "rental",
  kind: "chat",
  minPrice: 3000,
  maxPrice: 8000,
};

describe("validateOfferingPrice", () => {
  it("accepts a price inside the band", () => {
    expect(validateOfferingPrice(5000, band)).toEqual({ ok: true });
  });

  it("accepts the inclusive boundaries", () => {
    expect(validateOfferingPrice(3000, band).ok).toBe(true);
    expect(validateOfferingPrice(8000, band).ok).toBe(true);
  });

  it("rejects a price below the minimum", () => {
    const r = validateOfferingPrice(2999, band);
    expect(r).toMatchObject({ ok: false, reason: "below_min" });
  });

  it("rejects a price above the maximum", () => {
    const r = validateOfferingPrice(8001, band);
    expect(r).toMatchObject({ ok: false, reason: "above_max" });
  });

  it("rejects a non-integer price", () => {
    const r = validateOfferingPrice(5000.5, band);
    expect(r).toMatchObject({ ok: false, reason: "not_integer" });
  });
});

describe("findPriceBand", () => {
  const bands: PriceBand[] = [
    band,
    { rank: "senior", category: "purchase", kind: "diagnosis", minPrice: 20000, maxPrice: 50000 },
  ];

  it("finds a matching band", () => {
    expect(findPriceBand(bands, "senior", "purchase", "diagnosis")?.maxPrice).toBe(50000);
  });

  it("returns undefined when no band matches", () => {
    expect(findPriceBand(bands, "standard", "custom_home", "online")).toBeUndefined();
  });
});

describe("priceBandKey", () => {
  it("builds a stable composite key", () => {
    expect(priceBandKey("pro", "rental", "chat")).toBe("pro:rental:chat");
  });
});
