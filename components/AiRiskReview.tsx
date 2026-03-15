"use client";

import { useState } from "react";

interface RiskItem {
  severity: "high" | "medium" | "low";
  clause: string;
  issue: string;
  suggestion: string;
}

interface ReviewResult {
  summary: string;
  overall_risk: "high" | "medium" | "low";
  risks: RiskItem[];
  missing_clauses: string[];
  positive_points: string[];
}

const SEVERITY_CONFIG = {
  high: { label: "高", bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-700" },
  medium: { label: "中", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
  low: { label: "低", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", badge: "bg-blue-100 text-blue-700" },
};

export function AiRiskReview({ documentId, pdfText }: { documentId: string; pdfText?: string }) {
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReview() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/risk-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, text: pdfText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "分析に失敗しました");
        return;
      }
      setResult(data);
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  if (!result) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900">AI契約リスク検出</h3>
            <p className="text-xs text-gray-500">AIが契約書のリスクを自動分析します</p>
          </div>
        </div>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}
        <button
          onClick={handleReview}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-md shadow-purple-600/20"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              分析中...
            </span>
          ) : (
            "リスク分析を実行"
          )}
        </button>
      </div>
    );
  }

  const riskConfig = SEVERITY_CONFIG[result.overall_risk];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className={`px-6 py-4 ${riskConfig.bg} border-b ${riskConfig.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
                <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">AI契約リスク分析結果</h3>
              <p className="text-xs text-gray-500">{result.summary}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${riskConfig.badge}`}>
            リスク: {riskConfig.label}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Risks */}
        {result.risks.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-red-500">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              検出されたリスク ({result.risks.length}件)
            </h4>
            <div className="space-y-3">
              {result.risks.map((risk, i) => {
                const cfg = SEVERITY_CONFIG[risk.severity];
                return (
                  <div key={i} className={`rounded-lg border ${cfg.border} ${cfg.bg} p-4`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-sm font-bold text-gray-900">{risk.clause}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${cfg.badge} flex-shrink-0`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{risk.issue}</p>
                    <div className="flex items-start gap-2 bg-white/60 rounded-lg p-2.5">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" className="w-4 h-4 mt-0.5 flex-shrink-0">
                        <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
                      </svg>
                      <span className="text-xs text-gray-600">{risk.suggestion}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Missing clauses */}
        {result.missing_clauses.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-amber-500">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              欠落している条項
            </h4>
            <ul className="space-y-1.5">
              {result.missing_clauses.map((clause, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-amber-500 mt-1">-</span>
                  {clause}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Positive points */}
        {result.positive_points.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-green-500">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              良い点
            </h4>
            <ul className="space-y-1.5">
              {result.positive_points.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-1">+</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Re-analyze button */}
        <button
          onClick={handleReview}
          disabled={loading}
          className="w-full py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {loading ? "再分析中..." : "再分析する"}
        </button>
      </div>
    </div>
  );
}
