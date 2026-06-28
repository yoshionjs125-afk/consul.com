-- =============================================================================
-- seed.sql — Phase 1 reference data
-- =============================================================================
-- Seeds the three Phase-1 verticals and PROVISIONAL price bands.
--
-- NOTE: concrete price-band values are an open issue (§13 "各縦の価格バンド
-- 具体値の確定"). The numbers below are monitor-pricing placeholders for the test
-- environment, NOT final pricing. fee_rate stays within the §1 15–20% band.
-- =============================================================================

insert into categories (slug, label) values
  ('rental',      '賃貸'),
  ('purchase',    '売買'),
  ('custom_home', '注文住宅')
on conflict (slug) do nothing;

-- price_bands: (rank × category × kind). Prices are integer yen.
-- Consultation kinds (chat/phone/online) are the entry point; `diagnosis` is the
-- deliverable cash point and is priced higher.
insert into price_bands (rank, category, kind, min_price, max_price, fee_rate) values
  -- rental
  ('standard', 'rental', 'chat',      2000,  5000,  0.200),
  ('standard', 'rental', 'online',    4000,  8000,  0.200),
  ('standard', 'rental', 'diagnosis', 8000,  15000, 0.180),
  ('pro',      'rental', 'chat',      3000,  8000,  0.180),
  ('pro',      'rental', 'online',    6000,  12000, 0.180),
  ('pro',      'rental', 'diagnosis', 12000, 25000, 0.170),
  ('senior',   'rental', 'diagnosis', 20000, 40000, 0.150),
  -- purchase
  ('standard', 'purchase', 'online',    6000,  12000, 0.200),
  ('standard', 'purchase', 'diagnosis', 15000, 30000, 0.180),
  ('pro',      'purchase', 'online',    10000, 20000, 0.180),
  ('pro',      'purchase', 'diagnosis', 25000, 50000, 0.170),
  ('senior',   'purchase', 'diagnosis', 40000, 80000, 0.150),
  -- custom_home
  ('standard', 'custom_home', 'online',    6000,  12000, 0.200),
  ('standard', 'custom_home', 'diagnosis', 18000, 35000, 0.180),
  ('pro',      'custom_home', 'online',    10000, 20000, 0.180),
  ('pro',      'custom_home', 'diagnosis', 30000, 60000, 0.170),
  ('senior',   'custom_home', 'diagnosis', 50000, 100000, 0.150)
on conflict (rank, category, kind) do nothing;
