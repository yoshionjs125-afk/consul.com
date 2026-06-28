import { ASSESSMENT_COLOR_TOKEN, type Assessment } from "../../../src/config/constants.js";
import { savingLowerBound, summarizeDiagnosis } from "../../../src/domain/diagnosis.js";
import { SAMPLE_RENTAL_REPORT } from "../../lib/mock.js";

const ASSESSMENT_LABEL: Record<Assessment, string> = {
  over: "高い",
  standard: "妥当",
  negotiate: "交渉余地",
};

const TONE_CLASS: Record<"danger" | "neutral" | "warning", string> = {
  danger: "tone-danger",
  neutral: "tone-neutral",
  warning: "tone-warning",
};

const BG_CLASS: Record<"danger" | "neutral" | "warning", string> = {
  danger: "bg-danger",
  neutral: "bg-neutral",
  warning: "bg-warning",
};

function yen(n: number): string {
  return `¥${n.toLocaleString("ja-JP")}`;
}

export default function DiagnosisSamplePage() {
  const report = SAMPLE_RENTAL_REPORT;
  const stats = summarizeDiagnosis(report);

  return (
    <section className="block">
      <div className="container">
        <h2 className="section-title">中立診断レポート（サンプル）</h2>
        <p className="section-sub">
          賃貸の初期費用見積りを項目別に評価した例です。これは実際の依頼ではなくサンプル表示です。
        </p>

        <div className="report-head">
          <div className="saving-highlight">
            <div className="label">想定削減額の目安（下限採用）</div>
            <div className="amount">{yen(stats.totalEstSaving)}</div>
            <div className="note">
              ※ 信頼性のため、各項目の見積りは控えめな下限値を合計しています。実際の削減額は交渉により変動します。
            </div>
          </div>
          <div className="counts">
            <span className={`count-pill ${BG_CLASS.danger}`}>高い: {stats.countByAssessment.over}件</span>
            <span className={`count-pill ${BG_CLASS.warning}`}>
              交渉余地: {stats.countByAssessment.negotiate}件
            </span>
            <span className={`count-pill ${BG_CLASS.neutral}`}>
              妥当: {stats.countByAssessment.standard}件
            </span>
          </div>
          <p style={{ marginTop: 16, marginBottom: 0 }}>{report.summary}</p>
        </div>

        {report.lineItems.map((item, i) => {
          const tone = ASSESSMENT_COLOR_TOKEN[item.assessment];
          const saving = savingLowerBound(item.saving);
          return (
            <div className={`report-item ${TONE_CLASS[tone]}`} key={i}>
              <div className="ri-top">
                <div>
                  <div className="ri-group">{item.group}</div>
                  <div className="ri-item">{item.item}</div>
                </div>
                <span className="assess-tag">{ASSESSMENT_LABEL[item.assessment]}</span>
              </div>
              <div className="ri-note">{item.note}</div>
              {saving > 0 && (
                <div className={`assess-saving ${tone === "danger" ? "" : ""}`}>
                  想定削減額: {yen(saving)}
                  {item.saving?.kind === "range" && <span className="fee-note">（〜{yen(item.saving.high)}）</span>}
                </div>
              )}
            </div>
          );
        })}

        <div className="notice">
          この診断は一般情報・相場比較に限定しています。特定の業者・商品への勧誘や、個別の投資・税務助言は行いません。
          最終判断はご自身で、必要に応じて専門家にご確認ください。
        </div>
      </div>
    </section>
  );
}
