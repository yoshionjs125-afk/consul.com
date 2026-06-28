# Data model reference

Mirrors `supabase/migrations/0001_init.sql`. Amounts are **integer yen**.
Verticals are data (`categories`), never code branches (NFR-04).

## Entities (§9)

| Table | Purpose | Key requirements |
|---|---|---|
| `app_users` | Public mirror of `auth.users` | FR-01 |
| `user_roles` | Multiple roles per user (seeker/advisor/admin) | FR-02 |
| `categories` | Service verticals | NFR-04 |
| `advisor_profiles` | Anonymous advisor identity (no company name) | FR-10, FR-15 |
| `advisor_categories` | Verticals an advisor serves | FR-10 |
| `credentials` | Submitted qualifications + verification state | FR-11, FR-12 |
| `price_bands` | Admin-fixed price range + fee rate per (rank×category×kind) | FR-21, FR-22, FR-71 |
| `offerings` | Advisor products (chat/phone/online/diagnosis) | FR-20 |
| `consultations` | Booked engagement | FR-30, FR-32 |
| `threads` / `messages` | Async chat with attachments | FR-31 |
| `deliverables` | Diagnosis order + input files | FR-40, FR-41 |
| `diagnosis_reports` | Structured report (line_items, summary, total) | FR-42–FR-44 |
| `transactions` | Payment + escrow + fee split | FR-50–FR-53 |
| `reviews` | Star + neutrality + no-upsell | FR-60 |
| `disputes` | Dispute records | FR-73 |
| `audit_logs` | Important-operation audit trail | NFR-08 |

## Key invariants (enforced in SQL + domain code)

- `price_bands.max_price >= min_price`; `fee_rate ∈ [0.150, 0.200]`.
- `transactions`: exactly one of `consultation_id` / `deliverable_id`
  (`num_nonnulls(...) = 1`), and `platform_fee + advisor_payout = amount`.
- `reviews.stars ∈ [1,5]`; one review per (consultation, seeker).

## Escrow state machine (FR-51, FR-52)

Implemented in `src/domain/escrow.ts`. `released` and `refunded` are terminal.

```
                ┌─────────────┐  capture   ┌──────┐
   payment ───▶ │ authorized  │ ─────────▶ │ held │
                └─────────────┘            └──┬───┘
                                              │
              accept / auto_release           │  dispute
            ┌────────────────────────┐        │
            ▼                        │        ▼
        ┌──────────┐            ┌─────┴────┐  resolve_release  ┌──────────┐
        │ released │ ◀──────────│ disputed │ ─────────────────▶│ released │
        └──────────┘            └─────┬────┘                   └──────────┘
                                      │ resolve_refund
              refund                  ▼
   held ─────────────────────▶  ┌──────────┐
                                │ refunded │
                                └──────────┘
```

Triggers: `capture`, `accept`, `auto_release` (FR-52), `dispute`, `refund`,
`resolve_release`, `resolve_refund`. Only `applyEscrowTransition` changes state;
clients have no write policy on `transactions` (service-role only).

## Diagnosis report shape (FR-43)

`diagnosis_reports.line_items` is `jsonb`, validated/aggregated by
`src/domain/diagnosis.ts`:

```jsonc
{
  "group": "初期費用",          // grouping bucket
  "item": "仲介手数料",          // evaluated item
  "assessment": "over",         // over | standard | negotiate  (FR-44 color)
  "note": "0.5ヶ月分に交渉可能", // 所見
  "saving": { "kind": "range", "low": 10000, "high": 20000 }  // optional; total uses low
}
```

`total_est_saving` = Σ lower-bound of each saving (ADR-005).
