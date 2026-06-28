# 中立相談プラットフォーム / Neutral Consultation Platform

不動産・住まいの意思決定（賃貸・売買・注文住宅）について、**検証済みの有資格者が、定額報酬で「何も売らずに」中立の相談・診断を提供する**マッチングプラットフォーム。

This repository implements the **Phase 1 core** described in
`要件定義書 v1` (requirements definition). It deliberately starts with the
parts the requirements call out as needing the most care — the
vertical-independent business rules and the data/security model — built and
unit-tested first, so the rest can be layered on safely.

> Drafted as a thin, reviewable slice. Payments run in **Stripe TEST mode only**;
> no live keys, no real payouts (FR-50, FR-55). Legal/tax/regulatory points
> require expert sign-off (NFR-03).

---

## What's in this repo today

| Area | Status | Where |
|---|---|---|
| Fee split (platform / advisor) — FR-22, FR-53 | ✅ implemented + tested | `src/domain/fees.ts` |
| Price-band validation — FR-21 | ✅ implemented + tested | `src/domain/priceBands.ts` |
| Escrow state machine — FR-51, FR-52 | ✅ implemented + tested | `src/domain/escrow.ts` |
| Diagnosis aggregation (`total_est_saving`, lower-bound) — FR-43, FR-44 | ✅ implemented + tested | `src/domain/diagnosis.ts` |
| 3-vertical diagnosis templates — FR-42, NFR-04 | ✅ data | `src/diagnosis-templates/` |
| Full DB schema (13 entities) — §9 | ✅ SQL | `supabase/migrations/0001_init.sql` |
| Row Level Security (tenant isolation) — NFR-01 | ✅ SQL | `supabase/migrations/0002_rls.sql` |
| Seed: categories + provisional price bands | ✅ SQL | `supabase/seed.sql` |
| Auth wiring, API routes, UI, Stripe webhooks | ⏳ next | — |

The four domain modules are the heart of the system. The requirements make them
the quality bar twice over: NFR-02 ("ビジネスルールを専用モジュールに集約、マジック
ナンバー禁止") and NFR-05 ("金額・手数料・状態遷移の計算にユニットテスト"). They are
pure, dependency-free, and 100% test-covered so a human can change them safely.

## Quick start

```bash
npm install
npm test        # 43 unit tests across the domain core
npm run typecheck
```

Tests and typecheck run with **no external services** — the domain layer is pure.

## Layout

```
src/
  config/constants.ts        # every business constant (no magic numbers — NFR-02)
  domain/                    # pure, tested business rules
    fees.ts                  # FR-22, FR-53  — platform/advisor split, exact reconcile
    priceBands.ts            # FR-21         — price within (rank×category×kind) band
    escrow.ts                # FR-51, FR-52  — authorized→held→released/refunded/disputed
    diagnosis.ts             # FR-43, FR-44  — line-item aggregation, conservative est_saving
  diagnosis-templates/       # FR-42, NFR-04 — rental / purchase / custom_home (data only)
  types/database.ts          # row types mirroring the SQL schema
  index.ts                   # public barrel
supabase/
  migrations/0001_init.sql   # schema (§9 entities)
  migrations/0002_rls.sql    # RLS policies (NFR-01) — human-review critical path
  seed.sql                   # categories + provisional price bands
docs/
  decision-log.md            # why things are the way they are
  data-model.md              # entity reference & escrow diagram
```

## Design principles (from the requirements)

- **何も売らない / neutral by construction** — the diagnosis is presented by the
  *system* as a fixed-price menu (FR-40); advisors never upsell. Reports are
  limited to general information / market comparison (FR-62).
- **Category-agnostic (NFR-04)** — a new vertical is a `categories` row + a
  `price_bands` set + a diagnosis template. No domain logic changes. See
  `src/diagnosis-templates/` and the registry in `index.ts`.
- **Tenant isolation (NFR-01)** — RLS default-denies; each user sees only their
  own data, and an advisor can never see another advisor's seekers.
- **Auditable money (NFR-05, NFR-08)** — fee splits always reconcile to the
  gross amount; escrow transitions are the only way state changes; important
  operations are written to `audit_logs`.

## Phase 1 — remaining work

These build directly on the tested core (see `docs/decision-log.md` for ordering):

1. Supabase client + auth + role bootstrap (FR-01, FR-02).
2. Advisor registration / credential upload / admin verification UI (FR-10–FR-13, FR-70).
3. Offering publish flow calling `validateOfferingPrice` (FR-20, FR-21).
4. Consultation booking + async chat (FR-30, FR-31).
5. Diagnosis order → report editor (driven by templates) → seeker view (FR-41–FR-44).
6. Stripe Connect (TEST) + webhook applying `applyEscrowTransition` (FR-50–FR-53).
7. Review submission (FR-60).

## Not in scope (per §2, §10)

Brokerage of the actual transaction, sale/solicitation of specific products, and
individualized investment/tax advice. The service is positioned as general
information / second opinion only; final regulatory confirmation is by experts
(NFR-03).
