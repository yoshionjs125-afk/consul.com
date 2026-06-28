const PILLARS = [
  { num: "🚫", t: "何も売らない", d: "中立な立場での相談・診断のみ。商品の勧誘はしません。" },
  { num: "📋", t: "明朗会計", d: "運営が価格を固定し、手数料の内訳を常に開示します。" },
  { num: "🛡️", t: "信頼性 重視", d: "資格・実務歴を運営が検証したアドバイザーのみ。" },
  { num: "⏱️", t: "副業に最適", d: "会社員・元業界人が低拘束で専門知識を活かせます。" },
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>
            住まいの決断を、
            <br />
            「何も売らない」プロに相談。
          </h1>
          <p className="lead">
            賃貸・売買・注文住宅の意思決定について、検証済みの有資格者が定額報酬で中立の相談・診断を提供します。
            利害のない第三者のセカンドオピニオンで、納得して決められます。
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <a className="btn" href="/advisors">
              アドバイザーを探す
            </a>
            <a className="btn secondary" href="/diagnosis/sample">
              中立診断の例を見る
            </a>
          </div>

          <div className="pillars">
            {PILLARS.map((p) => (
              <div className="pillar" key={p.t}>
                <div className="num">{p.num}</div>
                <div className="t">{p.t}</div>
                <div className="d">{p.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="block">
        <div className="container">
          <h2 className="section-title">使い方は3ステップ</h2>
          <p className="section-sub">相談は入口、成果物の「中立診断」で具体的に判断できます。</p>
          <div className="advisor-grid">
            <div className="card">
              <div className="name">1. 相談する</div>
              <p className="bio">
                対応カテゴリで絞り込み、アドバイザーを選んで予約。チャット・電話・オンラインで相談します。
              </p>
            </div>
            <div className="card">
              <div className="name">2. 中立診断を注文（任意）</div>
              <p className="bio">
                相談後、システムが定額メニューで診断を提示。見積書などをアップロードして注文します。
                アドバイザーから売り込まれることはありません。
              </p>
            </div>
            <div className="card">
              <div className="name">3. 結果を確認して評価</div>
              <p className="bio">
                項目ごとに「高い／妥当／交渉余地」を色分け表示。想定削減額の目安が分かります。
                内容を確認のうえ評価します。
              </p>
            </div>
            <div className="card">
              <div className="name">明朗会計</div>
              <p className="bio">
                価格は運営が固定。手数料の内訳（運営の取り分とアドバイザー受取額）を常に表示します。
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
