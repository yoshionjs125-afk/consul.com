/**
 * Diagnosis template types (FR-42, NFR-04).
 *
 * A template is pure data: the groups and line items an advisor evaluates for a
 * given vertical. Adding a new vertical means adding a template here plus a
 * category/price-band row — no logic changes (NFR-04).
 */

import type { CategorySlug } from "../config/constants.js";

export interface TemplateItem {
  /** Stable key for storage / cross-referencing within a category. */
  key: string;
  /** Display label (Japanese). */
  label: string;
  /** What the advisor should look for. Guides neutral, info-only evaluation (FR-62). */
  hint: string;
}

export interface TemplateGroup {
  key: string;
  label: string;
  items: TemplateItem[];
}

export interface DiagnosisTemplate {
  category: CategorySlug;
  title: string;
  /** Files the seeker uploads as diagnosis input (FR-41). */
  requiredInputs: string[];
  groups: TemplateGroup[];
}
