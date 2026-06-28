import type { DiagnosisTemplate } from "./types.js";

/** 売買：購入諸費用・契約条件の中立診断テンプレ。媒介・個別投資助言は行わない（§2, FR-62）。 */
export const purchaseTemplate: DiagnosisTemplate = {
  category: "purchase",
  title: "売買 購入諸費用 中立診断",
  requiredInputs: ["重要事項説明書（写）", "売買契約書（案）", "諸費用見積書"],
  groups: [
    {
      key: "transaction_fees",
      label: "取引諸費用",
      items: [
        { key: "brokerage_fee", label: "仲介手数料", hint: "(価格×3%+6万円)+税の上限を超えていないか。" },
        { key: "loan_fees", label: "ローン事務手数料・保証料", hint: "定額型/定率型の比較と相場。" },
        { key: "registration", label: "登記費用（登録免許税・司法書士報酬）", hint: "報酬部分の相場との比較。" },
      ],
    },
    {
      key: "taxes",
      label: "税・公租公課",
      items: [
        { key: "stamp_duty", label: "印紙税", hint: "契約金額帯に対する正しい額か。" },
        { key: "property_tax_settlement", label: "固定資産税等清算金", hint: "起算日・日割計算の妥当性。" },
        { key: "acquisition_tax", label: "不動産取得税（見込）", hint: "軽減措置の適用可否を一般情報として確認。" },
      ],
    },
    {
      key: "contract_terms",
      label: "契約条件",
      items: [
        { key: "deposit", label: "手付金", hint: "売買価格に対する割合の妥当性と保全。" },
        { key: "contingency", label: "ローン特約・解除条件", hint: "買主保護条項が確保されているか。" },
        { key: "defect_liability", label: "契約不適合責任", hint: "免責・期間設定が一方的でないか。" },
      ],
    },
    {
      key: "diligence",
      label: "物件確認",
      items: [
        { key: "price_comparison", label: "価格の相場比較", hint: "近隣成約・売出事例との比較（一般情報）。" },
        { key: "inspection", label: "建物状況調査の有無", hint: "インスペクション実施・指摘事項の有無。" },
      ],
    },
  ],
};
