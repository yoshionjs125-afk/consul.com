# Decision log

A running record of non-obvious choices, so a human can later understand and
safely revise them (NFR-02). Each entry: context → decision → consequence.

## ADR-001 — Build the business-rule core first, pure and tested

**Context.** The requirements emphasize twice that money/state logic must be
centralized and unit-tested (NFR-02, NFR-05) and that "humans can safely modify
later" is the quality bar. The repo started empty.

**Decision.** Implement the four vertical-independent rules — fee split, price
bands, escrow, diagnosis aggregation — as pure TypeScript modules with full unit
tests *before* any framework, DB client, or UI. Centralize every tunable in
`src/config/constants.ts`.

**Consequence.** The core runs and is verifiable with `npm test` and no external
services. UI/auth/Stripe layers can be added without re-deriving any rule.

## ADR-002 — Category-agnostic by data, not by code (NFR-04)

**Context.** New verticals (FP/tax/education in Phase 3) must be addable without
logic changes.

**Decision.** Verticals are rows in `categories`; price rules are rows in
`price_bands`; diagnosis structure is a data template in
`src/diagnosis-templates/`. No `switch (category)` in domain logic.

**Consequence.** Adding a vertical = one category row + price bands + one
template module registered in `diagnosis-templates/index.ts`.

## ADR-003 — Fee split rounds the platform fee, derives payout by subtraction

**Context.** Fees are 15–20% (§1) and the split is shown to the seeker (FR-22);
amounts are integer yen. Rounding both sides independently can lose/gain a yen.

**Decision.** `platform_fee = round(amount × rate)`; `advisor_payout = amount −
platform_fee`. Fee rate is validated against `[0.15, 0.20]`.

**Consequence.** Invariant `platform_fee + advisor_payout === amount` always
holds (property-tested). The DB enforces the same with a CHECK constraint.

## ADR-004 — Escrow is a closed state machine; only `applyEscrowTransition` mutates it

**Context.** FR-51 defines `authorized → held → released/refunded/disputed`
(plus dispute resolution). Illegal jumps would be financial bugs.

**Decision.** A single transition table drives `applyEscrowTransition`,
`canApply`, and `allowedTriggers`. Clients have **no** INSERT/UPDATE RLS policy
on `transactions`; only the service role writes, after validating the transition.

**Consequence.** State can't be forged from the client or skipped. Auto-release
(FR-52) is a pure predicate (`isAutoReleaseDue`) with an injected clock, so it's
deterministic to test and to run from a scheduled job later.

## ADR-005 — `total_est_saving` uses the lower bound of each estimate

**Context.** The risk table (§12) prescribes "est_saving下限採用" to protect trust.

**Decision.** Savings may be a fixed amount or a `[low, high]` range;
aggregation always sums the lower bound. Negative/non-integer savings are
rejected.

**Consequence.** The headline figure the seeker sees (FR-44) is conservative and
defensible.

## ADR-006 — RLS default-deny, advisor identity via `auth_advisor_id()`

**Context.** NFR-01 mandates tenant isolation; §12 flags multi-tenant leakage as
a top risk and requires human review of RLS.

**Decision.** Enable RLS on every table with explicit policies (no policy = no
access). An advisor's ownership is resolved through a `SECURITY DEFINER` helper
mapping `auth.uid()` to their `advisor_profiles.id`. Consultations, threads,
messages, deliverables, reports, and transactions are visible only to the
seeker, the assigned advisor, or admin.

**Consequence.** An advisor cannot see another advisor's seekers. Credentials are
private to owner+admin; only admin can set `verified/rejected` (no self-verify).

## ADR-007 — Stripe TEST mode only in Phase 1

**Context.** FR-55 / §10: production keys and real transfers are gated on review.

**Decision.** `.env.example` ships only `*_test` placeholders; the schema stores
`stripe_payment_intent` but the writing layer is service-role only and unbuilt
pending review.

**Consequence.** No path to move real money exists in this slice.

## Open issues carried from requirements §13

- Legal entity timing (fund-holding/liability).
- eKYC level (犯収法 applicability).
- **Concrete price-band values** — current `supabase/seed.sql` numbers are
  provisional monitor pricing, not final.
- Which single vertical to seed demand into first.
- Service name & domain.
