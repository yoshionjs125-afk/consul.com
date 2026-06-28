import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "中立相談プラットフォーム",
  description: "検証済みの有資格者が、定額報酬で何も売らずに中立の相談・診断を提供します。",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header className="site-header">
          <div className="container">
            <a href="/" className="logo">
              <span className="badge">中立</span>
              相談プラットフォーム
            </a>
            <nav className="nav">
              <a href="/">ホーム</a>
              <a href="/advisors">アドバイザーを探す</a>
              <a href="/diagnosis/sample">中立診断の例</a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="container">
            これはプレビュー画面です。表示データはサンプルで、ログイン・決済はまだ接続されていません（Stripe
            はテストモード前提）。法務・税務・規制の最終確認は専門家によります。
          </div>
        </footer>
      </body>
    </html>
  );
}
