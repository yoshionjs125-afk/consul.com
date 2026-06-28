/**
 * Hand-written row types mirroring supabase/migrations/0001_init.sql.
 *
 * In a running project these would be generated via `supabase gen types`. They
 * are kept here so the domain layer and (future) data-access layer share one
 * vocabulary. Keep in sync with the SQL when the schema changes.
 */

import type {
  AdvisorRank,
  Assessment,
  CategorySlug,
  CredentialStatus,
  EscrowState,
  OfferingKind,
} from "../config/constants.js";

export type UUID = string;
export type Timestamp = string; // ISO-8601

export type AppRole = "seeker" | "advisor" | "admin";
export type ConsultationStatus = "requested" | "scheduled" | "active" | "completed" | "cancelled";
export type DisputeStatus = "open" | "resolved_release" | "resolved_refund";

export interface AppUserRow {
  id: UUID;
  display_name: string;
  created_at: Timestamp;
}

export interface AdvisorProfileRow {
  id: UUID;
  user_id: UUID;
  display_name: string;
  former_industry_label: string | null;
  years_experience: number;
  rank: AdvisorRank;
  bio: string | null;
  created_at: Timestamp;
}

export interface CredentialRow {
  id: UUID;
  advisor_id: UUID;
  kind: string;
  number: string | null;
  evidence_path: string | null;
  status: CredentialStatus;
  verified_by: UUID | null;
  verified_at: Timestamp | null;
  created_at: Timestamp;
}

export interface CategoryRow {
  slug: CategorySlug;
  label: string;
  is_active: boolean;
  created_at: Timestamp;
}

export interface PriceBandRow {
  id: UUID;
  rank: AdvisorRank;
  category: CategorySlug;
  kind: OfferingKind;
  min_price: number;
  max_price: number;
  fee_rate: number;
  created_at: Timestamp;
}

export interface OfferingRow {
  id: UUID;
  advisor_id: UUID;
  category: CategorySlug;
  kind: OfferingKind;
  price: number;
  description: string | null;
  is_active: boolean;
  created_at: Timestamp;
}

export interface ConsultationRow {
  id: UUID;
  offering_id: UUID;
  seeker_id: UUID;
  advisor_id: UUID;
  status: ConsultationStatus;
  scheduled_at: Timestamp | null;
  created_at: Timestamp;
  completed_at: Timestamp | null;
}

export interface DeliverableRow {
  id: UUID;
  consultation_id: UUID;
  offering_id: UUID;
  seeker_id: UUID;
  advisor_id: UUID;
  input_paths: string[];
  created_at: Timestamp;
  delivered_at: Timestamp | null;
}

export interface DiagnosisReportRow {
  id: UUID;
  deliverable_id: UUID;
  category: CategorySlug;
  line_items: unknown; // jsonb; validated by src/domain/diagnosis.ts before use
  summary: string;
  total_est_saving: number;
  created_at: Timestamp;
}

export interface TransactionRow {
  id: UUID;
  consultation_id: UUID | null;
  deliverable_id: UUID | null;
  seeker_id: UUID;
  advisor_id: UUID;
  amount: number;
  fee_rate: number;
  platform_fee: number;
  advisor_payout: number;
  escrow_state: EscrowState;
  held_at: Timestamp | null;
  stripe_payment_intent: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ReviewRow {
  id: UUID;
  consultation_id: UUID;
  seeker_id: UUID;
  advisor_id: UUID;
  stars: number;
  was_neutral: boolean;
  no_upsell: boolean;
  comment: string | null;
  created_at: Timestamp;
}

export interface AuditLogRow {
  id: number;
  actor_id: UUID | null;
  action: string;
  entity: string;
  entity_id: string;
  metadata: Record<string, unknown>;
  created_at: Timestamp;
}

export type { Assessment };
