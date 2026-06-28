/**
 * Diagnosis template registry (FR-42, NFR-04).
 *
 * The registry is keyed by category slug. Adding a vertical = add a template
 * module and register it here; no aggregation/escrow/fee logic changes.
 */

import type { CategorySlug } from "../config/constants.js";
import { customHomeTemplate } from "./customHome.js";
import { purchaseTemplate } from "./purchase.js";
import { rentalTemplate } from "./rental.js";
import type { DiagnosisTemplate } from "./types.js";

export const DIAGNOSIS_TEMPLATES: Record<CategorySlug, DiagnosisTemplate> = {
  rental: rentalTemplate,
  purchase: purchaseTemplate,
  custom_home: customHomeTemplate,
};

export function getDiagnosisTemplate(category: CategorySlug): DiagnosisTemplate {
  return DIAGNOSIS_TEMPLATES[category];
}

export type { DiagnosisTemplate, TemplateGroup, TemplateItem } from "./types.js";
