import type { DiagnosisTemplate } from "./types.js";

/** 賃貸：初期費用見積りの中立診断テンプレ。一般情報・相場比較に限定（FR-62）。 */
export const rentalTemplate: DiagnosisTemplate = {
  category: "rental",
  title: "賃貸 初期費用 中立診断",
  requiredInputs: ["初期費用見積書", "募集要項（あれば）"],
  groups: [
    {
      key: "broker_fees",
      label: "仲介関連",
      items: [
        { key: "brokerage_fee", label: "仲介手数料", hint: "賃料1ヶ月分+税が上限。0.5ヶ月分の余地を相場と比較。" },
        { key: "ad_fee", label: "広告料転嫁", hint: "本来は貸主負担のAD費が借主に乗っていないか。" },
      ],
    },
    {
      key: "initial_costs",
      label: "初期費用",
      items: [
        { key: "deposit", label: "敷金", hint: "相場（0〜2ヶ月）と乖離していないか。" },
        { key: "key_money", label: "礼金", hint: "相場と地域慣行を踏まえ妥当か。" },
        { key: "cleaning_fee", label: "クリーニング費", hint: "金額の妥当性と入居時請求の是非。" },
        { key: "key_exchange", label: "鍵交換費", hint: "任意か必須か。実費との差。" },
        { key: "optional_services", label: "消臭・抗菌・安心サポート等", hint: "任意オプション。外せる可能性を確認。" },
      ],
    },
    {
      key: "monthly",
      label: "月額費用",
      items: [
        { key: "rent", label: "賃料", hint: "近隣・同条件物件の相場との比較。" },
        { key: "management_fee", label: "管理費・共益費", hint: "実態に見合う水準か。" },
        { key: "guarantor", label: "保証会社費用", hint: "初回・更新料率の妥当性。" },
      ],
    },
    {
      key: "contract",
      label: "契約条件",
      items: [
        { key: "renewal_fee", label: "更新料", hint: "地域慣行と上限の確認。" },
        { key: "restoration", label: "原状回復特約", hint: "ガイドライン超の借主負担になっていないか。" },
      ],
    },
  ],
};
