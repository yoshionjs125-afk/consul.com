"use client";

import { useState } from "react";
import type { CategorySlug } from "../../src/config/constants.js";
import { computeFeeBreakdown } from "../../src/domain/fees.js";
import { CATEGORY_LABELS, DEMO_ADVISORS, RANK_LABELS } from "../lib/mock.js";

type Filter = CategorySlug | "all";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "rental", label: "賃貸" },
  { key: "purchase", label: "売買" },
  { key: "custom_home", label: "注文住宅" },
];

function yen(n: number): string {
  return `¥${n.toLocaleString("ja-JP")}`;
}

export default function AdvisorsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const advisors =
    filter === "all" ? DEMO_ADVISORS : DEMO_ADVISORS.filter((a) => a.categories.includes(filter));

  return (
    <section className="block">
      <div className="container">
        <h2 className="section-title">アドバイザーを探す</h2>
        <p className="section-sub">
          資格・実務歴を運営が検証済み。個社名は表示せず、匿名表示と元業界ラベルのみを掲載しています。
        </p>

        <div className="filters">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`chip ${filter === f.key ? "active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="advisor-grid">
          {advisors.map((a) => (
            <div className="card" key={a.id}>
              <div className="top">
                <div className="avatar">{a.displayName.slice(0, 1)}</div>
                <div style={{ flex: 1 }}>
                  <div className="name">
                    {a.displayName}さん <span className="rank-tag">{RANK_LABELS[a.rank]}</span>
                  </div>
                  <div className="sub">
                    {a.formerIndustryLabel}・実務{a.yearsExperience}年
                  </div>
                </div>
              </div>

              <div>
                {a.verifiedCredentials.map((c) => (
                  <span className="verified" key={c}>
                    ✓ {c}
                  </span>
                ))}
              </div>

              <p className="bio">{a.bio}</p>

              <div className="cat-tags">
                {a.categories.map((c) => (
                  <span className="cat-tag" key={c}>
                    {CATEGORY_LABELS[c]}
                  </span>
                ))}
              </div>

              {a.offerings.map((o, i) => {
                const fee = computeFeeBreakdown(o.price, o.feeRate);
                return (
                  <div className="offering" key={i}>
                    <div>
                      <div className="o-label">{o.label}</div>
                      <div className="fee-note">
                        内訳: アドバイザー受取 {yen(fee.advisorPayout)} / 運営手数料{" "}
                        {Math.round(o.feeRate * 100)}%（{yen(fee.platformFee)}）
                      </div>
                    </div>
                    <div className="o-price">{yen(o.price)}</div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
