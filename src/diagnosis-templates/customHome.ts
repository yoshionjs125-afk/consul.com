import type { DiagnosisTemplate } from "./types.js";

/** 注文住宅：見積書・契約の中立診断テンプレ。特定業者誘導は禁止、相場比較に限定（FR-62）。 */
export const customHomeTemplate: DiagnosisTemplate = {
  category: "custom_home",
  title: "注文住宅 見積り 中立診断",
  requiredInputs: ["工事見積書（内訳明細）", "設計図書（あれば）", "工事請負契約書（案）"],
  groups: [
    {
      key: "estimate_structure",
      label: "見積構成",
      items: [
        { key: "itemization", label: "内訳の明朗性", hint: "一式計上が多く内訳不明な項目がないか。" },
        { key: "provisional_sum", label: "別途・予備費（仮設・地盤改良等）", hint: "過大/不足の見込み。後出し増額リスク。" },
        { key: "spec_match", label: "仕様と見積の整合", hint: "図面・仕様書と見積項目が一致しているか。" },
      ],
    },
    {
      key: "unit_costs",
      label: "単価・数量",
      items: [
        { key: "unit_price", label: "主要項目の単価", hint: "建材・設備の単価が相場と乖離していないか。" },
        { key: "quantity", label: "数量・歩掛", hint: "面積・数量の拾いが過大でないか。" },
        { key: "equipment", label: "住宅設備グレード", hint: "標準/オプションの線引きと価格妥当性。" },
      ],
    },
    {
      key: "fees",
      label: "諸経費",
      items: [
        { key: "overhead_rate", label: "現場・一般管理費率", hint: "工事原価に対する比率の相場感。" },
        { key: "design_fee", label: "設計・確認申請費", hint: "二重計上や過大計上がないか。" },
      ],
    },
    {
      key: "contract_terms",
      label: "契約条件",
      items: [
        { key: "payment_schedule", label: "支払時期・出来高", hint: "前払い偏重で出来高と乖離していないか。" },
        { key: "change_orders", label: "変更・追加工事の取扱い", hint: "単価・承認プロセスが事前合意されているか。" },
        { key: "warranty", label: "保証・アフター", hint: "瑕疵保険・保証範囲・期間の確認。" },
      ],
    },
  ],
};
