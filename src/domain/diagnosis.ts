/**
 * Neutral-diagnosis report model & aggregation (FR-43, FR-44).
 *
 * A diagnosis report is a structured evaluation of a quote / property / contract
 * broken into grouped line items. Each item carries an assessment (over /
 * standard / negotiate), an opinion note (所見), and an estimated saving.
 *
 * Trust rule (requirements §12 risk table — "est_saving下限採用"): when a saving
 * is estimated as a range we always total the LOWER bound, so the headline
 * `totalEstSaving` is conservative and defensible.
 */

import { ASSESSMENTS, type Assessment, type CategorySlug } from "../config/constants.js";

/**
 * Estimated saving for a line item, in integer yen.
 * Either a fixed amount or a [low, high] range; aggregation uses the low end.
 */
export type SavingEstimate = { kind: "fixed"; amount: number } | { kind: "range"; low: number; high: number };

export interface DiagnosisLineItem {
  /** Grouping bucket, e.g. "仲介手数料" / "初期費用". */
  group: string;
  /** The specific item being evaluated. */
  item: string;
  assessment: Assessment;
  /** Advisor's opinion / 所見. */
  note: string;
  /** Optional saving estimate; omitted when nothing to save (e.g. "standard"). */
  saving?: SavingEstimate;
}

export interface DiagnosisReport {
  category: CategorySlug;
  lineItems: DiagnosisLineItem[];
  summary: string;
}

export interface DiagnosisSummaryStats {
  /** Conservative total estimated saving (sum of lower bounds), integer yen. */
  totalEstSaving: number;
  /** Count of line items per assessment, for the color-coded UI (FR-44). */
  countByAssessment: Record<Assessment, number>;
  itemCount: number;
}

export class DiagnosisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DiagnosisError";
  }
}

/** Lower bound of a saving estimate — the value used for the headline total. */
export function savingLowerBound(saving: SavingEstimate | undefined): number {
  if (saving === undefined) return 0;
  if (saving.kind === "fixed") return saving.amount;
  return Math.min(saving.low, saving.high);
}

function assertValidSaving(saving: SavingEstimate): void {
  const values = saving.kind === "fixed" ? [saving.amount] : [saving.low, saving.high];
  for (const v of values) {
    if (!Number.isInteger(v)) {
      throw new DiagnosisError(`saving amounts must be integer yen, got ${v}`);
    }
    if (v < 0) {
      throw new DiagnosisError(`saving amounts must be non-negative, got ${v}`);
    }
  }
}

function emptyCounts(): Record<Assessment, number> {
  return ASSESSMENTS.reduce(
    (acc, a) => {
      acc[a] = 0;
      return acc;
    },
    {} as Record<Assessment, number>,
  );
}

/**
 * Aggregate a report into the numbers the seeker UI highlights (FR-44).
 * Validates each line item's saving along the way.
 */
export function summarizeDiagnosis(report: DiagnosisReport): DiagnosisSummaryStats {
  const countByAssessment = emptyCounts();
  let totalEstSaving = 0;

  for (const item of report.lineItems) {
    if (item.saving !== undefined) {
      assertValidSaving(item.saving);
    }
    countByAssessment[item.assessment] += 1;
    totalEstSaving += savingLowerBound(item.saving);
  }

  return {
    totalEstSaving,
    countByAssessment,
    itemCount: report.lineItems.length,
  };
}
