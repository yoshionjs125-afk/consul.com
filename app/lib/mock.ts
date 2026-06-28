/**
 * Demo data for the preview UI.
 *
 * This is sample/seed data so the screens can be viewed in a browser WITHOUT
 * Supabase, auth, or Stripe. It reuses the seed price bands and the tested
 * domain core; nothing here re-implements a business rule.
 *
 * When the real data layer is wired (Phase 1 remaining work), these screens
 * swap this module for live Supabase queries — the components stay the same.
 */

import type { AdvisorRank, CategorySlug, OfferingKind } from "../../src/config/constants.js";
import type { DiagnosisReport } from "../../src/domain/diagnosis.js";

export interface DemoOffering {
  kind: OfferingKind;
  label: string;
  price: number;
  feeRate: number; // from the seed price band for this (rank×category×kind)
}

export interface DemoAdvisor {
  id: string;
  displayName: string;
  formerIndustryLabel: string;
  yearsExperience: number;
  rank: AdvisorRank;
  categories: CategorySlug[];
  verifiedCredentials: string[];
  bio: string;
  offerings: DemoOffering[];
}

export const CATEGORY_LABELS: Record<CategorySlug, string> = {
  rental: "賃貸",
  purchase: "売買",
  custom_home: "注文住宅",
};

export const RANK_LABELS: Record<AdvisorRank, string> = {
  standard: "スタンダード",
  pro: "プロ",
  senior: "シニア",
};

export const KIND_LABELS: Record<OfferingKind, string> = {
  chat: "チャット相談",
  phone: "電話相談",
  online: "オンライン相談",
  diagnosis: "中立診断",
};

/** Advisors are shown anonymously (FR-15): handle + former-industry label only. */
export const DEMO_ADVISORS: DemoAdvisor[] = [
  {
    id: "a1",
    displayName: "たなか",
    formerIndustryLabel: "元・賃貸仲介",
    yearsExperience: 8,
    rank: "pro",
    categories: ["rental"],
    verifiedCredentials: ["宅地建物取引士"],
    bio: "賃貸の初期費用・契約条件のセカンドオピニオンが専門。何も売りません。",
    offerings: [
      { kind: "chat", label: "チャット相談", price: 5000, feeRate: 0.18 },
      { kind: "diagnosis", label: "賃貸 初期費用 中立診断", price: 18000, feeRate: 0.17 },
    ],
  },
  {
    id: "a2",
    displayName: "さとう",
    formerIndustryLabel: "一級建築士",
    yearsExperience: 15,
    rank: "senior",
    categories: ["custom_home", "purchase"],
    verifiedCredentials: ["一級建築士"],
    bio: "注文住宅の見積り精査と売買物件の建物確認。中立な相場比較に限定します。",
    offerings: [
      { kind: "diagnosis", label: "注文住宅 見積り 中立診断", price: 60000, feeRate: 0.15 },
      { kind: "diagnosis", label: "売買 購入諸費用 中立診断", price: 55000, feeRate: 0.15 },
    ],
  },
  {
    id: "a3",
    displayName: "すずき",
    formerIndustryLabel: "元・住宅メーカー営業",
    yearsExperience: 5,
    rank: "standard",
    categories: ["rental", "purchase"],
    verifiedCredentials: ["宅地建物取引士", "FP2級"],
    bio: "はじめての住まい探しの相談に。中立の立場で疑問にお答えします。",
    offerings: [
      { kind: "online", label: "オンライン相談", price: 6000, feeRate: 0.2 },
      { kind: "diagnosis", label: "賃貸 初期費用 中立診断", price: 12000, feeRate: 0.18 },
    ],
  },
];

/** A worked example of a neutral diagnosis (rental), used on the sample page. */
export const SAMPLE_RENTAL_REPORT: DiagnosisReport = {
  category: "rental",
  summary: "初期費用に複数の交渉余地があります。特に仲介手数料と任意オプションを確認してください。",
  lineItems: [
    {
      group: "仲介関連",
      item: "仲介手数料",
      assessment: "over",
      note: "賃料1ヶ月分が請求されています。法定上限の範囲内ですが、0.5ヶ月分への交渉余地があります。",
      saving: { kind: "fixed", amount: 40000 },
    },
    {
      group: "初期費用",
      item: "消臭・抗菌料",
      assessment: "negotiate",
      note: "任意オプションです。不要であれば外せる可能性があります。",
      saving: { kind: "range", low: 10000, high: 20000 },
    },
    {
      group: "初期費用",
      item: "鍵交換費",
      assessment: "negotiate",
      note: "実費との差を確認しましょう。相場は1〜2万円程度です。",
      saving: { kind: "range", low: 5000, high: 11000 },
    },
    {
      group: "月額費用",
      item: "管理費・共益費",
      assessment: "standard",
      note: "この物件・エリアの相場どおりで、妥当な水準です。",
    },
    {
      group: "契約条件",
      item: "更新料",
      assessment: "standard",
      note: "地域の慣行に沿っており、特段の問題はありません。",
    },
  ],
};
