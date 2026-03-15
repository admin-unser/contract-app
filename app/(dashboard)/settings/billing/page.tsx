"use client";

import { useEffect, useState } from "react";
import type { Plan, PlanId } from "@/lib/types";

interface BillingData {
  organization: {
    id: string;
    name: string;
    is_internal: boolean;
    has_billing: boolean;
  };
  subscription: {
    plan_id: PlanId;
    status: string;
    current_period_end: string | null;
    cancel_at: string | null;
  } | null;
  plan: Plan | null;
  usage: {
    documents_sent: number;
    documents_completed: number;
    limit: number | null;
  };
}

const PLAN_CARDS: {
  id: PlanId;
  name: string;
  price: string;
  priceNote: string;
  features: string[];
  highlighted?: boolean;
}[] = [
  {
    id: "free",
    name: "Free",
    price: "0",
    priceNote: "円 / 月",
    features: ["月5件まで送信", "1ユーザー", "テンプレート3件", "基本的な署名機能"],
  },
  {
    id: "starter",
    name: "Starter",
    price: "2,980",
    priceNote: "円 / 月",
    highlighted: true,
    features: [
      "月30件まで送信",
      "3ユーザーまで",
      "テンプレート20件",
      "AI契約リスク検出",
      "カスタムメール",
      "監査ログ",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: "5,000",
    priceNote: "円 / 月",
    features: [
      "送信無制限",
      "ユーザー無制限",
      "テンプレート無制限",
      "API連携",
      "Webhook / Zapier",
      "Starterの全機能",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "要相談",
    priceNote: "",
    features: [
      "Businessの全機能",
      "SSO / SAML認証",
      "専任サポート",
      "カスタム契約",
      "SLA保証",
    ],
  },
];

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<PlanId | null>(null);

  useEffect(() => {
    fetch("/api/billing/subscription")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleUpgrade(planId: PlanId) {
    if (planId === "free" || planId === "enterprise") return;
    setUpgrading(planId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const { url, error } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        alert(error || "エラーが発生しました");
      }
    } catch {
      alert("エラーが発生しました");
    } finally {
      setUpgrading(null);
    }
  }

  async function handleManageBilling() {
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const { url, error } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        alert(error || "エラーが発生しました");
      }
    } catch {
      alert("エラーが発生しました");
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  const currentPlanId = data?.subscription?.plan_id ?? "free";
  const isInternal = data?.organization?.is_internal ?? false;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">プラン・お支払い</h1>
      <p className="text-sm text-gray-500 mb-8">現在のプランと使用量を確認できます</p>

      {/* Current plan status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-gray-900">
                {isInternal ? "Business（社内メンバー）" : data?.plan?.name ?? "Free"}
              </span>
              {isInternal && (
                <span className="px-2.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                  無料
                </span>
              )}
              {data?.subscription?.status === "active" && !isInternal && (
                <span className="px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                  有効
                </span>
              )}
              {data?.subscription?.cancel_at && (
                <span className="px-2.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                  解約予定
                </span>
              )}
            </div>
            {data?.subscription?.current_period_end && !isInternal && (
              <p className="text-sm text-gray-500 mt-1">
                次回更新日: {new Date(data.subscription.current_period_end).toLocaleDateString("ja-JP")}
              </p>
            )}
          </div>
          {data?.organization?.has_billing && (
            <button
              onClick={handleManageBilling}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              支払い管理
            </button>
          )}
        </div>

        {/* Usage bar */}
        {data?.usage && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">今月の送信数</span>
              <span className="text-sm text-gray-500">
                {data.usage.documents_sent}
                {data.usage.limit !== null ? ` / ${data.usage.limit}件` : "件（無制限）"}
              </span>
            </div>
            {data.usage.limit !== null && (
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (data.usage.documents_sent / data.usage.limit) * 100)}%`,
                    background:
                      data.usage.documents_sent / data.usage.limit > 0.8
                        ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                        : "linear-gradient(90deg, #6366f1, #8b5cf6)",
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Plan cards */}
      {!isInternal && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLAN_CARDS.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            const isUpgrade =
              PLAN_CARDS.findIndex((p) => p.id === plan.id) >
              PLAN_CARDS.findIndex((p) => p.id === currentPlanId);

            return (
              <div
                key={plan.id}
                className={`rounded-xl border-2 p-6 transition-all ${
                  plan.highlighted
                    ? "border-indigo-500 bg-indigo-50/30 shadow-lg shadow-indigo-500/10"
                    : isCurrent
                    ? "border-gray-300 bg-gray-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                {plan.highlighted && (
                  <div className="text-xs font-bold text-indigo-600 mb-2 uppercase tracking-wide">
                    おすすめ
                  </div>
                )}
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
                  {plan.priceNote && (
                    <span className="text-sm text-gray-500 ml-1">{plan.priceNote}</span>
                  )}
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={plan.highlighted ? "#6366f1" : "#9ca3af"}
                        strokeWidth="2"
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="w-full py-2.5 text-center text-sm font-medium text-gray-500 bg-gray-100 rounded-lg">
                    現在のプラン
                  </div>
                ) : plan.id === "enterprise" ? (
                  <a
                    href="mailto:info@unser-inc.com?subject=MUSUBI sign Enterprise"
                    className="block w-full py-2.5 text-center text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    お問い合わせ
                  </a>
                ) : isUpgrade ? (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={upgrading !== null}
                    className={`w-full py-2.5 text-center text-sm font-bold text-white rounded-lg transition-all ${
                      plan.highlighted
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-600/20"
                        : "bg-gray-900 hover:bg-gray-800"
                    } disabled:opacity-50`}
                  >
                    {upgrading === plan.id ? "処理中..." : "アップグレード"}
                  </button>
                ) : (
                  <div className="w-full py-2.5 text-center text-sm font-medium text-gray-400">
                    ダウングレード
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isInternal && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 text-center">
          <p className="text-sm text-indigo-700">
            UNSER社内メンバーはBusiness相当の機能を無料でご利用いただけます。
          </p>
        </div>
      )}
    </div>
  );
}
