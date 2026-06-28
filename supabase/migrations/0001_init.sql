-- =============================================================================
-- 0001_init.sql — Neutral Consultation Platform, Phase 1 schema
-- =============================================================================
-- Covers the entities in requirements §9. Logic stays category-agnostic (NFR-04):
-- verticals are rows in `categories`, never enum branches in code.
-- Amounts are integer yen (no minor unit); see src/config/constants.ts.
-- RLS policies live in 0002_rls.sql; seed data in ../seed.sql.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enumerated types (mirror src/config/constants.ts — keep the two in sync)
-- ---------------------------------------------------------------------------
create type app_role           as enum ('seeker', 'advisor', 'admin');
create type advisor_rank       as enum ('standard', 'pro', 'senior');
create type credential_status  as enum ('pending', 'verified', 'rejected');
create type offering_kind      as enum ('chat', 'phone', 'online', 'diagnosis');
create type consultation_status as enum ('requested', 'scheduled', 'active', 'completed', 'cancelled');
create type assessment         as enum ('over', 'standard', 'negotiate');
create type escrow_state       as enum ('authorized', 'held', 'released', 'refunded', 'disputed');
create type dispute_status     as enum ('open', 'resolved_release', 'resolved_refund');

-- ---------------------------------------------------------------------------
-- users — public mirror of auth.users (FR-01)
-- ---------------------------------------------------------------------------
create table app_users (
  id          uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at  timestamptz not null default now()
);

-- user_roles — multiple roles per user (FR-02)
create table user_roles (
  user_id uuid not null references app_users (id) on delete cascade,
  role    app_role not null,
  primary key (user_id, role)
);

-- ---------------------------------------------------------------------------
-- categories — service verticals (NFR-04). New vertical = new row.
-- ---------------------------------------------------------------------------
create table categories (
  slug       text primary key,            -- 'rental' | 'purchase' | 'custom_home' | ...
  label      text not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- advisor_profiles — anonymous display only, no company name (FR-10, FR-15)
-- ---------------------------------------------------------------------------
create table advisor_profiles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references app_users (id) on delete cascade,
  display_name    text not null,          -- anonymous handle (FR-10)
  former_industry_label text,             -- e.g. "元・賃貸仲介" (FR-10); NO company name (FR-15)
  years_experience int not null check (years_experience >= 0),
  rank            advisor_rank not null default 'standard',  -- (FR-13)
  bio             text,
  created_at      timestamptz not null default now()
);

-- advisor_categories — which verticals an advisor serves (FR-10)
create table advisor_categories (
  advisor_id uuid not null references advisor_profiles (id) on delete cascade,
  category   text not null references categories (slug) on delete cascade,
  primary key (advisor_id, category)
);

-- credentials — qualifications submitted for verification (FR-11, FR-12)
create table credentials (
  id            uuid primary key default gen_random_uuid(),
  advisor_id    uuid not null references advisor_profiles (id) on delete cascade,
  kind          text not null,            -- e.g. "宅地建物取引士"
  number        text,
  evidence_path text,                     -- Supabase Storage object path (private bucket)
  status        credential_status not null default 'pending',
  verified_by   uuid references app_users (id),
  verified_at   timestamptz,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- price_bands — admin-fixed range per (rank × category × kind) (FR-21, FR-71)
-- ---------------------------------------------------------------------------
create table price_bands (
  id         uuid primary key default gen_random_uuid(),
  rank       advisor_rank not null,
  category   text not null references categories (slug) on delete cascade,
  kind       offering_kind not null,
  min_price  int not null check (min_price >= 0),
  max_price  int not null check (max_price >= min_price),
  fee_rate   numeric(4,3) not null check (fee_rate >= 0.150 and fee_rate <= 0.200), -- FR-22, §1
  created_at timestamptz not null default now(),
  unique (rank, category, kind)
);

-- ---------------------------------------------------------------------------
-- offerings — advisor products (FR-20). Price enforced within band (FR-21).
-- ---------------------------------------------------------------------------
create table offerings (
  id          uuid primary key default gen_random_uuid(),
  advisor_id  uuid not null references advisor_profiles (id) on delete cascade,
  category    text not null references categories (slug),
  kind        offering_kind not null,
  price       int not null check (price >= 0),
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- consultations — a booked engagement (FR-30, FR-32)
-- ---------------------------------------------------------------------------
create table consultations (
  id           uuid primary key default gen_random_uuid(),
  offering_id  uuid not null references offerings (id),
  seeker_id    uuid not null references app_users (id),
  advisor_id   uuid not null references advisor_profiles (id),
  status       consultation_status not null default 'requested',
  scheduled_at timestamptz,
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);

-- threads / messages — async chat with attachments (FR-31)
create table threads (
  id              uuid primary key default gen_random_uuid(),
  consultation_id uuid not null unique references consultations (id) on delete cascade,
  created_at      timestamptz not null default now()
);

create table messages (
  id              uuid primary key default gen_random_uuid(),
  thread_id       uuid not null references threads (id) on delete cascade,
  sender_id       uuid not null references app_users (id),
  body            text not null,
  attachment_path text,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- deliverables — the diagnosis order (FR-40, FR-41)
-- ---------------------------------------------------------------------------
create table deliverables (
  id              uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references consultations (id),
  offering_id     uuid not null references offerings (id),  -- the 'diagnosis' kind offering
  seeker_id       uuid not null references app_users (id),
  advisor_id      uuid not null references advisor_profiles (id),
  input_paths     text[] not null default '{}',             -- uploaded files (FR-41)
  created_at      timestamptz not null default now(),
  delivered_at    timestamptz
);

-- diagnosis_reports — structured report (FR-42, FR-43, FR-44)
-- line_items stored as jsonb; shape validated/aggregated by src/domain/diagnosis.ts.
create table diagnosis_reports (
  id               uuid primary key default gen_random_uuid(),
  deliverable_id   uuid not null unique references deliverables (id) on delete cascade,
  category         text not null references categories (slug),
  line_items       jsonb not null default '[]',
  summary          text not null default '',
  total_est_saving int not null default 0 check (total_est_saving >= 0),
  created_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- transactions — payment + escrow + fee split (FR-50..FR-53)
-- ---------------------------------------------------------------------------
create table transactions (
  id               uuid primary key default gen_random_uuid(),
  -- A transaction settles exactly one of: a consultation or a deliverable.
  consultation_id  uuid references consultations (id),
  deliverable_id   uuid references deliverables (id),
  seeker_id        uuid not null references app_users (id),
  advisor_id       uuid not null references advisor_profiles (id),
  amount           int not null check (amount >= 0),         -- gross yen
  fee_rate         numeric(4,3) not null,
  platform_fee     int not null check (platform_fee >= 0),   -- FR-53
  advisor_payout   int not null check (advisor_payout >= 0), -- FR-53
  escrow_state     escrow_state not null default 'authorized', -- FR-51
  held_at          timestamptz,                              -- when entered 'held' (FR-52 timer)
  stripe_payment_intent text,                                -- TEST mode only (FR-55)
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- Exactly one subject, and the split must reconcile to the gross amount.
  constraint one_subject check (num_nonnulls(consultation_id, deliverable_id) = 1),
  constraint split_reconciles check (platform_fee + advisor_payout = amount)
);

-- ---------------------------------------------------------------------------
-- reviews — star + neutrality rating (FR-60)
-- ---------------------------------------------------------------------------
create table reviews (
  id              uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references consultations (id),
  seeker_id       uuid not null references app_users (id),
  advisor_id      uuid not null references advisor_profiles (id),
  stars           int not null check (stars between 1 and 5),
  was_neutral     boolean not null,        -- 「中立だったか」
  no_upsell       boolean not null,        -- 「売り込まれなかったか」
  comment         text,
  created_at      timestamptz not null default now(),
  unique (consultation_id, seeker_id)
);

-- disputes (FR-73, P2 surface; table present for escrow 'disputed' state)
create table disputes (
  id             uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references transactions (id),
  opened_by      uuid not null references app_users (id),
  reason         text not null,
  status         dispute_status not null default 'open',
  resolved_by    uuid references app_users (id),
  resolved_at    timestamptz,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- audit_logs — important operations: verify / pay / release (NFR-08)
-- ---------------------------------------------------------------------------
create table audit_logs (
  id         bigint generated always as identity primary key,
  actor_id   uuid references app_users (id),
  action     text not null,              -- e.g. 'credential.verified', 'escrow.released'
  entity     text not null,              -- table name
  entity_id  text not null,
  metadata   jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index on offerings (category, kind) where is_active;
create index on consultations (seeker_id);
create index on consultations (advisor_id);
create index on messages (thread_id);
create index on transactions (seeker_id);
create index on transactions (advisor_id);
create index on audit_logs (entity, entity_id);
