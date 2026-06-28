import { describe, expect, it } from "vitest";
import { CATEGORY_SLUGS } from "../config/constants.js";
import { DIAGNOSIS_TEMPLATES, getDiagnosisTemplate } from "./index.js";

describe("diagnosis template registry", () => {
  it("provides a template for every Phase-1 category (NFR-04)", () => {
    for (const slug of CATEGORY_SLUGS) {
      const t = getDiagnosisTemplate(slug);
      expect(t.category).toBe(slug);
      expect(t.groups.length).toBeGreaterThan(0);
    }
  });

  it("has unique group keys and unique item keys within each template", () => {
    for (const t of Object.values(DIAGNOSIS_TEMPLATES)) {
      const groupKeys = t.groups.map((g) => g.key);
      expect(new Set(groupKeys).size).toBe(groupKeys.length);

      const itemKeys = t.groups.flatMap((g) => g.items.map((i) => i.key));
      expect(new Set(itemKeys).size).toBe(itemKeys.length);
    }
  });

  it("requires at least one input file per template (FR-41)", () => {
    for (const t of Object.values(DIAGNOSIS_TEMPLATES)) {
      expect(t.requiredInputs.length).toBeGreaterThan(0);
    }
  });
});
