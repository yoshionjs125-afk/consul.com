-- =============================================================================
-- 0002_rls.sql — Row Level Security (NFR-01)
-- =============================================================================
-- Multi-tenant isolation is mandatory: a user may read only their own data; an
-- advisor must never see another advisor's seekers (§7 NFR-01, §12 risk table).
--
-- This file is intentionally explicit and verbose: it is on the human-review
-- critical path (§12 "決済・RLS・KYCは人間がレビュー"). Prefer clarity over cleverness.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so policies can consult roles/ownership)
-- ---------------------------------------------------------------------------
create or replace function auth_has_role(target app_role)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid() and role = target
  );
$$;

create or replace function auth_is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select auth_has_role('admin');
$$;

-- The advisor_profiles.id owned by the current user (NULL if none).
create or replace function auth_advisor_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select id from advisor_profiles where user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere. Default-deny: no policy => no access.
-- ---------------------------------------------------------------------------
alter table app_users          enable row level security;
alter table user_roles         enable row level security;
alter table categories         enable row level security;
alter table advisor_profiles   enable row level security;
alter table advisor_categories enable row level security;
alter table credentials        enable row level security;
alter table price_bands        enable row level security;
alter table offerings          enable row level security;
alter table consultations      enable row level security;
alter table threads            enable row level security;
alter table messages           enable row level security;
alter table deliverables       enable row level security;
alter table diagnosis_reports  enable row level security;
alter table transactions       enable row level security;
alter table reviews            enable row level security;
alter table disputes           enable row level security;
alter table audit_logs         enable row level security;

-- ---------------------------------------------------------------------------
-- app_users / user_roles
-- ---------------------------------------------------------------------------
create policy app_users_self_select on app_users
  for select using (id = auth.uid() or auth_is_admin());
create policy app_users_self_upsert on app_users
  for insert with check (id = auth.uid());
create policy app_users_self_update on app_users
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy user_roles_self_select on user_roles
  for select using (user_id = auth.uid() or auth_is_admin());
-- Role grants are an admin/service-role operation (no self-insert of 'admin').
create policy user_roles_admin_write on user_roles
  for all using (auth_is_admin()) with check (auth_is_admin());

-- ---------------------------------------------------------------------------
-- categories / price_bands — public read, admin write (FR-71, FR-80)
-- ---------------------------------------------------------------------------
create policy categories_public_read on categories
  for select using (true);
create policy categories_admin_write on categories
  for all using (auth_is_admin()) with check (auth_is_admin());

create policy price_bands_public_read on price_bands
  for select using (true);
create policy price_bands_admin_write on price_bands
  for all using (auth_is_admin()) with check (auth_is_admin());

-- ---------------------------------------------------------------------------
-- advisor_profiles — public read (anonymous display, FR-15), owner/admin write
-- ---------------------------------------------------------------------------
create policy advisor_profiles_public_read on advisor_profiles
  for select using (true);
create policy advisor_profiles_owner_insert on advisor_profiles
  for insert with check (user_id = auth.uid());
create policy advisor_profiles_owner_update on advisor_profiles
  for update using (user_id = auth.uid() or auth_is_admin())
  with check (user_id = auth.uid() or auth_is_admin());

create policy advisor_categories_public_read on advisor_categories
  for select using (true);
create policy advisor_categories_owner_write on advisor_categories
  for all using (advisor_id = auth_advisor_id() or auth_is_admin())
  with check (advisor_id = auth_advisor_id() or auth_is_admin());

-- ---------------------------------------------------------------------------
-- credentials — private. Owner reads own; admin reads all for verification (FR-70)
-- ---------------------------------------------------------------------------
create policy credentials_owner_select on credentials
  for select using (advisor_id = auth_advisor_id() or auth_is_admin());
create policy credentials_owner_insert on credentials
  for insert with check (advisor_id = auth_advisor_id());
-- Only admin sets verified/rejected (FR-12); owner cannot self-verify.
create policy credentials_admin_update on credentials
  for update using (auth_is_admin()) with check (auth_is_admin());

-- ---------------------------------------------------------------------------
-- offerings — active ones public (FR-80); owner manages own (FR-20)
-- ---------------------------------------------------------------------------
create policy offerings_public_read on offerings
  for select using (is_active or advisor_id = auth_advisor_id() or auth_is_admin());
create policy offerings_owner_write on offerings
  for all using (advisor_id = auth_advisor_id() or auth_is_admin())
  with check (advisor_id = auth_advisor_id() or auth_is_admin());

-- ---------------------------------------------------------------------------
-- consultations — visible only to its seeker, its advisor, or admin (NFR-01)
-- ---------------------------------------------------------------------------
create policy consultations_party_select on consultations
  for select using (
    seeker_id = auth.uid() or advisor_id = auth_advisor_id() or auth_is_admin()
  );
create policy consultations_seeker_insert on consultations
  for insert with check (seeker_id = auth.uid());
create policy consultations_party_update on consultations
  for update using (seeker_id = auth.uid() or advisor_id = auth_advisor_id() or auth_is_admin())
  with check (seeker_id = auth.uid() or advisor_id = auth_advisor_id() or auth_is_admin());

-- ---------------------------------------------------------------------------
-- threads / messages — only consultation parties
-- ---------------------------------------------------------------------------
create policy threads_party_select on threads
  for select using (
    exists (
      select 1 from consultations c
      where c.id = threads.consultation_id
        and (c.seeker_id = auth.uid() or c.advisor_id = auth_advisor_id() or auth_is_admin())
    )
  );

create policy messages_party_select on messages
  for select using (
    exists (
      select 1 from threads t join consultations c on c.id = t.consultation_id
      where t.id = messages.thread_id
        and (c.seeker_id = auth.uid() or c.advisor_id = auth_advisor_id() or auth_is_admin())
    )
  );
-- Sender must be a party to the thread and must be themselves.
create policy messages_party_insert on messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from threads t join consultations c on c.id = t.consultation_id
      where t.id = messages.thread_id
        and (c.seeker_id = auth.uid() or c.advisor_id = auth_advisor_id())
    )
  );

-- ---------------------------------------------------------------------------
-- deliverables / diagnosis_reports — only the two parties + admin
-- ---------------------------------------------------------------------------
create policy deliverables_party_select on deliverables
  for select using (
    seeker_id = auth.uid() or advisor_id = auth_advisor_id() or auth_is_admin()
  );
create policy deliverables_seeker_insert on deliverables
  for insert with check (seeker_id = auth.uid());
create policy deliverables_advisor_update on deliverables
  for update using (advisor_id = auth_advisor_id() or auth_is_admin())
  with check (advisor_id = auth_advisor_id() or auth_is_admin());

create policy reports_party_select on diagnosis_reports
  for select using (
    exists (
      select 1 from deliverables d
      where d.id = diagnosis_reports.deliverable_id
        and (d.seeker_id = auth.uid() or d.advisor_id = auth_advisor_id() or auth_is_admin())
    )
  );
-- Only the assigned advisor authors the report.
create policy reports_advisor_write on diagnosis_reports
  for all using (
    exists (
      select 1 from deliverables d
      where d.id = diagnosis_reports.deliverable_id
        and (d.advisor_id = auth_advisor_id() or auth_is_admin())
    )
  )
  with check (
    exists (
      select 1 from deliverables d
      where d.id = diagnosis_reports.deliverable_id
        and (d.advisor_id = auth_advisor_id() or auth_is_admin())
    )
  );

-- ---------------------------------------------------------------------------
-- transactions — read-only to parties; mutations go through the service role
-- (escrow transitions are validated by src/domain/escrow.ts, FR-51, NFR-05).
-- ---------------------------------------------------------------------------
create policy transactions_party_select on transactions
  for select using (
    seeker_id = auth.uid() or advisor_id = auth_advisor_id() or auth_is_admin()
  );
-- No client INSERT/UPDATE policy: only the service role (which bypasses RLS)
-- may write, so amounts and state transitions cannot be forged by clients.

-- ---------------------------------------------------------------------------
-- reviews — seeker writes own; public read for trust signalling (FR-60)
-- ---------------------------------------------------------------------------
create policy reviews_public_read on reviews
  for select using (true);
create policy reviews_seeker_insert on reviews
  for insert with check (seeker_id = auth.uid());

-- ---------------------------------------------------------------------------
-- disputes — opener + admin (FR-73)
-- ---------------------------------------------------------------------------
create policy disputes_party_select on disputes
  for select using (opened_by = auth.uid() or auth_is_admin());
create policy disputes_party_insert on disputes
  for insert with check (opened_by = auth.uid());
create policy disputes_admin_update on disputes
  for update using (auth_is_admin()) with check (auth_is_admin());

-- ---------------------------------------------------------------------------
-- audit_logs — admin read only; writes via service role (NFR-08)
-- ---------------------------------------------------------------------------
create policy audit_logs_admin_select on audit_logs
  for select using (auth_is_admin());
