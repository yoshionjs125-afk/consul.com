import { describe, expect, it } from "vitest";
import {
  DiagnosisError,
  savingLowerBound,
  summarizeDiagnosis,
  type DiagnosisReport,
} from "./diagnosis.js";

const report: DiagnosisReport = {
  category: "rental",
  summary: "初期費用に交渉余地あり。",
  lineItems: [
    {
      group: "初期費用",
      item: "仲介手数料",
      assessment: "over",
      note: "賃料1ヶ月分が上限。0.5ヶ月分に交渉可能。",
      saving: { kind: "fixed", amount: 40000 },
    },
    {
      group: "初期費用",
      item: "消臭・抗菌料",
      assessment: "negotiate",
      note: "任意オプション。外せる可能性。",
      saving: { kind: "range", low: 10000, high: 20000 },
    },
    {
      group: "月額費用",
      item: "管理費",
      assessment: "standard",
      note: "相場どおり。",
    },
  ],
};

describe("savingLowerBound", () => {
  it("returns 0 for no saving", () => {
    expect(savingLowerBound(undefined)).toBe(0);
  });

  it("returns the fixed amount", () => {
    expect(savingLowerBound({ kind: "fixed", amount: 5000 })).toBe(5000);
  });

  it("returns the lower end of a range regardless of order", () => {
    expect(savingLowerBound({ kind: "range", low: 10000, high: 20000 })).toBe(10000);
    expect(savingLowerBound({ kind: "range", low: 20000, high: 10000 })).toBe(10000);
  });
});

describe("summarizeDiagnosis", () => {
  it("totals the lower bound of savings (conservative est_saving)", () => {
    // 40000 (fixed) + 10000 (range low) + 0 (standard) = 50000
    expect(summarizeDiagnosis(report).totalEstSaving).toBe(50000);
  });

  it("counts items per assessment for the color-coded UI", () => {
    expect(summarizeDiagnosis(report).countByAssessment).toEqual({
      over: 1,
      negotiate: 1,
      standard: 1,
    });
  });

  it("reports the item count", () => {
    expect(summarizeDiagnosis(report).itemCount).toBe(3);
  });

  it("handles an empty report", () => {
    const empty: DiagnosisReport = { category: "purchase", summary: "", lineItems: [] };
    const s = summarizeDiagnosis(empty);
    expect(s.totalEstSaving).toBe(0);
    expect(s.itemCount).toBe(0);
    expect(s.countByAssessment).toEqual({ over: 0, standard: 0, negotiate: 0 });
  });

  it("rejects non-integer saving amounts", () => {
    const bad: DiagnosisReport = {
      category: "rental",
      summary: "",
      lineItems: [
        { group: "g", item: "i", assessment: "over", note: "n", saving: { kind: "fixed", amount: 1.5 } },
      ],
    };
    expect(() => summarizeDiagnosis(bad)).toThrow(DiagnosisError);
  });

  it("rejects negative saving amounts", () => {
    const bad: DiagnosisReport = {
      category: "rental",
      summary: "",
      lineItems: [
        { group: "g", item: "i", assessment: "over", note: "n", saving: { kind: "range", low: -1, high: 5 } },
      ],
    };
    expect(() => summarizeDiagnosis(bad)).toThrow(DiagnosisError);
  });
});
